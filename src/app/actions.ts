"use server";
import { v4 as uuidv4 } from "uuid";
import { insertJob, getJob, getAllJobs } from "../db";
import { processJobPipeline } from "../pipeline";
import { JobState } from "../types";
import { numberToValidPercentOrUndefined } from "../fp";

export async function createJobAction() {
  const jobId = uuidv4();
  await insertJob(jobId, "queued", 0);

  // start processing in background
  processJobPipeline(jobId).catch(console.error);

  return jobId;
}

export async function getJobAction(jobId: string): Promise<JobState | null> {
  const row = await getJob(jobId);
  if (!row) return null;

  switch (row.status) {
    case "queued":
      return { t: "queued" };
    case "processing":
      return {
        t: "processing",
        progress: numberToValidPercentOrUndefined(row.progress) || (0 as any),
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
  const rows = await getAllJobs();
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    progress: row.progress,
    result: row.result,
    createdAt: row.createdAt,
  }));
}
