import { createJobAction } from "../../actions";

export async function POST(req: Request) {
  try {
    const jobId = await createJobAction();
    return Response.json({ id: jobId, status: "queued", progress: 0 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
