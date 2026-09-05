"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { ResizeLivePreview } from "@/components/pdf-live-preview";
import {
  getPdfUtilitySession,
  type ResizeOptions,
  type ResizePreset,
  setPdfUtilitySession,
} from "@/lib/pdf-utility-session";

const POINTS_PER_MM = 72 / 25.4;
const PRESETS = [
  { value: "a4", label: "A4 · 210 × 297 mm" },
  { value: "letter", label: "Letter · 8.5 × 11 in" },
  { value: "legal", label: "Legal · 8.5 × 14 in" },
  { value: "custom", label: "Custom size" },
] as const;

const MODES = [
  { value: "fit", label: "Fit · show all content" },
  { value: "fill", label: "Fill · cover the page" },
  { value: "center", label: "Center · keep original size" },
] as const;

const PRESET_SIZES: Record<
  Exclude<ResizePreset, "custom">,
  [number, number]
> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
};

function pointsToMm(value: number): number {
  return Math.round((value / POINTS_PER_MM) * 10) / 10;
}

function mmToPoints(value: number): number {
  return value * POINTS_PER_MM;
}

function validateOptions(options: ResizeOptions): string | null {
  if (
    !Number.isFinite(options.width) ||
    !Number.isFinite(options.height) ||
    options.width < 36 ||
    options.height < 36 ||
    options.width > 14_400 ||
    options.height > 14_400
  ) {
    return "Page dimensions must be between 12.7 mm and 5080 mm.";
  }
  return null;
}

export default function ResizeConfigureStep() {
  const router = useRouter();
  const session = getPdfUtilitySession("resize");
  const [options, setOptions] = useState<ResizeOptions | null>(
    () => session?.options ?? null,
  );
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) router.replace("/resize");
  }, [router, session]);

  if (!session || !options) return null;
  const activeSession = session;
  const activeOptions = options;
  const previewOptions: ResizeOptions = {
    ...activeOptions,
    width:
      Number.isFinite(activeOptions.width) && activeOptions.width > 0
        ? activeOptions.width
        : 595.28,
    height:
      Number.isFinite(activeOptions.height) && activeOptions.height > 0
        ? activeOptions.height
        : 841.89,
  };

  function choosePreset(preset: ResizePreset) {
    if (preset === "custom") {
      setOptions({ ...activeOptions, preset });
    } else {
      const [width, height] = PRESET_SIZES[preset];
      setOptions({ ...activeOptions, preset, width, height });
    }
    setError(null);
  }

  function savePdf() {
    const message = validateOptions(activeOptions);
    if (message) {
      setError(message);
      return;
    }
    setPdfUtilitySession({
      ...activeSession,
      options: activeOptions,
      outputName: outputName.trim() || undefined,
    });
    router.push("/resize/results");
  }

  return (
    <PageShell step={1} mode="resize" fullHeight wide>
      <PdfEditorWorkspace
        title="Resize PDF pages"
        description="Put every PDF page onto a consistent paper size without rasterizing the document."
        fileName={activeSession.file.name}
        pageCount={activeSession.totalPages}
        preview={
          <ResizeLivePreview
            file={activeSession.file}
            totalPages={activeSession.totalPages}
            options={previewOptions}
          />
        }
        primaryLabel="Resize PDF"
        onPrimary={savePdf}
        onBack={() => router.push("/resize")}
        footerNote={`${pointsToMm(options.width)} × ${pointsToMm(options.height)} mm`}
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
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Page size
          </h2>
          <CustomSelect
            value={options.preset}
            options={PRESETS}
            ariaLabel="PDF page size"
            onChange={choosePreset}
          />

          {options.preset === "custom" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                Width
                <div className="relative mt-1.5 flex items-center">
                  <input
                    type="number"
                    min={12.7}
                    max={5080}
                    step={0.1}
                    className="input-field pr-10"
                    value={pointsToMm(options.width)}
                    onChange={(event) => {
                      setOptions({
                        ...options,
                        width: mmToPoints(Number(event.target.value)),
                      });
                      setError(null);
                    }}
                  />
                  <span className="pointer-events-none absolute right-3 text-xs text-[var(--color-text-muted)]">
                    mm
                  </span>
                </div>
              </label>
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                Height
                <div className="relative mt-1.5 flex items-center">
                  <input
                    type="number"
                    min={12.7}
                    max={5080}
                    step={0.1}
                    className="input-field pr-10"
                    value={pointsToMm(options.height)}
                    onChange={(event) => {
                      setOptions({
                        ...options,
                        height: mmToPoints(Number(event.target.value)),
                      });
                      setError(null);
                    }}
                  />
                  <span className="pointer-events-none absolute right-3 text-xs text-[var(--color-text-muted)]">
                    mm
                  </span>
                </div>
              </label>
            </div>
          )}
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Content placement
          </h2>
          <CustomSelect
            value={options.mode}
            options={MODES}
            ariaLabel="Resize content mode"
            onChange={(mode) => setOptions({ ...options, mode })}
          />
          <p className="mt-2 text-[11px] leading-4 text-[var(--color-text-muted)]">
            Fit preserves all content. Fill covers the target page and may clip
            edges. Center keeps the original content scale.
          </p>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Output filename
            <div className="relative mt-1.5 flex items-center">
              <input
                className="input-field pr-14"
                value={outputName}
                onChange={(event) => setOutputName(event.target.value)}
                placeholder="resized-document"
                maxLength={120}
              />
              <span className="pointer-events-none absolute right-3 text-xs text-[var(--color-text-muted)]">
                .pdf
              </span>
            </div>
          </label>
        </section>
      </PdfEditorWorkspace>
    </PageShell>
  );
}
