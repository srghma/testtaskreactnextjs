import { getJobAction } from "../../../actions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const state = await getJobAction(id);
    if (!state) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(state);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
