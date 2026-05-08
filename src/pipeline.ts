import { getJob, updateJob } from "./db";
import { createAdminClient } from "@/supabase/admin";
import { JobId } from "./types";
import { number_toValidPercent_unsafe } from "./utils/toNumber/validPercent";

export const processJobPipeline = async (jobId: JobId) => {
  console.log(`[Pipeline] Starting for job: ${jobId}`);
  const supabase = createAdminClient();

  try {
    const row = await getJob(supabase, jobId);
    console.log(`[Pipeline] Current job status: ${row?.status}`);
    if (!row || row.status === "done" || row.status === "failed") {
      console.log(`[Pipeline] Job already completed or not found. Exiting.`);
      return;
    }

    console.log(`[Pipeline] Setting status to processing (0%)`);
    await updateJob(supabase, jobId, {
      status: "processing",
      progress: number_toValidPercent_unsafe(0),
    });

    // Pipeline Step 1
    console.log(`[Pipeline] Waiting for step 1...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`[Pipeline] Updating to 33%`);
    await updateJob(supabase, jobId, {
      progress: number_toValidPercent_unsafe(33),
    });

    // Pipeline Step 2
    console.log(`[Pipeline] Waiting for step 2...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`[Pipeline] Updating to 66%`);
    await updateJob(supabase, jobId, {
      progress: number_toValidPercent_unsafe(66),
    });

    // Pipeline Step 3
    console.log(`[Pipeline] Waiting for step 3...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`[Pipeline] Updating to done (100%)`);
    await updateJob(supabase, jobId, {
      status: "done",
      progress: null,
      result: "SUCCESS! Your item is ready.",
    });
    console.log(`[Pipeline] Job completed successfully.`);
  } catch (err) {
    console.error(`[Pipeline] ERROR for job ${jobId}:`, err);
    await updateJob(supabase, jobId, {
      status: "failed",
      progress: null,
      result: "Error during processing",
    });
  }
};
