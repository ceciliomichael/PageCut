"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileDown,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { type ExtractedChunk, extractPageRanges, truncateFileName } from "@/lib/pdf-extract";
import { clearSession, getSession } from "@/lib/pdf-session";

type ProcessState =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "done"; chunks: DownloadableChunk[] }
  | { kind: "error"; message: string };

type DownloadableChunk = ExtractedChunk & { url: string; label?: string };

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function formatFileSize(bytes: Uint8Array): string {
  const size = bytes.byteLength;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResultsPage() {
  const session = getSession();
  const router = useRouter();
  const [state, setState] = useState<ProcessState>({ kind: "idle" });
  const objectUrlsRef = useRef<string[]>([]);

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      router.replace("/");
      return;
    }
    if (session.ranges.length === 0) {
      router.replace("/configure");
      return;
    }
    void runExtraction();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  async function runExtraction() {
    if (!session) return;
    setState({ kind: "processing" });

    // Revoke old
    for (const url of objectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    objectUrlsRef.current = [];

    try {
      const rawChunks = await extractPageRanges(session.file, session.ranges);

      const chunks: DownloadableChunk[] = rawChunks.map((chunk) => {
        const url = URL.createObjectURL(
          new Blob([toArrayBuffer(chunk.bytes)], { type: "application/pdf" }),
        );
        objectUrlsRef.current.push(url);

        const matchingRange = session.ranges.find(
          (r) => r.id === chunk.rangeId,
        );

        return {
          ...chunk,
          url,
          label: matchingRange?.label,
        };
      });

      setState({ kind: "done", chunks });
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "An error occurred during extraction.",
      });
    }
  }

  function handleStartOver() {
    clearSession();
    router.push("/");
  }

  function handleReconfigure() {
    router.push("/configure");
  }

  return (
    <PageShell
      step={2}
      fullHeight={state.kind !== "processing"}
      footer={
        state.kind === "done" ? (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
            <div className="w-full max-w-2xl py-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleReconfigure}
                  className="btn-secondary"
                  id="btn-adjust-ranges"
                >
                  <ArrowLeft size={15} />
                  Adjust ranges
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="btn-secondary sm:ml-auto"
                  id="btn-start-over"
                >
                  <RotateCcw size={15} />
                  Start over
                </button>
              </div>
              <p
                className="text-xs text-center"
                style={{ color: "var(--color-text-muted)" }}
              >
                Your splits were generated locally. You can adjust the ranges or start over with a new PDF template.
              </p>
            </div>
          </div>
        ) : state.kind === "error" ? (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
            <div className="w-full max-w-2xl py-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleReconfigure}
                  className="btn-secondary"
                  id="btn-back-configure"
                >
                  <ArrowLeft size={15} />
                  Edit ranges
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="btn-secondary sm:ml-auto"
                  id="btn-start-over"
                >
                  <RotateCcw size={15} />
                  Start over
                </button>
              </div>
              <p
                className="text-xs text-center"
                style={{ color: "var(--color-text-muted)" }}
              >
                An error occurred during splitting. Adjust your page ranges or start over with a new PDF template.
              </p>
            </div>
          </div>
        ) : null
      }
    >
      <div className={`flex-1 flex flex-col w-full space-y-4 ${state.kind !== "processing" ? "overflow-hidden" : "justify-center"}`}>
        {/* Sticky Page Title and Description */}
        <div className="space-y-1.5 text-center shrink-0">
          <h1
            className="text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            {state.kind === "processing"
              ? "Extracting pages…"
              : state.kind === "done"
                ? state.chunks.length === 1
                  ? "Your file is ready"
                  : "Your files are ready"
                : state.kind === "error"
                  ? "Something went wrong"
                  : "Preparing…"}
          </h1>
          <p
            className="text-sm leading-6 max-w-md mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {state.kind === "processing"
              ? "This may take a moment for large files."
              : state.kind === "done" && state.chunks.length > 0
                ? `${state.chunks.length} ${state.chunks.length === 1 ? "file" : "files"} extracted from your PDF.`
                : state.kind === "error"
                  ? "Check the error below and try again."
                  : ""}
          </p>
        </div>

        {/* Processing State */}
        {state.kind === "processing" && (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-2xl py-16 animate-fade-in"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "var(--color-bg-subtle)" }}
            >
              <Loader2
                size={24}
                className="animate-spin-slow"
                style={{ color: "var(--color-text-secondary)" }}
              />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Processing your PDF…
            </p>
          </div>
        )}

        {/* Error State */}
        {state.kind === "error" && (
          <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-3 pb-36 scrollbar-thin">
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-4 animate-fade-in"
              style={{
                background: "var(--color-danger-bg)",
                border: "1px solid var(--color-danger-border)",
              }}
            >
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--color-danger-text)" }}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-danger-text)" }}
                >
                  Extraction failed
                </p>
                <p
                  className="mt-0.5 text-sm"
                  style={{ color: "var(--color-danger-text)", opacity: 0.8 }}
                >
                  {state.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Done State */}
        {state.kind === "done" && (
          <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-3 pb-36 space-y-4 scrollbar-thin">
            {/* Success banner */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 animate-fade-in shrink-0"
              style={{
                background: "var(--color-success-bg)",
                border: "1px solid var(--color-success-border)",
              }}
            >
              <CheckCircle2
                size={16}
                style={{ color: "var(--color-success-text)" }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-success-text)" }}
              >
                All ranges extracted successfully
              </p>
            </div>

            {/* File cards */}
            <div className="space-y-2">
              {state.chunks.map((chunk, index) => (
                <article
                  key={chunk.rangeId}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div
                    className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "var(--color-bg-subtle)" }}
                      >
                        <FileDown
                          size={18}
                          style={{ color: "var(--color-text-secondary)" }}
                        />
                      </div>
                      <div className="min-w-0">
                        {chunk.label ? (
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {chunk.label}
                          </p>
                        ) : null}
                        <p
                          className="truncate text-sm font-medium"
                          style={{
                            color: chunk.label
                              ? "var(--color-text-secondary)"
                              : "var(--color-text-primary)",
                          }}
                        >
                          {truncateFileName(chunk.fileName)}
                        </p>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Pages {chunk.pageStart}–{chunk.pageEnd} ·{" "}
                          {chunk.pageCount}{" "}
                          {chunk.pageCount === 1 ? "page" : "pages"} total ·{" "}
                          {formatFileSize(chunk.bytes)}
                        </p>
                      </div>
                    </div>

                    <a
                      href={chunk.url}
                      download={chunk.fileName}
                      className="btn-primary shrink-0"
                      id={`btn-download-range-${index}`}
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
