"use client";

import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import {
  getPdfUtilitySession,
  type PageNumberFormat,
  type PageNumberPosition,
  setPdfUtilitySession,
} from "@/lib/pdf-utility-session";

export default function PageNumbersConfigureStep() {
  const router = useRouter();
  const session = getPdfUtilitySession("page-numbers");
  const [options, setOptions] = useState(() => session?.options ?? null);
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) router.replace("/page-numbers");
  }, [router, session]);

  if (!session || !options) return null;
  const activeSession = session;
  const activeOptions = options;

  function continueToResults() {
    if (
      activeOptions.fromPage < 1 ||
      activeOptions.toPage > activeSession.totalPages ||
      activeOptions.fromPage > activeOptions.toPage
    ) {
      setError(
        `Choose a valid page range between 1 and ${activeSession.totalPages}.`,
      );
      return;
    }
    if (activeOptions.fontSize < 6 || activeOptions.fontSize > 72) {
      setError("Font size must be between 6 and 72.");
      return;
    }
    if (
      !Number.isInteger(activeOptions.startNumber) ||
      activeOptions.startNumber < 0
    ) {
      setError("Starting number must be a whole number of 0 or greater.");
      return;
    }

    setPdfUtilitySession({
      ...activeSession,
      options: activeOptions,
      outputName: outputName.trim() || undefined,
    });
    router.push("/page-numbers/results");
  }

  return (
    <PageShell
      step={1}
      mode="page-numbers"
      fullHeight
      footer={
        <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
          <div className="w-full max-w-2xl py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => router.push("/page-numbers")}
                className="btn-secondary"
              >
                <ArrowLeft size={15} />
                Back
              </button>
              <button
                type="button"
                onClick={continueToResults}
                className="btn-primary sm:ml-auto"
              >
                Add page numbers
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col w-full space-y-5 overflow-y-auto mb-28 px-1">
        <div className="space-y-1.5 text-center shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl text-[var(--color-text-primary)]">
            Configure page numbers
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Choose where and how the numbering should appear.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)]">
            <AlertCircle
              size={16}
              className="mt-0.5 text-[var(--color-danger-text)]"
            />
            <p className="text-sm text-[var(--color-danger-text)]">{error}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            Position
            <select
              className="input-field w-full mt-1.5"
              value={options.position}
              onChange={(event) =>
                setOptions({
                  ...options,
                  position: event.target.value as PageNumberPosition,
                })
              }
            >
              <option value="top-left">Top left</option>
              <option value="top-center">Top center</option>
              <option value="top-right">Top right</option>
              <option value="bottom-left">Bottom left</option>
              <option value="bottom-center">Bottom center</option>
              <option value="bottom-right">Bottom right</option>
            </select>
          </label>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            Format
            <select
              className="input-field w-full mt-1.5"
              value={options.format}
              onChange={(event) =>
                setOptions({
                  ...options,
                  format: event.target.value as PageNumberFormat,
                })
              }
            >
              <option value="number">1</option>
              <option value="page-number">Page 1</option>
              <option value="number-total">1 / 10</option>
            </select>
          </label>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            Font size
            <input
              type="number"
              min={6}
              max={72}
              className="input-field w-full mt-1.5"
              value={options.fontSize}
              onChange={(event) =>
                setOptions({ ...options, fontSize: Number(event.target.value) })
              }
            />
          </label>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            Start number
            <input
              type="number"
              min={0}
              className="input-field w-full mt-1.5"
              value={options.startNumber}
              onChange={(event) =>
                setOptions({
                  ...options,
                  startNumber: Number(event.target.value),
                })
              }
            />
          </label>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            From page
            <input
              type="number"
              min={1}
              max={activeSession.totalPages}
              className="input-field w-full mt-1.5"
              value={options.fromPage}
              onChange={(event) =>
                setOptions({ ...options, fromPage: Number(event.target.value) })
              }
            />
          </label>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            To page
            <input
              type="number"
              min={1}
              max={activeSession.totalPages}
              className="input-field w-full mt-1.5"
              value={options.toPage}
              onChange={(event) =>
                setOptions({ ...options, toPage: Number(event.target.value) })
              }
            />
          </label>
        </div>

        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          Output filename
          <div className="relative flex items-center mt-1.5">
            <input
              className="input-field w-full pr-14"
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              placeholder="numbered-document"
              maxLength={120}
            />
            <span className="absolute right-3 text-xs text-[var(--color-text-muted)]">
              .pdf
            </span>
          </div>
        </label>
      </div>
    </PageShell>
  );
}
