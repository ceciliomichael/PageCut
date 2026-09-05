"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { PdfRangeLivePreview } from "@/components/pdf-live-preview";
import {
  getPdfToImageSession,
  setPdfToImageSession,
} from "@/lib/pdf-to-image-session";

const SCALES = [
  { value: "1", label: "1× · Smaller" },
  { value: "1.5", label: "1.5× · Medium" },
  { value: "2", label: "2× · High quality" },
  { value: "3", label: "3× · Extra high" },
] as const;

export default function PdfToImageConfigureStep() {
  const router = useRouter();
  const session = getPdfToImageSession();
  const [options, setOptions] = useState(() => session?.options ?? null);
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) router.replace("/pdf-to-image");
  }, [router, session]);

  if (!session || !options) return null;
  const activeSession = session;
  const activeOptions = options;
  const selectedCount = Math.max(0, options.toPage - options.fromPage + 1);

  function continueToResults() {
    if (
      !Number.isInteger(activeOptions.fromPage) ||
      !Number.isInteger(activeOptions.toPage) ||
      activeOptions.fromPage < 1 ||
      activeOptions.toPage > activeSession.totalPages ||
      activeOptions.fromPage > activeOptions.toPage
    ) {
      setError(`Choose pages between 1 and ${activeSession.totalPages}.`);
      return;
    }
    setPdfToImageSession({
      ...activeSession,
      options: activeOptions,
      outputName: outputName.trim() || undefined,
    });
    router.push("/pdf-to-image/results");
  }

  return (
    <PageShell step={1} mode="pdf-to-image" fullHeight wide>
      <PdfEditorWorkspace
        title="PDF to PNG"
        description="Export PDF pages as lossless PNG images while keeping the source PDF visible."
        fileName={activeSession.file.name}
        pageCount={activeSession.totalPages}
        preview={
          <PdfRangeLivePreview
            file={activeSession.file}
            totalPages={activeSession.totalPages}
            fromPage={options.fromPage}
            toPage={options.toPage}
            title="Export preview"
          />
        }
        primaryLabel="Convert pages"
        onPrimary={continueToResults}
        onBack={() => router.push("/pdf-to-image")}
        footerNote={`${selectedCount} ${selectedCount === 1 ? "page" : "pages"} selected`}
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

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-3">
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            Lossless PNG output
          </p>
          <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-muted)]">
            No JPEG compression is used. Resolution only controls the exported
            pixel dimensions.
          </p>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Resolution
          </h2>
          <CustomSelect
            value={String(options.scale) as "1" | "1.5" | "2" | "3"}
            options={SCALES}
            ariaLabel="Export resolution"
            onChange={(scale) =>
              setOptions({ ...options, scale: Number(scale) })
            }
          />
          <p className="mt-2 text-[11px] leading-4 text-[var(--color-text-muted)]">
            Higher resolution creates sharper images and larger files.
          </p>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Page range
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              From
              <input
                type="number"
                min={1}
                max={activeSession.totalPages}
                className="input-field mt-1.5"
                value={options.fromPage}
                onChange={(event) => {
                  setOptions({
                    ...options,
                    fromPage: Number(event.target.value),
                  });
                  setError(null);
                }}
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
                onChange={(event) => {
                  setOptions({
                    ...options,
                    toPage: Number(event.target.value),
                  });
                  setError(null);
                }}
              />
            </label>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Filename prefix
            <input
              className="input-field mt-1.5"
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              placeholder="document-pages"
              maxLength={120}
            />
          </label>
        </section>
      </PdfEditorWorkspace>
    </PageShell>
  );
}
