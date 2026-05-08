import { unknown_toNonEmptyString_orUndefined_afterTrim } from "@/utils/non-empty-string-trimmed";

export const getSupabaseUrl = () =>
  unknown_toNonEmptyString_orUndefined_afterTrim(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ) ??
  (() => {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL not present");
  })();

export const getSupabasePublishableKey = () =>
  unknown_toNonEmptyString_orUndefined_afterTrim(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ) ??
  (() => {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not present");
  })();
