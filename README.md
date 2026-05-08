# Job Processing Tracker App

## Частина 0 — Коротке проєктування

### User Scenarios

1. **Запуск обробки**: Користувач заходить на сторінку, проходить простий wizard (Екран 1: вибір опції, Екран 2: введення числового значення цілі). На фінальному екрані обирає один з двох варіантів запуску обробки: через WebSocket або HTTP Polling.
2. **Отримання результату**:
   - **При WebSocket**: Після кліку миттєво створюється Job у базі даних, а клієнт відкриває WebSocket з'єднання (`ws://.../api/job-ws`). Користувач бачить круговий прогрес-бар, який плавно заповнюється (0% -> 33% -> 66% -> 100%) за рахунок повідомлень в реальному часі. Після 100% статус змінюється на `done` і виводиться фінальний результат.
   - **При HTTP Polling**: Створюється Job. Користувач бачить індетермінований (нескінченний) лоадер, а UI раз на певний проміжок часу опитує бекенд (`GET /api/jobs/:id`). Як тільки статус змінюється на `done`, відображається результат.

### Як працює Job Processing

- Frontend відправляє `POST /api/jobs`. Бекенд створює новий запис (Job) в Supabase (PostgreSQL) зі статусом `queued`.
- Відразу запускається асинхронний pipeline у фоні, який складається з 3 кроків.
- Кожен крок виконує свою логіку (з імітацією затримки через `setTimeout`) і по завершенню оновлює `progress` (у відсотках) та `status` (`processing` або `done`/`failed`) в БД Supabase.

### Як оновлюється статус (WebSocket / HTTP)

- **WebSocket**: Для двостороннього зв'язку та realtime-оновлень використовується нативний `WebSocketPair` від Cloudflare Workers. Під час підключення до `/api/job-ws`, worker відкриває сокет і починає регулярно вичитувати статус з БД (або отримувати нотифікації) і пушити оновлення безпосередньо клієнту.
- **HTTP**: Клієнтська частина робить `setInterval` з викликом `fetch('/api/jobs/:id')`, отримуючи актуальний стан з БД.

### High-level Diagram

```text
[ React Frontend ]
       |
       |  1. POST /api/jobs
       v
[ Cloudflare Worker / Next.js API ] ---> [ Supabase DB ] (INSERT status='queued')
       |                                       ^
       |  2. Async bg pipeline starts          | 3. UPDATE progress (33%, 66%, 100%)
       v                                       |
[ Pipeline Logic] -----------------------------+
   Step 1 (wait)
   Step 2 (wait)
   Step 3 (done)

[ Frontend Updater ]
       |
       +--> WebSocket (ws://) ---> [ CF Worker WebSocketPair ] ---> [ Supabase DB ] (Reads latest progress)
       |
       +--> HTTP Polling (fetch) ---> [ GET /api/jobs/:id ] ---> [ Supabase DB ]
```

---

## Архітектурні Рішення (Делівері)

- **Cloudflare Workers (vinext)**: Так як звичайний Next.js (Serverless) не має довготривалого процесу для WebSockets, ми використовуємо `vinext` + `@cloudflare/vite-plugin`. Це дозволяє запускати Next.js App Router прямо на інфраструктурі Cloudflare Workers і нативно підтримувати WebSockets через об'єкт `WebSocketPair`.
- **База даних**: Використовується **Supabase (PostgreSQL)** для збереження актуального стану Job. Мінімальна структура таблиці `jobs`: `id`, `status`, `progress`, `createdAt`, `result`.
- **UI/UX**: Tailwind CSS для базової верстки та `motion` для приємних переходів. Прогрес-бар намальований через SVG з використанням `strokeDashoffset`.
