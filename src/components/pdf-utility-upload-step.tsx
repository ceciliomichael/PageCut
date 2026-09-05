"use client";

import { AlertCircle, FileText, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { getPageCount, truncateFileName } from "@/lib/pdf-extract";
import {
  createPdfToImageSession,
  setPdfToImageSession,
} from "@/lib/pdf-to-image-session";
import {
  createPdfUtilitySession,
  type PdfUtilityKind,
  setPdfUtilitySession,
} from "@/lib/pdf-utility-session";

type PdfUploadKind = PdfUtilityKind | "pdf-to-image";

type UploadState =
  | { kind: "idle" }
  | { kind: "dragging" }
  | { kind: "loading" }
  | { kind: "ready"; file: File; totalPages: number }
  | { kind: "error"; message: string };

const COPY: Record<
  PdfUploadKind,
  { title: string; description: string; next: string }
> = {
  organize: {
    title: "Upload a PDF to organize",
    description: "Reorder, rotate, or remove pages before saving a new PDF.",
    next: "/organize/configure",
  },
  "page-numbers": {
    title: "Upload a PDF to number",
    description: "Add clean page numbers to all pages or a selected range.",
    next: "/page-numbers/configure",
  },
  watermark: {
    title: "Upload a PDF to watermark",
    description:
      "Apply a text or image watermark across every page of your PDF.",
    next: "/watermark/configure",
  },
  crop: {
    title: "Upload a PDF to crop",
    description:
      "Trim page edges while keeping the original PDF content sharp.",
    next: "/crop/configure",
  },
  "pdf-to-image": {
    title: "Upload a PDF to convert",
    description: "Turn PDF pages into lossless PNG images.",
    next: "/pdf-to-image/configure",
  },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfUtilityUploadStep({
  kind,
}: {
  kind: PdfUploadKind;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const copy = COPY[kind];

  async function processFile(file: File) {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setState({ kind: "error", message: "Only PDF files are accepted." });
      return;
    }

    setState({ kind: "loading" });
    try {
      const totalPages = await getPageCount(file);
      if (totalPages < 1) {
        setState({ kind: "error", message: "This PDF has no pages." });
        return;
      }
      setState({ kind: "ready", file, totalPages });
    } catch {
      setState({
        kind: "error",
        message: "Could not read this PDF. It may be encrypted or corrupted.",
      });
    }
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) await processFile(file);
  }

  function handleContinue() {
    if (state.kind !== "ready") return;
    if (kind === "pdf-to-image") {
      setPdfToImageSession(
        createPdfToImageSession(state.file, state.totalPages),
      );
      router.push(copy.next);
      return;
    }
    setPdfUtilitySession(
      createPdfUtilitySession(kind, state.file, state.totalPages),
    );
    router.push(copy.next);
  }

  const isReady = state.kind === "ready";
  const isLoading = state.kind === "loading";
  const isDragging = state.kind === "dragging";

  return (
    <PageShell
      step={0}
      mode={kind}
      fullHeight={isReady}
      footer={
        isReady ? (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
            <div className="w-full max-w-2xl py-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setState({ kind: "idle" })}
                  className="btn-secondary"
                >
                  <X size={15} />
                  Remove file
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="btn-primary sm:ml-auto"
                >
                  Continue
                </button>
              </div>
              <p className="text-xs text-center text-[var(--color-text-muted)]">
                No upload or account required. Processing stays in this browser.
              </p>
            </div>
          </div>
        ) : undefined
      }
    >
      <div
        className={`w-full space-y-6 ${isReady ? "flex-1 flex flex-col justify-center pb-28" : ""}`}
      >
        <div className="space-y-2 text-center shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl text-[var(--color-text-primary)]">
            {copy.title}
          </h1>
          <p className="text-sm leading-6 max-w-md mx-auto text-[var(--color-text-secondary)]">
            {copy.description}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) await processFile(file);
          }}
        />

        <button
          type="button"
          aria-label="Upload PDF by clicking or dragging"
          onClick={() => !isLoading && !isReady && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            if (!isReady && !isLoading) setState({ kind: "dragging" });
          }}
          onDragLeave={() => {
            if (state.kind === "dragging") setState({ kind: "idle" });
          }}
          className="relative block overflow-hidden rounded-2xl transition-all duration-200 w-full max-w-2xl mx-auto shrink-0"
          style={{
            background: isDragging
              ? "var(--color-bg-subtle)"
              : "var(--color-surface)",
            border: `2px dashed ${isDragging ? "var(--color-border-strong)" : "var(--color-border)"}`,
            cursor: isLoading || isReady ? "default" : "pointer",
          }}
        >
          <span className="flex min-h-72 flex-col items-center justify-center gap-4 p-12 text-center">
            {isLoading ? (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-bg-subtle)]">
                  <Loader2
                    size={22}
                    className="animate-spin-slow text-[var(--color-text-secondary)]"
                  />
                </span>
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Reading PDF...
                </span>
              </>
            ) : isReady && state.kind === "ready" ? (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-bg-subtle)]">
                  <FileText
                    size={22}
                    className="text-[var(--color-text-secondary)]"
                  />
                </span>
                <span className="space-y-1">
                  <span className="block max-w-xs break-words text-base font-semibold text-[var(--color-text-primary)]">
                    {truncateFileName(state.file.name)}
                  </span>
                  <span className="block text-sm text-[var(--color-text-muted)]">
                    {formatFileSize(state.file.size)} · {state.totalPages}{" "}
                    {state.totalPages === 1 ? "page" : "pages"}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-bg-subtle)]">
                  <Upload
                    size={22}
                    className="text-[var(--color-text-secondary)]"
                  />
                </span>
                <span className="space-y-1">
                  <span className="block text-base font-medium text-[var(--color-text-primary)]">
                    {isDragging ? "Release to upload" : "Drop your PDF here"}
                  </span>
                  <span className="block text-sm text-[var(--color-text-muted)]">
                    or{" "}
                    <span className="font-medium underline underline-offset-2">
                      click to browse
                    </span>
                  </span>
                </span>
              </>
            )}
          </span>
        </button>

        {state.kind === "error" && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 max-w-2xl mx-auto animate-fade-in bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)]">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-[var(--color-danger-text)]"
            />
            <p className="text-sm text-[var(--color-danger-text)]">
              {state.message}
            </p>
          </div>
        )}

        {!isReady && (
          <p className="text-xs text-center text-[var(--color-text-muted)]">
            No artificial page or file-count limits are applied by PageCut.
          </p>
        )}
      </div>
    </PageShell>
  );
}
