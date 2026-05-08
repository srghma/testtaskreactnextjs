"use server";
import { v4 as uuidv4 } from "uuid";
import { insertJob, getJob, getAllJobs } from "../db";
import { JobState, JobId } from "../types";
import { createAdminClient } from "@/supabase/admin";
import {
  numberToValidPercentOrUndefined,
  ValidPercent,
} from "@/utils/toNumber/validPercent";

export async function createJobAction() {
  const jobId = uuidv4() as JobId;
  const supabase = createAdminClient();
  await insertJob(supabase, jobId, "queued", null);

  return jobId;
}

export async function getJobAction(jobId: JobId): Promise<JobState | null> {
  const supabase = createAdminClient();
  const row = await getJob(supabase, jobId);
  if (!row) return null;

  switch (row.status) {
    case "queued":
      return { t: "queued" };
    case "processing":
      return {
        t: "processing",
        progress:
          numberToValidPercentOrUndefined(row.progress) || (0 as ValidPercent),
      };
    case "done":
      return { t: "done", result: row.result };
    case "failed":
      return { t: "failed", error: row.result };
    default:
      return { t: "idle" };
  }
}

export async function getAllJobsAction() {
  const supabase = createAdminClient();
  const rows = await getAllJobs(supabase);
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    progress: row.progress,
    result: row.result,
    createdAt: row.createdAt,
  }));
}
