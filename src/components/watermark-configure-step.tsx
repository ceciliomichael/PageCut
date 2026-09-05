"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import {
  getPdfUtilitySession,
  setPdfUtilitySession,
  type WatermarkPosition,
} from "@/lib/pdf-utility-session";

const POSITIONS: Array<{ value: WatermarkPosition; label: string }> = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
];

export default function WatermarkConfigureStep() {
  const router = useRouter();
  const session = getPdfUtilitySession("watermark");
  const [options, setOptions] = useState(() => session?.options ?? null);
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) router.replace("/watermark");
  }, [router, session]);

  const previewSession = useMemo(
    () =>
      session && options
        ? { ...session, options, outputName: undefined }
        : null,
    [options, session],
  );

  if (!session || !options || !previewSession) return null;
  const activeSession = session;
  const activeOptions = options;

  function savePdf() {
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
    <PageShell step={1} mode="watermark" fullHeight wide>
      <PdfEditorWorkspace
        title="Add watermark"
        description="Adjust the watermark and inspect every page in the live document."
        fileName={activeSession.file.name}
        pageCount={activeSession.totalPages}
        previewSession={previewSession}
        primaryLabel="Apply watermark"
        onPrimary={savePdf}
        onBack={() => router.push("/watermark")}
      >
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2.5">
            <AlertCircle
              size={14}
              className="mt-0.5 shrink-0 text-[var(--color-danger-text)]"
            />
            <p className="text-xs leading-5 text-[var(--color-danger-text)]">
              {error}
            </p>
          </div>
        )}

        <section>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Watermark text
            <input
              className="input-field mt-1.5"
              value={options.text}
              onChange={(event) =>
                setOptions({ ...options, text: event.target.value })
              }
              maxLength={120}
              placeholder="CONFIDENTIAL"
            />
          </label>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Placement
          </h2>
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-[var(--color-bg-subtle)] p-1">
            {POSITIONS.map((position) => {
              const active = options.position === position.value;
              return (
                <button
                  key={position.value}
                  type="button"
                  onClick={() =>
                    setOptions({ ...options, position: position.value })
                  }
                  className={`h-9 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  {position.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Appearance
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Font size
              <input
                type="number"
                min={10}
                max={120}
                className="input-field mt-1.5"
                value={options.fontSize}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    fontSize: Number(event.target.value),
                  })
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
                className="input-field mt-1.5"
                value={options.rotation}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    rotation: Number(event.target.value),
                  })
                }
              />
            </label>
          </div>

          <label className="mt-4 block text-xs font-medium text-[var(--color-text-secondary)]">
            <span className="flex items-center justify-between">
              <span>Opacity</span>
              <span className="font-normal text-[var(--color-text-muted)]">
                {Math.round(options.opacity * 100)}%
              </span>
            </span>
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
              className="mt-2 w-full"
            />
          </label>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Output filename
            <div className="relative mt-1.5 flex items-center">
              <input
                className="input-field pr-14"
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
        </section>
      </PdfEditorWorkspace>
    </PageShell>
  );
}
