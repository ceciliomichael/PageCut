"use client";

import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import {
  getPdfUtilitySession,
  setPdfUtilitySession,
  type WatermarkPosition,
} from "@/lib/pdf-utility-session";

export default function WatermarkConfigureStep() {
  const router = useRouter();
  const session = getPdfUtilitySession("watermark");
  const [options, setOptions] = useState(() => session?.options ?? null);
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) router.replace("/watermark");
  }, [router, session]);

  if (!session || !options) return null;
  const activeSession = session;
  const activeOptions = options;

  function continueToResults() {
    if (!activeOptions.text.trim()) {
      setError("Enter watermark text.");
      return;
    }
    if (activeOptions.fontSize < 10 || activeOptions.fontSize > 120) {
      setError("Font size must be between 10 and 120.");
      return;
    }
    if (activeOptions.opacity < 0.05 || activeOptions.opacity > 1) {
      setError("Opacity must be between 5% and 100%.");
      return;
    }

    setPdfUtilitySession({
      ...activeSession,
      options: { ...activeOptions, text: activeOptions.text.trim() },
      outputName: outputName.trim() || undefined,
    });
    router.push("/watermark/results");
  }

  return (
    <PageShell
      step={1}
      mode="watermark"
      fullHeight
      footer={
        <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
          <div className="w-full max-w-2xl py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => router.push("/watermark")}
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
                Apply watermark
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
            Configure watermark
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Apply the same text watermark across every page.
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

        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          Watermark text
          <input
            className="input-field w-full mt-1.5"
            value={options.text}
            onChange={(event) =>
              setOptions({ ...options, text: event.target.value })
            }
            maxLength={120}
            placeholder="CONFIDENTIAL"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            Position
            <select
              className="input-field w-full mt-1.5"
              value={options.position}
              onChange={(event) =>
                setOptions({
                  ...options,
                  position: event.target.value as WatermarkPosition,
                })
              }
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            Font size
            <input
              type="number"
              min={10}
              max={120}
              className="input-field w-full mt-1.5"
              value={options.fontSize}
              onChange={(event) =>
                setOptions({ ...options, fontSize: Number(event.target.value) })
              }
            />
          </label>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            Rotation
            <input
              type="number"
              min={-90}
              max={90}
              step={5}
              className="input-field w-full mt-1.5"
              value={options.rotation}
              onChange={(event) =>
                setOptions({ ...options, rotation: Number(event.target.value) })
              }
            />
          </label>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            Opacity ({Math.round(options.opacity * 100)}%)
            <input
              type="range"
              min={5}
              max={100}
              value={Math.round(options.opacity * 100)}
              onChange={(event) =>
                setOptions({
                  ...options,
                  opacity: Number(event.target.value) / 100,
                })
              }
              className="w-full mt-3"
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
              placeholder="watermarked-document"
              maxLength={120}
            />
            <span className="absolute right-3 text-xs text-[var(--color-text-muted)]">
              .pdf
            </span>
          </div>
        </label>

        <div className="rounded-xl p-5 bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Preview style
          </p>
          <div className="relative flex h-44 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)] overflow-hidden">
            <span
              style={{
                opacity: options.opacity,
                transform: `rotate(${options.rotation}deg)`,
                fontSize: `${Math.min(options.fontSize, 54)}px`,
              }}
              className="font-bold whitespace-nowrap text-[var(--color-text-secondary)]"
            >
              {options.text || "WATERMARK"}
            </span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
