"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { CropLivePreview } from "@/components/pdf-live-preview";
import type { CropMargins } from "@/lib/pdf-utility-session";
import {
  getPdfUtilitySession,
  setPdfUtilitySession,
} from "@/lib/pdf-utility-session";

const SIDES: Array<{ key: keyof CropMargins; label: string }> = [
  { key: "top", label: "Top" },
  { key: "right", label: "Right" },
  { key: "bottom", label: "Bottom" },
  { key: "left", label: "Left" },
];

const DEFAULT_MARGINS: CropMargins = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

function validateMargins(margins: CropMargins): string | null {
  const values = Object.values(margins);
  if (
    values.some((value) => !Number.isFinite(value) || value < 0 || value > 0.99)
  ) {
    return "Each crop margin must be between 0% and 99%.";
  }
  if (margins.left + margins.right > 0.99) {
    return "Keep at least 1% of the page width visible.";
  }
  if (margins.top + margins.bottom > 0.99) {
    return "Keep at least 1% of the page height visible.";
  }
  return null;
}

export default function CropConfigureStep() {
  const router = useRouter();
  const session = getPdfUtilitySession("crop");
  const [pageMargins, setPageMargins] = useState<CropMargins[]>(
    () => session?.options ?? [],
  );
  const [selectedPage, setSelectedPage] = useState(0);
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) router.replace("/crop");
  }, [router, session]);

  if (!session) return null;
  const activeSession = session;
  const margins = pageMargins[selectedPage] ?? DEFAULT_MARGINS;

  function setSelectedMargins(next: CropMargins) {
    setPageMargins((current) =>
      current.map((value, index) => (index === selectedPage ? next : value)),
    );
    setError(null);
  }

  function updateMargin(key: keyof CropMargins, percent: number) {
    setSelectedMargins({ ...margins, [key]: percent / 100 });
  }

  function savePdf() {
    if (pageMargins.length !== activeSession.totalPages) {
      setError("Crop settings are incomplete. Reopen the PDF and try again.");
      return;
    }
    for (let index = 0; index < pageMargins.length; index += 1) {
      const message = validateMargins(pageMargins[index] ?? DEFAULT_MARGINS);
      if (message) {
        setSelectedPage(index);
        setError(`Page ${index + 1}: ${message}`);
        return;
      }
    }
    setPdfUtilitySession({
      ...activeSession,
      options: pageMargins,
      outputName: outputName.trim() || undefined,
    });
    router.push("/crop/results");
  }

  return (
    <PageShell step={1} mode="crop" fullHeight wide>
      <PdfEditorWorkspace
        title="Crop PDF"
        description="Crop each page independently. Select a page, then drag its crop frame or enter precise margins."
        fileName={activeSession.file.name}
        pageCount={activeSession.totalPages}
        preview={
          <CropLivePreview
            file={activeSession.file}
            totalPages={activeSession.totalPages}
            margins={pageMargins}
            selectedPage={selectedPage}
            onSelectPage={setSelectedPage}
            onChange={(pageIndex, next) => {
              setPageMargins((current) =>
                current.map((value, index) =>
                  index === pageIndex ? next : value,
                ),
              );
              setSelectedPage(pageIndex);
              setError(null);
            }}
          />
        }
        primaryLabel="Apply crop"
        onPrimary={savePdf}
        onBack={() => router.push("/crop")}
        footerNote={`Editing page ${selectedPage + 1} of ${activeSession.totalPages}`}
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
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Page {selectedPage + 1} crop
              </h2>
              <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-muted)]">
                These margins affect only this page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMargins(DEFAULT_MARGINS);
              }}
              className="btn-secondary h-8 px-2.5 text-xs"
            >
              <RotateCcw size={12} />
              Reset page
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary h-8 w-8 px-0"
              disabled={selectedPage === 0}
              onClick={() => setSelectedPage((page) => Math.max(0, page - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex h-8 flex-1 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)] text-xs font-medium text-[var(--color-text-secondary)]">
              Page {selectedPage + 1} of {activeSession.totalPages}
            </div>
            <button
              type="button"
              className="btn-secondary h-8 w-8 px-0"
              disabled={selectedPage === activeSession.totalPages - 1}
              onClick={() =>
                setSelectedPage((page) =>
                  Math.min(activeSession.totalPages - 1, page + 1),
                )
              }
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {SIDES.map((side) => (
              <label
                key={side.key}
                className="text-xs font-medium text-[var(--color-text-secondary)]"
              >
                {side.label}
                <div className="relative mt-1.5 flex items-center">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    step={0.1}
                    value={Math.round(margins[side.key] * 1000) / 10}
                    onChange={(event) =>
                      updateMargin(side.key, Number(event.target.value))
                    }
                    className="input-field pr-8"
                  />
                  <span className="pointer-events-none absolute right-3 text-xs text-[var(--color-text-muted)]">
                    %
                  </span>
                </div>
              </label>
            ))}
          </div>

          {activeSession.totalPages > 1 && (
            <button
              type="button"
              className="btn-secondary mt-4 w-full"
              onClick={() => {
                setPageMargins((current) =>
                  current.map(() => ({ ...margins })),
                );
                setError(null);
              }}
            >
              <Copy size={13} />
              Apply page {selectedPage + 1} crop to all pages
            </button>
          )}
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Output filename
            <div className="relative mt-1.5 flex items-center">
              <input
                className="input-field pr-14"
                value={outputName}
                onChange={(event) => setOutputName(event.target.value)}
                placeholder="cropped-document"
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
