# Job Processing Tracker App

## Частина 0 — Коротке проєктування

### User Scenarios

1. **Запуск обробки**: Користувач проходить wizard (Екран 1, 2) де вказує вхідні параметри ("бажання" і числове значення мети). На фінальному екрані обирає один з двох варіантів запуску обробки: HTTP Stream (SSE) або HTTP Polling.
2. **Отримання результату**:
   - **При HTTP Stream (Замість WebSockets)**: Користувач спостерігає за круговим прогрес-баром, який відображає точний відсоток виконання (0% -> 33% -> 66% -> 100%), отримуючи події в реальному часі через Server-Sent Events (SSE). Після 100% статус змінюється на `done` і виводиться результат (mock data з бази).
   - **При HTTP Polling**: Користувач бачить індетермінований (зациклений) лоадер, а UI раз на секунду викликає Server Action `getJobAction` (або `GET /api/jobs/:id`). Як тільки статус змінюється на `done`, відображається результат.

### Як працює Job Processing

- Backend написаний на Next.js (App Router). При виклику `createJobAction` (або `POST /api/jobs`) генерується унікальний ID, робота (job) зберігається в SQLite БД зі статусом `queued`.
- Відразу запускається функція-pipeline у фоні (Promise, що не блокує основний потік Request-Response).
- Pipeline емулює тривалу обробку через `setTimeout` (по 2 сек на кожен крок), поступово оновлюючи progress в базі даних (0 -> 33 -> 66 -> 100).

### Як оновлюється статус:

- **HTTP Stream (SSE)**: Аналог WebSockets для однонаправленого стрімінгу від сервера до клієнта. Оскільки Next.js без custom `server.ts` не підтримує WebSockets нативно, використано SSE (`/api/job-stream`). Клієнт підключається через `EventSource`, а сервер періодично надсилає події зі свіжими даними з SQLite БД.
- **HTTP Polling**: Клієнт постійно (раз на секунду) опитує бекенд через Next.js Server Action (`getJobAction`), яка дістає актуальні дані про прогрес прямо з SQLite. Також є підтримка стандартного REST (GET `/api/jobs/[id]`).

### High-level Diagram

```text
[ React Frontend ]
       |
       |  1. Server Action: createJobAction() / POST /api/jobs
       v
[ Next.js Backend ] ---> [ SQLite Database ] (INSERT id, status='queued')
       |
       |  2. Async bg pipeline starts -> (update DB)
       v
[ Pipeline Logic]
   Step 1 (wait 2s) -> DB progress=33%
   Step 2 (wait 2s) -> DB progress=66%
   Step 3 (wait 2s) -> DB progress=100%, status='done'
       |
       |  (Meanwhile Frontend receives data)
       v
   [ SSE Client (EventSource) ] (listens for stream) OR [ HTTP Poller ] (getJobAction every 1s)
```

---

## Архітектурні Рішення (Делівері)

- **Backend & Frontend разом**: Використовується архітектура Fullstack (Next.js 15 з App Router та Server Actions). Це дозволяє тримати API, DB та UI в одному репозиторії, ідеально для швидкості розробки та Server-Side Rendering (SSR).
- **База даних**: За запитом потрібна була мінімальна інтеграція БД. Використовується **SQLite** (`better-sqlite3`), що повністю емулює роботу з реляційною базою за допомогою SQL запитів на читання та запис, зберігаючи простоту та надійність без важких ORM.
- **WebSocket -> SSE**: Так як архітектура Next.js (Serverless) не має довготривалого процесу для WebSockets без сторонніх сервісів, для реалізації задачі "Event-driven оновлення статусу" використано стандарт Server-Sent Events (Native Web Stream `ReadableStream`), що ідеально підходить для трекінгу прогресу в Next.js.
- **Типізація та Functional Programming**: Використано функціональні типи-обгортки (Option, Except) з файлу `fp.ts` для управління необовʼязковими даними та усунення неявних станів.
- **UI/UX**: Tailwind CSS для мінімалістичного і сучасного вигляду (+ `motion` для приємних переходів між екранами). Прогрес-колесо намальовано через SVG circle з обчисленням `strokeDashoffset` для плавних анімацій.
