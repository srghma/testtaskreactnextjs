import { NextResponse } from "next/server";
import { after } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { insertJob, getAllJobs } from "@/db";
import { createAdminClient } from "@/supabase/admin";
import { JobId } from "@/types";
import { processJobPipeline } from "@/pipeline";

export async function POST() {
  try {
    const jobId = uuidv4() as JobId;
    const supabase = createAdminClient();
    console.log(`[API] Creating job ${jobId}. Runtime: ${process.env.NEXT_RUNTIME}.`);

    await insertJob(supabase, jobId, "queued", null);

    const runPipeline = async () => {
      console.log(`[API] Starting background pipeline for ${jobId}`);
      try {
        await processJobPipeline(jobId);
        console.log(`[API] Background pipeline finished for ${jobId}`);
      } catch (err) {
        console.error(`[API] Background pipeline FAILED for ${jobId}:`, err);
      }
    };

    console.log(`[API] Using after() for ${jobId}`);
    after(runPipeline);

    return NextResponse.json({ id: jobId, status: "queued", progress: 0 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[API] POST /api/jobs error:`, error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const rows = await getAllJobs(supabase);
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
