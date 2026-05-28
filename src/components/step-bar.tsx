"use client";

import { Check } from "lucide-react";

type Step = {
  label: string;
  description: string;
};

const SPLIT_STEPS: Step[] = [
  { label: "Upload", description: "Choose your PDF" },
  { label: "Configure", description: "Define page ranges" },
  { label: "Extract", description: "Download your files" },
];

const MERGE_STEPS: Step[] = [
  { label: "Upload", description: "Add your PDFs" },
  { label: "Organize", description: "Set order & ranges" },
  { label: "Merge", description: "Download merged file" },
];

type StepBarProps = {
  current: 0 | 1 | 2;
  mode?: "split" | "merge";
};

export function StepBar({ current, mode = "split" }: StepBarProps) {
  const STEPS = mode === "merge" ? MERGE_STEPS : SPLIT_STEPS;

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => {
        const isDone = index < current;
        const isActive = index === current;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex items-center gap-2.5">
              <div
                className={`step-dot ${isActive ? "active" : isDone ? "done" : ""}`}
              >
                {isDone ? (
                  <Check size={13} strokeWidth={2.5} />
                ) : (
                  <span
                    className={`flex items-center justify-center leading-none select-none text-[11px] font-bold h-full w-full ${index === 0 ? "translate-x-[-1px]" : ""}`}
                  >
                    {index + 1}
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <p
                  className={`text-xs font-semibold leading-none ${isActive ? "text-[var(--color-text-primary)]" : isDone ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"}`}
                >
                  {step.label}
                </p>
                <p
                  className={`mt-0.5 text-[11px] leading-none ${isActive ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"}`}
                >
                  {step.description}
                </p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`step-connector mx-3 ${index < current ? "done" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
