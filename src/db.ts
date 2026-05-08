import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobId, JobStatus } from "./types";
import { ValidPercent } from "./utils/toNumber/validPercent";

export const insertJob = async (
  supabase: SupabaseClient,
  id: JobId,
  status: JobStatus,
  progress: ValidPercent | null,
) => {
  const { error } = await supabase
    .from("jobs")
    .insert([{ id, status, progress }]);
  if (error) console.error("Insert Job Error:", error);
};

export const getJob = async (supabase: SupabaseClient, id: JobId) => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code !== "PGRST116") console.error("Get Job Error:", error);
    return null;
  }
  return data;
};

export const getAllJobs = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) {
    console.error("Get All Jobs Error:", error);
    return [];
  }
  return data;
};

export const updateJob = async (
  supabase: SupabaseClient,
  id: JobId,
  updates: {
    status?: JobStatus;
    progress?: ValidPercent | null;
    result?: string | null;
  },
) => {
  const { error } = await supabase.from("jobs").update(updates).eq("id", id);
  if (error) console.error("Update Job Error:", error);
};
