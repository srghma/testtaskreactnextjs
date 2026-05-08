"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  Option,
  Option_some,
  Option_none,
  Option_isSome,
  strToNonNegativeNumberOrUndefined_strict,
  ValidNonNegativeNumber,
  numberToValidPercentOrUndefined,
} from "../fp";
import { JobState } from "../types";
import { createJobAction, getJobAction } from "./actions";

export default function App() {
  const [step, setStep] = useState(1);
  const [wish, setWish] = useState<Option<string>>(Option_none);
  const [numberInput, setNumberInput] = useState<string>("");

  const handleNext = () => setStep((s) => s + 1);
  const handleReset = () => {
    setStep(1);
    setWish(Option_none);
    setNumberInput("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Progress Bar */}
      <div className="w-full bg-white fixed top-0 h-16 flex items-center justify-between border-b border-slate-100 z-10 px-4">
        <Link
          href="/jobs"
          className="text-sm font-semibold text-emerald-500 hover:text-emerald-600 px-4 hidden sm:block"
        >
          All Jobs Dashboard
        </Link>
        <div className="w-full max-w-2xl flex items-center gap-4 flex-1 mx-auto">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
            disabled={step === 1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-400"
              initial={{ width: "33%" }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <div className="w-[140px] hidden sm:block" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto pt-20 px-4 pb-10">
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
            <Screen2
              key="s2"
              numberInput={numberInput}
              setNumberInput={setNumberInput}
              onNext={handleNext}
            />
          )}
          {step === 3 && <Screen3 key="s3" onReset={handleReset} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Screen 1 ---
function Screen1({ wish, setWish, onNext }: any) {
  const wishes = [
    { id: "w1", icon: "😌", text: "Reduce Stress" },
    { id: "w2", icon: "😴", text: "Better Sleep" },
    { id: "w3", icon: "⚖️", text: "More Balance" },
    { id: "w4", icon: "💚", text: "Healthier Habits" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full flex justify-center"
    >
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-medium text-center mb-8">
          What is your main wish?
        </h1>
        <div className="flex flex-col gap-3 mb-10">
          {wishes.map((w) => (
            <button
              key={w.id}
              onClick={() => setWish(Option_some(w.id))}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                Option_isSome(wish) && wish.v === w.id
                  ? "border-emerald-400 bg-emerald-50/50"
                  : "border-transparent bg-white shadow-sm hover:border-slate-200"
              }`}
            >
              <span className="text-xl">{w.icon}</span>
              <span className="text-lg font-medium">{w.text}</span>
              {Option_isSome(wish) && wish.v === w.id && (
                <Check className="ml-auto text-emerald-500 w-5 h-5" />
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={onNext}
            disabled={!Option_isSome(wish)}
            className="w-48 py-3 rounded-full bg-emerald-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Screen 2 ---
function Screen2({ numberInput, setNumberInput, onNext }: any) {
  const validNumberOption: Option<ValidNonNegativeNumber> = (() => {
    const parsed = strToNonNegativeNumberOrUndefined_strict(numberInput);
    if (parsed !== undefined && parsed > 0) {
      return Option_some(parsed);
    }
    return Option_none;
  })();

  const isValid = Option_isSome(validNumberOption);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full flex justify-center"
    >
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-medium mb-12">What is your target?</h1>

        <div className="mb-12">
          <div className="flex items-end justify-center gap-2 mb-2">
            <input
              type="number"
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              placeholder="0"
              className="text-5xl font-light w-24 text-center pb-2 border-b-2 border-slate-200 focus:outline-none focus:border-emerald-400 bg-transparent transition-colors"
            />
            <span className="text-2xl font-medium pb-3">kg</span>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Please enter a value greater than 0
          </p>
        </div>

        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-48 py-3 rounded-full bg-emerald-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}

// --- Screen 3 ---
function Screen3({ onReset }: { onReset: () => void; key?: string }) {
  const [jobState, setJobState] = useState<JobState>({ t: "idle" });
  const [mode, setMode] = useState<"stream" | "polling" | null>(null);

  const startStreamProcess = async () => {
    setMode("stream");
    setJobState({ t: "queued" });

    try {
      const id = await createJobAction();

      const evtSource = new EventSource("/api/job-stream?id=" + id);
      evtSource.onmessage = (event) => {
        const row = JSON.parse(event.data);
        if (row.status === "processing") {
          setJobState({
            t: "processing",
            progress:
              numberToValidPercentOrUndefined(row.progress) || (0 as any),
          });
        } else if (row.status === "done") {
          setJobState({ t: "done", result: row.result });
          evtSource.close();
        } else if (row.status === "failed") {
          setJobState({ t: "failed", error: row.result || "Unknown error" });
          evtSource.close();
        }
      };

      evtSource.onerror = () => {
        evtSource.close();
      };
    } catch (e) {
      console.error(e);
      setJobState({ t: "failed", error: "Failed to start processing" });
    }
  };

  const startPollingProcess = async () => {
    setMode("polling");
    setJobState({ t: "queued" });

    try {
      const id = await createJobAction();

      const interval = setInterval(async () => {
        const state = await getJobAction(id);
        if (state) {
          setJobState(state);
          if (state.t === "done" || state.t === "failed") {
            clearInterval(interval);
          }
        }
      }, 1000);
    } catch (e) {
      console.error(e);
      setJobState({ t: "failed", error: "Failed to start polling" });
    }
  };

  if (jobState.t !== "idle") {
    const isDone = jobState.t === "done" || jobState.t === "failed";
    const inProgress = jobState.t === "queued" || jobState.t === "processing";

    return (
      <div className="w-full max-w-md text-center flex flex-col items-center justify-center min-h-[40vh]">
        {inProgress && (
          <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
            {jobState.t === "processing" && mode === "stream" ? (
              <>
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * jobState.progress) / 100}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute text-3xl font-medium text-emerald-500">
                  {jobState.progress}%
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-full h-full text-emerald-400 animate-spin opacity-50" />
                <div className="absolute text-sm font-medium animate-pulse text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1 rounded-full">
                  Processing
                </div>
              </>
            )}
          </div>
        )}

        {inProgress && (
          <div>
            <h2 className="text-xl font-medium mb-2">
              {jobState.t === "queued"
                ? "Preparing..."
                : "Creating something good for you..."}
            </h2>
            <p className="text-sm text-slate-500">
              This will only take a moment — your item is almost ready.
            </p>
          </div>
        )}

        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <div
              className={`p-6 rounded-2xl mb-8 ${jobState.t === "done" ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "bg-red-50 border border-red-100 text-red-800"}`}
            >
              <h2 className="text-2xl font-semibold mb-2">
                {jobState.t === "done" ? "Process Complete" : "Process Failed"}
              </h2>
              <p className="text-sm opacity-80">
                {jobState.t === "done" ? jobState.result : jobState.error}
              </p>
            </div>

            <button
              onClick={onReset}
              className="px-8 py-3 rounded-full border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Start Over
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-md text-center"
    >
      <h1 className="text-3xl font-medium mb-10">Select Processing Mode</h1>

      <div className="flex flex-col gap-4 mb-10">
        <button
          onClick={startStreamProcess}
          className="flex flex-col items-start p-6 rounded-2xl border-2 border-transparent bg-white shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-left"
        >
          <span className="text-lg font-semibold text-slate-800 mb-1">
            Start via HTTP Real-time Stream (SSE)
          </span>
          <span className="text-sm text-slate-500">
            Native Next.js alternative to WebSockets. Real-time progress
            (0-100%)
          </span>
        </button>

        <button
          onClick={startPollingProcess}
          className="flex flex-col items-start p-6 rounded-2xl border-2 border-transparent bg-white shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-left"
        >
          <span className="text-lg font-semibold text-slate-800 mb-1">
            Start via Server Action Polling
          </span>
          <span className="text-sm text-slate-500">
            Standard polling mechanism with indeterminate loader
          </span>
        </button>
      </div>

      <button
        onClick={onReset}
        className="text-slate-400 font-medium hover:text-slate-600 underline underline-offset-4"
      >
        Go back to beginning
      </button>
    </motion.div>
  );
}
