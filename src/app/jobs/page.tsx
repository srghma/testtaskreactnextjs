"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import * as v from "valibot";
import { NonEmptyStringTrimmedSchema } from "@/utils/non-empty-string-trimmed-valibot";
import { ValidPercentSchema } from "@/utils/toNumber/validPercent-valibot";

const JobRowSchema = v.object({
  id: NonEmptyStringTrimmedSchema,
  status: NonEmptyStringTrimmedSchema,
  progress: v.nullable(v.optional(ValidPercentSchema)),
  createdAt: v.string(),
  result: v.nullable(v.optional(NonEmptyStringTrimmedSchema)),
});

type JobRow = v.InferOutput<typeof JobRowSchema>;

const JobsResponseSchema = v.union([
  v.array(JobRowSchema),
  v.object({ error: NonEmptyStringTrimmedSchema }),
]);

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await fetch("/api/jobs");
        const rawData = await response.json();
        const data = v.parse(JobsResponseSchema, rawData);
        if (!("error" in data)) {
          setJobs(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();

    // Poll for new jobs
    const interval = setInterval(loadJobs, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-medium">All Global Jobs</h1>
          <Link
            href="/"
            className="bg-emerald-400 text-white px-4 py-2 rounded-full font-semibold hover:bg-emerald-500 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-emerald-400 w-10 h-10" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                  <th className="p-4 font-medium">Job ID</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Progress</th>
                  <th className="p-4 font-medium">Created At</th>
                  <th className="p-4 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="p-4 indent-0 font-mono text-xs">{job.id}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          job.status === "done"
                            ? "bg-emerald-100 text-emerald-700"
                            : job.status === "processing"
                              ? "bg-blue-100 text-blue-700"
                              : job.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {job.progress != null ? `${job.progress}%` : "-"}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-slate-500 truncate max-w-[200px]">
                      {job.result || "-"}
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No jobs found in the global database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
