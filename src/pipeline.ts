import { updateJobProgress, updateJobStatus } from "./db";

const processingJobs = new Set<string>();

export const processJobPipeline = async (jobId: string) => {
  if (processingJobs.has(jobId)) return;
  processingJobs.add(jobId);

  try {
    // Step 1: Processing started
    await updateJobStatus("processing", null, jobId);

    // Pipeline Step 1: Data Preparation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await updateJobProgress(33, jobId);

    // Pipeline Step 2: AI Inference (mock)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await updateJobProgress(66, jobId);

    // Pipeline Step 3: Result Generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await updateJobProgress(100, jobId);
    await updateJobStatus("done", "SUCCESS! Your item is ready.", jobId);
  } catch (error) {
    await updateJobStatus("failed", "Error during processing", jobId);
  } finally {
    processingJobs.delete(jobId);
  }
};
