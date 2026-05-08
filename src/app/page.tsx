"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Check, ArrowLeft, Trophy, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { JobState } from "../types";
import { createClient } from "@/supabase/client";
import * as v from "valibot";
import { number_toValidPercent_unsafe } from "@/utils/toNumber/validPercent";
import {
  Option_none,
  Option_some,
  Option_isSome,
  type Option,
} from "@/utils/types";
import {
  nonEmptyString_afterTrim,
  String_toNonEmptyStringTrimmed_unsafe,
} from "@/utils/non-empty-string-trimmed";
import { NonEmptyStringTrimmedSchema } from "@/utils/non-empty-string-trimmed-valibot";
import { ValidPercentSchema } from "@/utils/toNumber/validPercent-valibot";

const CreateJobResponseSchema = v.object({
  id: NonEmptyStringTrimmedSchema,
});

const JobStateResponseSchema = v.union([
  v.object({ t: v.literal("idle") }),
  v.object({ t: v.literal("queued") }),
  v.object({ t: v.literal("processing"), progress: ValidPercentSchema }),
  v.object({ t: v.literal("done"), result: NonEmptyStringTrimmedSchema }),
  v.object({ t: v.literal("failed"), error: NonEmptyStringTrimmedSchema }),
  v.object({ error: NonEmptyStringTrimmedSchema }),
]);

const PayloadNewSchema = v.object({
  status: NonEmptyStringTrimmedSchema,
  result: v.nullable(v.optional(NonEmptyStringTrimmedSchema)),
  progress: v.nullable(v.optional(ValidPercentSchema)),
});

type Unit = "kg" | "lbs";

export default function App() {
  const [step, setStep] = useState(1);
  const [wish, setWish] = useState<Option<string>>(Option_none);
  const [unit, setUnit] = useState<Unit>("kg");
  const [currentWeight, setCurrentWeight] = useState<string>("");
  const [goalWeight, setGoalWeight] = useState<string>("");

  const handleNext = () => {
    if (step === 2) {
      const cur = parseFloat(currentWeight);
      if (!isNaN(cur)) {
        const minLimit = unit === "kg" ? 10 : 22;
        const prefilled = Math.max(cur * 0.95, minLimit).toFixed(1);
        setGoalWeight(prefilled);
      }
    }
    setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => Math.max(1, s - 1));
  const handleReset = () => {
    setStep(1);
    setWish(Option_none);
    setCurrentWeight("");
    setGoalWeight("");
  };

  const totalSteps = 4;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header & Progress Bar */}
      <div className="w-full bg-white fixed top-0 z-20">
        <div className="h-14 flex items-center px-4 max-w-2xl mx-auto w-full relative">
          {step > 1 && step < 4 && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 text-center">
            <Link
              href="/jobs"
              className="text-xs font-bold text-emerald-500 hover:text-emerald-600 uppercase tracking-widest"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <div className="w-full h-1 bg-slate-100">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto pt-20 px-4 pb-20">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Screen1
              key="s1"
              wish={wish}
              setWish={setWish}
              onNext={handleNext}
            />
          )}
          {step === 2 && (
            <WeightSelection
              key="s2"
              type="current"
              value={currentWeight}
              setValue={setCurrentWeight}
              unit={unit}
              setUnit={setUnit}
              onNext={handleNext}
            />
          )}
          {step === 3 && (
            <WeightSelection
              key="s3"
              type="goal"
              value={goalWeight}
              setValue={setGoalWeight}
              unit={unit}
              setUnit={setUnit}
              onNext={handleNext}
            />
          )}
          {step === 4 && <Screen4 key="s4" onReset={handleReset} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Screen 1: Wish Selection ---
interface Screen1Props {
  wish: Option<string>;
  setWish: (w: Option<string>) => void;
  onNext: () => void;
}
function Screen1({ wish, setWish, onNext }: Screen1Props) {
  const wishes = [
    { id: "w1", icon: "😌", text: "Reduce Stress" },
    { id: "w2", icon: "😴", text: "Better Sleep" },
    { id: "w3", icon: "⚖️", text: "More Balance" },
    { id: "w4", icon: "💚", text: "Healthier Habits" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md"
    >
      <h1 className="text-3xl font-bold text-center mb-10 text-slate-900">
        What is your main wish?
      </h1>
      <div className="flex flex-col gap-3 mb-10">
        {wishes.map((w) => (
          <button
            key={w.id}
            onClick={() => setWish(Option_some(w.id))}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 ${Option_isSome(wish) && wish.v === w.id
                ? "border-emerald-500 bg-white shadow-md"
                : "border-transparent bg-white shadow-sm hover:border-slate-200"
              }`}
          >
            <span className="text-2xl">{w.icon}</span>
            <span className="text-lg font-semibold">{w.text}</span>
            {Option_isSome(wish) && wish.v === w.id && (
              <div className="ml-auto bg-emerald-500 rounded-full p-1">
                <Check className="text-white w-4 h-4" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          disabled={!Option_isSome(wish)}
          className="w-full py-4 rounded-full bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-200 disabled:bg-emerald-200 disabled:shadow-none hover:bg-emerald-600 transition-all transform active:scale-95"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}

// --- Shared: Weight Selection ---
interface WeightSelectionProps {
  type: "current" | "goal";
  value: string;
  setValue: (v: string) => void;
  unit: Unit;
  setUnit: (u: Unit) => void;
  onNext: () => void;
}
function WeightSelection({
  type,
  value,
  setValue,
  unit,
  setUnit,
  onNext,
}: WeightSelectionProps) {
  const limits = useMemo(
    () => (unit === "kg" ? { min: 10, max: 200 } : { min: 22, max: 485 }),
    [unit],
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = 1;
      const cur = parseFloat(value);
      let next: number;

      if (isNaN(cur)) {
        next = limits.min;
      } else {
        next = e.deltaY < 0 ? cur + step : cur - step;
      }

      const clamped = Math.max(limits.min, Math.min(limits.max, next));
      setValue(clamped % 1 === 0 ? clamped.toString() : clamped.toFixed(1));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [value, limits, setValue]);

  const numValue = parseFloat(value);
  const isValid =
    !isNaN(numValue) && numValue >= limits.min && numValue <= limits.max;
  const isError = value !== "" && !isValid;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md flex flex-col items-center"
    >
      <h1 className="text-3xl font-bold text-center mb-8 text-slate-900 leading-tight">
        What is your{" "}
        {type === "goal" && <span className="text-emerald-500">goal</span>}{" "}
        weight?
      </h1>

      {/* Unit Toggle */}
      <div className="bg-slate-200/50 p-1 rounded-full flex mb-12 w-32">
        {(["lbs", "kg"] as const).map((u) => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={`flex-1 py-1.5 rounded-full text-sm font-bold transition-all ${unit === u
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-500"
              }`}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Large Input */}
      <div className="mb-10 w-full flex flex-col items-center">
        <div className="flex items-baseline justify-center gap-3 border-b-2 border-slate-200 focus-within:border-emerald-500 transition-colors px-4 pb-2 group">
          <input
            ref={inputRef}
            type="number"
            min="0"
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") {
                e.preventDefault();
              }
            }}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Weight ${unit}`}
            className="text-6xl font-light w-44 text-center focus:outline-none bg-transparent placeholder:text-slate-200 placeholder:text-3xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-3xl font-medium text-slate-400 group-focus-within:text-emerald-500 transition-colors">
            {unit}
          </span>
        </div>
        <p
          className={`mt-4 text-sm font-medium ${isError ? "text-red-500" : "text-slate-400"}`}
        >
          Please enter a value{" "}
          {unit === "kg"
            ? "from 10 kg to 200 kg"
            : `between ${limits.min} lbs and ${limits.max} lbs`}
        </p>
      </div>

      {/* Callout Box (Goal variant only) */}
      {type === "goal" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-10 flex flex-col items-center text-center shadow-sm">
          <div className="bg-emerald-100 p-3 rounded-full mb-4">
            <Trophy className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            <span className="font-bold text-slate-900">
              Goal: Lose 5% of your weight.
            </span>{" "}
            Even small, steady changes can make a meaningful difference. We’ll
            support you with a balanced plan to help you feel lighter,
            healthier, and more confident over time.
          </p>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full py-4 rounded-full bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-200 disabled:bg-emerald-100 disabled:text-emerald-300 disabled:shadow-none hover:bg-emerald-600 transition-all transform active:scale-95 mt-auto"
      >
        Continue
      </button>
    </motion.div>
  );
}

// --- Screen 4: Processing / Result ---
function Screen4({ onReset }: { onReset: () => void }) {
  const [jobState, setJobState] = useState<JobState>({ t: "queued" });

  const startProcess = async () => {
    try {
      const res = await fetch("/api/jobs", { method: "POST" });
      const rawData = await res.json();
      const data = v.parse(CreateJobResponseSchema, rawData);
      const id = data.id;

      const supabase = createClient();
      const initialRes = await fetch(`/api/jobs/${id}`);
      const rawInitialState = await initialRes.json();
      const initialState = v.parse(JobStateResponseSchema, rawInitialState);
      if (!("error" in initialState)) {
        setJobState(initialState as JobState);
      }

      const channel = supabase
        .channel(`job-${id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "jobs",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            const parsed = v.safeParse(PayloadNewSchema, payload.new);
            if (parsed.success) {
              const row = parsed.output;
              let newState: JobState;
              if (row.status === "done") {
                newState = {
                  t: "done",
                  result: nonEmptyString_afterTrim(row.result || "Success"),
                };
              } else if (row.status === "failed") {
                newState = {
                  t: "failed",
                  error:
                    String_toNonEmptyStringTrimmed_unsafe("Processing failed"),
                };
              } else if (row.status === "processing") {
                newState = {
                  t: "processing",
                  progress: number_toValidPercent_unsafe(row.progress || 0),
                };
              } else {
                newState = { t: "queued" };
              }
              setJobState(newState);
              if (row.status === "done" || row.status === "failed") {
                supabase.removeChannel(channel);
              }
            }
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            setJobState({
              t: "failed",
              error: String_toNonEmptyStringTrimmed_unsafe(
                "WebSocket connection failed",
              ),
            });
          }
        });
    } catch {
      setJobState({
        t: "failed",
        error: String_toNonEmptyStringTrimmed_unsafe(
          "Failed to start processing",
        ),
      });
    }
  };

  useEffect(() => {
    startProcess();
  }, []);

  const isDone = jobState.t === "done" || jobState.t === "failed";
  const inProgress = jobState.t === "queued" || jobState.t === "processing";

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {inProgress && (
          <div className="flex flex-col items-center w-full">
            {/* Circular Progress */}
            <div className="relative w-56 h-56 mb-12 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeDasharray="276.46"
                  initial={{ strokeDashoffset: 276.46 }}
                  animate={{
                    strokeDashoffset:
                      276.46 -
                      (276.46 *
                        (jobState.t === "processing" ? jobState.progress : 0)) /
                      100,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-black text-slate-900">
                  {jobState.t === "processing" ? jobState.progress : 0}%
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-slate-900">
              Creating something good for you...
            </h2>
            <p className="text-slate-500 mb-16">
              This will only take a moment — your item is almost ready.
            </p>

            {/* Testimonial Box */}
            <div className="w-full bg-emerald-50 rounded-3xl p-8 relative mt-auto">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-slate-700 italic text-lg mb-4 leading-relaxed">
                &quot;I love this website! It makes practicing so easy and
                relaxing.&quot;
              </p>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  — John
                </span>
              </div>
            </div>
          </div>
        )}

        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <div
              className={`p-8 rounded-3xl mb-10 ${jobState.t === "done"
                  ? "bg-emerald-50 border-2 border-emerald-100 text-emerald-900"
                  : "bg-red-50 border-2 border-red-100 text-red-900"
                }`}
            >
              <div className="flex justify-center mb-4">
                {jobState.t === "done" ? (
                  <Trophy className="w-12 h-12 text-emerald-500" />
                ) : (
                  <div className="text-4xl">❌</div>
                )}
              </div>
              <h2 className="text-3xl font-black mb-3">
                {jobState.t === "done" ? "Success!" : "Failed"}
              </h2>
              <p className="text-lg opacity-80 leading-relaxed font-medium">
                {jobState.t === "done" ? jobState.result : jobState.error}
              </p>
            </div>

            <button
              onClick={onReset}
              className="w-full py-4 rounded-full border-2 border-slate-200 text-slate-600 font-bold text-lg hover:bg-white hover:border-slate-300 transition-all active:scale-95"
            >
              Start Over
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
