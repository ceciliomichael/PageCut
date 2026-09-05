"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import {
  getPdfUtilitySession,
  setPdfUtilitySession,
} from "@/lib/pdf-utility-session";

const POSITION_OPTIONS = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
] as const;

const FORMAT_OPTIONS = [
  { value: "number", label: "1" },
  { value: "page-number", label: "Page 1" },
  { value: "number-total", label: "1 / 10" },
] as const;

export default function PageNumbersConfigureStep() {
  const router = useRouter();
  const session = getPdfUtilitySession("page-numbers");
  const [options, setOptions] = useState(() => session?.options ?? null);
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) router.replace("/page-numbers");
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
    <PageShell step={1} mode="page-numbers" fullHeight wide>
      <PdfEditorWorkspace
        title="Add page numbers"
        description="Style the numbering once and inspect the complete document live."
        fileName={activeSession.file.name}
        pageCount={activeSession.totalPages}
        previewSession={previewSession}
        primaryLabel="Apply numbers"
        onPrimary={savePdf}
        onBack={() => router.push("/page-numbers")}
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
            Number style
          </h2>
          <div className="space-y-3">
            <div className="block text-xs font-medium text-[var(--color-text-secondary)]">
              <span>Position</span>
              <CustomSelect
                className="mt-1.5"
                ariaLabel="Page number position"
                value={options.position}
                options={POSITION_OPTIONS}
                onChange={(position) =>
                  setOptions({
                    ...options,
                    position,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                <span>Format</span>
                <CustomSelect
                  className="mt-1.5"
                  ariaLabel="Page number format"
                  value={options.format}
                  options={FORMAT_OPTIONS}
                  onChange={(format) =>
                    setOptions({
                      ...options,
                      format,
                    })
                  }
                />
              </div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                Font size
                <input
                  type="number"
                  min={6}
                  max={72}
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
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Numbering range
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Start at
              <input
                type="number"
                min={0}
                className="input-field mt-1.5"
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
              From
              <input
                type="number"
                min={1}
                max={activeSession.totalPages}
                className="input-field mt-1.5"
                value={options.fromPage}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    fromPage: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              To
              <input
                type="number"
                min={1}
                max={activeSession.totalPages}
                className="input-field mt-1.5"
                value={options.toPage}
                onChange={(event) =>
                  setOptions({ ...options, toPage: Number(event.target.value) })
                }
              />
            </label>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Output filename
            <div className="relative mt-1.5 flex items-center">
              <input
                className="input-field pr-14"
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
        </section>
      </PdfEditorWorkspace>
    </PageShell>
  );
}
