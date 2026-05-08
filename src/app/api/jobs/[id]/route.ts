import { NextResponse } from "next/server";
import { getJob } from "@/db";
import { createAdminClient } from "@/supabase/admin";
import { JobId } from "@/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const jobId = id as JobId;
  try {
    const supabase = createAdminClient();

    // Fetch the updated state
    const row = await getJob(supabase, jobId);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      t: row.status === "idle" ? "idle" : row.status,
      ...(row.status === "processing" && { progress: row.progress || 0 }),
      ...(row.status === "done" && { result: row.result }),
      ...(row.status === "failed" && { error: row.result }),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
