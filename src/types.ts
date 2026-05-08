import { NonEmptyStringTrimmed } from "./utils/non-empty-string-trimmed";
import { ValidPercent } from "./utils/toNumber/validPercent";

export type JobId = NonEmptyStringTrimmed & { _brandJobId: "JobId" };

export type JobStatus = "queued" | "processing" | "done" | "failed";

export type JobState =
  | { t: "idle" }
  | { t: "queued" }
  | { t: "processing"; progress: ValidPercent }
  | { t: "done"; result: NonEmptyStringTrimmed }
  | { t: "failed"; error: NonEmptyStringTrimmed };
