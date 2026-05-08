import { getJob } from "../../../db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("id");

  if (!jobId) {
    return new Response("Missing job ID", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection successful
      controller.enqueue(encoder.encode(`: connected\n\n`));

      let isClosed = false;

      const poll = async () => {
        if (isClosed) return;

        try {
          const row = await getJob(jobId);
          if (row) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(row)}\n\n`),
            );

            if (row.status === "done" || row.status === "failed") {
              isClosed = true;
              controller.close();
              return;
            }
          } else {
            isClosed = true;
            controller.close();
            return;
          }
        } catch (e) {
          console.error(e);
        }

        setTimeout(poll, 500);
      };

      poll();

      // Cleanup if disconnected
      req.signal.addEventListener("abort", () => {
        isClosed = true;
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
