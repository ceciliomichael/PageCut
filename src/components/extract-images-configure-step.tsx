"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { PdfRangeLivePreview } from "@/components/pdf-live-preview";
import {
  getExtractImagesSession,
  setExtractImagesSession,
} from "@/lib/extract-images-session";

export default function ExtractImagesConfigureStep() {
  const router = useRouter();
  const session = getExtractImagesSession();
  const [options, setOptions] = useState(() => session?.options ?? null);
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) router.replace("/extract-images");
  }, [router, session]);

  if (!session || !options) return null;
  const activeSession = session;
  const activeOptions = options;
  const selectedCount = Math.max(
    0,
    activeOptions.toPage - activeOptions.fromPage + 1,
  );

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
    if (
      !Number.isFinite(activeOptions.minWidth) ||
      !Number.isFinite(activeOptions.minHeight) ||
      activeOptions.minWidth < 1 ||
      activeOptions.minHeight < 1 ||
      activeOptions.minWidth > 20_000 ||
      activeOptions.minHeight > 20_000
    ) {
      setError("Minimum image dimensions must be between 1 and 20,000 pixels.");
      return;
    }

    setExtractImagesSession({
      ...activeSession,
      options: activeOptions,
      outputName: outputName.trim() || undefined,
    });
    router.push("/extract-images/results");
  }

  return (
    <PageShell step={1} mode="extract-images" fullHeight wide>
      <PdfEditorWorkspace
        title="Extract images"
        description="Find embedded raster images inside the PDF instead of turning whole pages into screenshots."
        fileName={activeSession.file.name}
        pageCount={activeSession.totalPages}
        preview={
          <PdfRangeLivePreview
            file={activeSession.file}
            totalPages={activeSession.totalPages}
            fromPage={options.fromPage}
            toPage={options.toPage}
            title="Pages to scan"
          />
        }
        primaryLabel="Find images"
        onPrimary={continueToResults}
        onBack={() => router.push("/extract-images")}
        footerNote={`${selectedCount} ${selectedCount === 1 ? "page" : "pages"} to scan`}
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
            Embedded images only
          </p>
          <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-muted)]">
            PageCut extracts supported raster image objects and saves them as
            lossless PNGs. Vector drawings and text are not converted into
            images.
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
          <h2 className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">
            Ignore tiny images
          </h2>
          <p className="mb-3 text-[11px] leading-4 text-[var(--color-text-muted)]">
            Small PDF assets can be icons or decorative pixels. Set the minimum
            size you want to keep.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Min width
              <div className="relative mt-1.5 flex items-center">
                <input
                  type="number"
                  min={1}
                  max={20_000}
                  className="input-field pr-8"
                  value={options.minWidth}
                  onChange={(event) =>
                    setOptions({
                      ...options,
                      minWidth: Number(event.target.value),
                    })
                  }
                />
                <span className="pointer-events-none absolute right-3 text-xs text-[var(--color-text-muted)]">
                  px
                </span>
              </div>
            </label>
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Min height
              <div className="relative mt-1.5 flex items-center">
                <input
                  type="number"
                  min={1}
                  max={20_000}
                  className="input-field pr-8"
                  value={options.minHeight}
                  onChange={(event) =>
                    setOptions({
                      ...options,
                      minHeight: Number(event.target.value),
                    })
                  }
                />
                <span className="pointer-events-none absolute right-3 text-xs text-[var(--color-text-muted)]">
                  px
                </span>
              </div>
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
              placeholder="extracted-images"
              maxLength={120}
            />
          </label>
        </section>
      </PdfEditorWorkspace>
    </PageShell>
  );
}
