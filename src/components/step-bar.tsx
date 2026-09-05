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

const IMAGE_STEPS: Step[] = [
  { label: "Upload", description: "Add your images" },
  { label: "Organize", description: "Set page order" },
  { label: "Convert", description: "Download your PDF" },
];

const ORGANIZE_STEPS: Step[] = [
  { label: "Upload", description: "Choose your PDF" },
  { label: "Organize", description: "Arrange page order" },
  { label: "Save", description: "Download your PDF" },
];

const PAGE_NUMBER_STEPS: Step[] = [
  { label: "Upload", description: "Choose your PDF" },
  { label: "Number", description: "Set number style" },
  { label: "Save", description: "Download your PDF" },
];

const WATERMARK_STEPS: Step[] = [
  { label: "Upload", description: "Choose your PDF" },
  { label: "Watermark", description: "Set watermark style" },
  { label: "Save", description: "Download your PDF" },
];

const CROP_STEPS: Step[] = [
  { label: "Upload", description: "Choose your PDF" },
  { label: "Crop", description: "Set crop area" },
  { label: "Save", description: "Download your PDF" },
];

const PDF_TO_IMAGE_STEPS: Step[] = [
  { label: "Upload", description: "Choose your PDF" },
  { label: "Export", description: "Set image options" },
  { label: "Download", description: "Save your images" },
];

const EXTRACT_IMAGES_STEPS: Step[] = [
  { label: "Upload", description: "Choose your PDF" },
  { label: "Scan", description: "Choose pages to scan" },
  { label: "Download", description: "Save extracted images" },
];

const RESIZE_STEPS: Step[] = [
  { label: "Upload", description: "Choose your PDF" },
  { label: "Resize", description: "Set page dimensions" },
  { label: "Save", description: "Download your PDF" },
];

const SIGN_STEPS: Step[] = [
  { label: "Upload", description: "Choose your PDF" },
  { label: "Sign", description: "Create and place signature" },
  { label: "Save", description: "Download signed PDF" },
];

type StepBarProps = {
  current: 0 | 1 | 2;
  mode?:
    | "split"
    | "merge"
    | "image"
    | "organize"
    | "page-numbers"
    | "watermark"
    | "crop"
    | "pdf-to-image"
    | "extract-images"
    | "resize"
    | "sign";
};

export function StepBar({ current, mode = "split" }: StepBarProps) {
  const STEPS =
    mode === "merge"
      ? MERGE_STEPS
      : mode === "image"
        ? IMAGE_STEPS
        : mode === "organize"
          ? ORGANIZE_STEPS
          : mode === "page-numbers"
            ? PAGE_NUMBER_STEPS
            : mode === "watermark"
              ? WATERMARK_STEPS
              : mode === "crop"
                ? CROP_STEPS
                : mode === "pdf-to-image"
                  ? PDF_TO_IMAGE_STEPS
                  : mode === "extract-images"
                    ? EXTRACT_IMAGES_STEPS
                    : mode === "resize"
                      ? RESIZE_STEPS
                      : mode === "sign"
                        ? SIGN_STEPS
                        : SPLIT_STEPS;

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
