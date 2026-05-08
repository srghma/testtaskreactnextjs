import { ValidPercent } from "./fp";

export type JobState =
  | { t: "idle" }
  | { t: "queued" }
  | { t: "processing"; progress: ValidPercent }
  | { t: "done"; result: string }
  | { t: "failed"; error: string };
