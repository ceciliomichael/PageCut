"use client";

import {
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { getPageCount, truncateFileName } from "@/lib/pdf-extract";
import { getMergeSession, setMergeSession } from "@/lib/pdf-session";
import type { MergeFileItem } from "@/lib/pdf-session";

// ─── helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `mf-${Math.random().toString(36).slice(2, 9)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type PendingItem = {
  id: string;
  file: File;
  totalPages: number;
};

type UploadState =
  | { kind: "idle" }
  | { kind: "dragging" }
  | { kind: "loading" }
  | { kind: "error"; message: string };

// ─── component ──────────────────────────────────────────────────────────────

export default function MergeUploadStep() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PendingItem[]>(() => {
    const session = getMergeSession();
    if (session && session.items && session.items.length > 0) {
      return session.items.map((item) => ({
        id: item.id,
        file: item.file,
        totalPages: item.totalPages,
      }));
    }
    return [];
  });
  const [uploadState, setUploadState] = useState<UploadState>({ kind: "idle" });

  const isDragging = uploadState.kind === "dragging";
  const isLoading = uploadState.kind === "loading";

  // ── process one or more dropped / selected files ──────────────────────────
  async function processFiles(files: File[]) {
    const pdfs = files.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );

    if (pdfs.length === 0) {
      setUploadState({ kind: "error", message: "Only PDF files are accepted." });
      return;
    }
    if (pdfs.length < files.length) {
      setUploadState({
        kind: "error",
        message: `${files.length - pdfs.length} non-PDF file(s) were skipped.`,
      });
    } else {
      setUploadState({ kind: "loading" });
    }

    const newItems: PendingItem[] = [];
    for (const file of pdfs) {
      try {
        const totalPages = await getPageCount(file);
        if (totalPages > 0) {
          newItems.push({ id: generateId(), file, totalPages });
        }
      } catch {
        // skip unreadable PDFs silently — they'll not appear in the list
      }
    }

    setItems((prev) => [...prev, ...newItems]);
    if (uploadState.kind !== "error") setUploadState({ kind: "idle" });
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setUploadState({ kind: "idle" });
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState((prev) => (prev.kind !== "dragging" ? { kind: "dragging" } : prev));
  }, []);

  const handleDragLeave = useCallback(() => {
    setUploadState((prev) => (prev.kind === "dragging" ? { kind: "idle" } : prev));
  }, []);

  async function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await processFiles(files);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleContinue() {
    if (items.length < 2) return;
    const sessionItems: MergeFileItem[] = items.map((item) => {
      const existing = getMergeSession()?.items.find((ex) => ex.id === item.id);
      return {
        id: item.id,
        file: item.file,
        totalPages: item.totalPages,
        rangeMode: existing?.rangeMode ?? "all",
        customRange: existing?.customRange,
      };
    });
    setMergeSession({ items: sessionItems });
    router.push("/merge/configure");
  }

  const totalPages = items.reduce((s, i) => s + i.totalPages, 0);
  const canContinue = items.length >= 2;

  return (
    <PageShell
      step={0}
      mode="merge"
      fullHeight={items.length > 0}
      footer={
        items.length > 0 ? (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
            <div className="w-full max-w-2xl py-4 space-y-3 flex flex-col items-center">
              {/* Requirement hint */}
              {items.length === 1 && (
                <p className="text-xs animate-fade-in text-center" style={{ color: "var(--color-text-muted)" }}>
                  Add at least one more PDF to continue.
                </p>
              )}

              {/* CTA */}
              {canContinue && (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="btn-primary w-full animate-fade-in flex items-center justify-center gap-2"
                  id="btn-merge-continue"
                >
                  Continue
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              {/* Privacy note */}
              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                Your files never leave your device. All processing happens locally.
              </p>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className={`w-full space-y-4 ${items.length > 0 ? "flex-1 flex flex-col overflow-hidden" : ""}`}>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {/* Page Title & Header */}
        <div className="space-y-1.5 text-center shrink-0">
          <h1
            className="text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            Add PDFs to merge
          </h1>
          <p
            className="text-sm leading-6 max-w-md mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Upload two or more PDF files. You'll set the order and choose which
            pages to include in the next step.
          </p>
        </div>

        {/* Drop zone - Fixed at top, shrink-0 */}
        {items.length === 0 && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload PDFs by clicking or dragging"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isLoading && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!isLoading) inputRef.current?.click();
              }
            }}
            className="relative overflow-hidden rounded-2xl transition-all duration-200 w-full max-w-2xl mx-auto shrink-0 animate-fade-in"
            style={{
              background: isDragging ? "var(--color-bg-subtle)" : "var(--color-surface)",
              border: `2px dashed ${isDragging ? "var(--color-border-strong)" : "var(--color-border)"}`,
              cursor: isLoading ? "default" : "pointer",
            }}
          >

            <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-12 text-center">
              {isLoading ? (
                <>
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "var(--color-bg-subtle)" }}
                  >
                    <Loader2
                      size={22}
                      className="animate-spin-slow"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    Reading PDFs…
                  </p>
                </>
              ) : (
                <>
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-200"
                    style={{
                      background: isDragging ? "var(--color-border)" : "var(--color-bg-subtle)",
                    }}
                  >
                    <Upload size={22} style={{ color: "var(--color-text-secondary)" }} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {isDragging ? "Release to add files" : "Drop PDF files here"}
                    </p>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      or{" "}
                      <span
                        className="font-medium underline underline-offset-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        click to browse
                      </span>
                      {" "}— you can select multiple files
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error - Fixed below drop zone, shrink-0 */}
        {uploadState.kind === "error" && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 w-full max-w-2xl mx-auto animate-fade-in shrink-0"
            style={{
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger-border)",
            }}
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--color-danger-text)" }} />
            <p className="text-sm" style={{ color: "var(--color-danger-text)" }}>
              {uploadState.message}
            </p>
          </div>
        )}

        {/* Stats row - Fixed, shrink-0 */}
        {items.length > 0 && (
          <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between shrink-0 animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              {items.length} {items.length === 1 ? "file" : "files"} added
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {totalPages} pages total
            </p>
          </div>
        )}

        {/* Scrollable File List Area */}
        {items.length > 0 && (
          <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-3 mb-28 pb-2 scrollbar-thin">
            <div className="w-full space-y-3 animate-fade-in text-left">
              {/* File rows */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="file-item-row animate-slide-in">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "var(--color-bg-subtle)" }}
                    >
                      <FileText size={16} style={{ color: "var(--color-text-secondary)" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {truncateFileName(item.file.name)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {formatFileSize(item.file.size)} · {item.totalPages}{" "}
                        {item.totalPages === 1 ? "page" : "pages"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.file.name}`}
                      className="btn-danger shrink-0"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Add more */}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-150"
                style={{
                  background: "transparent",
                  border: "1.5px dashed var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-strong)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-subtle)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <Plus size={15} />
                Add more files
              </button>
            </div>
          </div>
        )}

        {/* Privacy Note - Rendered inline when no files have been uploaded yet */}
        {items.length === 0 && (
          <p className="text-xs text-center animate-fade-in shrink-0 mt-2" style={{ color: "var(--color-text-muted)" }}>
            Your files never leave your device. All processing happens locally.
          </p>
        )}
      </div>
    </PageShell>
  );
}
