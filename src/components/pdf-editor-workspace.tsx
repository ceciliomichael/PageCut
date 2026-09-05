"use client";

import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { PdfLivePreview } from "@/components/pdf-live-preview";
import type { PdfUtilitySession } from "@/lib/pdf-utility-session";

type PdfEditorWorkspaceProps = {
  title: string;
  description: string;
  fileName: string;
  pageCount: number;
  previewSession?: PdfUtilitySession;
  preview?: ReactNode;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  onBack: () => void;
  footerNote?: string;
  primaryDisabled?: boolean;
};

export function PdfEditorWorkspace({
  title,
  description,
  fileName,
  pageCount,
  previewSession,
  preview,
  children,
  primaryLabel,
  onPrimary,
  onBack,
  footerNote,
  primaryDisabled = false,
}: PdfEditorWorkspaceProps) {
  return (
    <div className="grid min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] lg:grid-cols-[360px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="flex min-h-0 flex-col border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:border-r lg:border-b-0">
        <div className="shrink-0 border-b border-[var(--color-border)] px-5 py-5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Editor
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-5 text-[var(--color-text-secondary)]">
            {description}
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-lg bg-[var(--color-bg-subtle)] px-3 py-2.5">
            <FileText
              size={15}
              className="shrink-0 text-[var(--color-text-muted)]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">
                {fileName}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {pageCount} {pageCount === 1 ? "page" : "pages"}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 scrollbar-thin">
          {children}
        </div>

        <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary px-3.5"
              aria-label="Go back"
            >
              <ArrowLeft size={15} />
            </button>
            <button
              type="button"
              onClick={onPrimary}
              className="btn-primary"
              disabled={primaryDisabled}
            >
              {primaryLabel}
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <ShieldCheck size={12} />
            <span>{footerNote ?? "Processed locally in your browser"}</span>
          </div>
        </div>
      </aside>

      {preview ??
        (previewSession ? (
          <PdfLivePreview session={previewSession} pageCount={pageCount} />
        ) : null)}
    </div>
  );
}
