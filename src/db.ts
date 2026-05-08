import { supabase } from "./supabase";

export const insertJob = async (
  id: string,
  status: string,
  progress: number,
) => {
  const { error } = await supabase
    .from("jobs")
    .insert([{ id, status, progress }]);
  if (error) console.error("Insert Job Error:", error);
};

export const getJob = async (id: string) => {
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

export const getAllJobs = async () => {
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

export const updateJobProgress = async (progress: number, id: string) => {
  const { error } = await supabase
    .from("jobs")
    .update({ progress })
    .eq("id", id);
  if (error) console.error("Update Progress Error:", error);
};

export const updateJobStatus = async (
  status: string,
  result: string | null,
  id: string,
) => {
  const { error } = await supabase
    .from("jobs")
    .update({ status, result })
    .eq("id", id);
  if (error) console.error("Update Status Error:", error);
};
