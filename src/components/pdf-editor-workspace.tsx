"use client";

import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
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
  const [mobileView, setMobileView] = useState<"setup" | "preview">("setup");
  const previewContent =
    preview ??
    (previewSession ? (
      <PdfLivePreview session={previewSession} pageCount={pageCount} />
    ) : null);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] sm:rounded-2xl lg:grid lg:grid-cols-[360px_minmax(0,1fr)]">
      <div
        role="tablist"
        aria-label="Editor view"
        className="grid shrink-0 grid-cols-2 gap-1 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 lg:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === "setup"}
          onClick={() => setMobileView("setup")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            mobileView === "setup"
              ? "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          Setup
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === "preview"}
          onClick={() => setMobileView("preview")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            mobileView === "preview"
              ? "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          Preview
        </button>
      </div>

      <aside
        className={`${mobileView === "setup" ? "flex" : "hidden"} min-h-0 flex-1 flex-col bg-[var(--color-surface)] lg:flex lg:border-r lg:border-[var(--color-border)]`}
      >
        <div className="shrink-0 border-b border-[var(--color-border)] px-4 py-4 sm:px-5 sm:py-5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Editor
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-xl">
            {title}
          </h1>
          <p className="mt-1.5 text-[13px] leading-5 text-[var(--color-text-secondary)] sm:text-sm">
            {description}
          </p>

          <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-[var(--color-bg-subtle)] px-3 py-2 sm:mt-4 sm:gap-3 sm:py-2.5">
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-5 sm:py-5 scrollbar-thin">
          {children}
        </div>

        <div className="z-10 shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[0_-10px_24px_rgba(0,0,0,0.04)] sm:p-4 lg:shadow-none">
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
          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-[var(--color-text-muted)] sm:mt-3 sm:text-[11px]">
            <ShieldCheck size={12} />
            <span>{footerNote ?? "Processed locally in your browser"}</span>
          </div>
        </div>
      </aside>

      <div
        role="tabpanel"
        className={`${mobileView === "preview" ? "flex" : "hidden"} min-h-0 flex-1 lg:flex`}
      >
        {previewContent}
      </div>
    </div>
  );
}
