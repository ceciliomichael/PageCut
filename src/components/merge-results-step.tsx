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
import { mergePdfFiles } from "@/lib/pdf-merge";
import type { MergeResult } from "@/lib/pdf-merge";
import { clearMergeSession, getMergeSession } from "@/lib/pdf-session";

// ─── state machine ────────────────────────────────────────────────────────────

type ProcessState =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "done"; result: MergeResult; url: string; fileName: string }
  | { kind: "error"; message: string };

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: Uint8Array): string {
  const size = bytes.byteLength;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildMergedFileName(fileNames: string[]): string {
  const first = fileNames[0]?.replace(/\.pdf$/i, "") ?? "merged";
  // Sanitize: replace anything that's not alphanumeric, dash, or underscore
  const safe = first.replace(/[^a-z0-9._-]+/gi, "-");
  return `${safe}-merged.pdf`;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function MergeResultsStep() {
  const router = useRouter();
  const session = getMergeSession();
  const [state, setState] = useState<ProcessState>({ kind: "idle" });
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.replace("/merge");
      return;
    }
    void runMerge();
  }, []);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  async function runMerge() {
    if (!session) return;

    // Revoke any previous blob URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setState({ kind: "processing" });

    try {
      const result = await mergePdfFiles(session.items);

      const blob = new Blob([new Uint8Array(result.bytes).buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const fileName = buildMergedFileName(
        session.items.map((i) => i.file.name),
      );

      setState({ kind: "done", result, url, fileName });
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof Error ? err.message : "An error occurred during merging.",
      });
    }
  }

  function handleStartOver() {
    clearMergeSession();
    router.push("/");
  }

  function handleReconfigure() {
    router.push("/merge/configure");
  }

  const isProcessing = state.kind === "processing";

  return (
    <PageShell
      step={2}
      mode="merge"
      fullHeight={state.kind !== "processing"}
      footer={
        state.kind === "done" || state.kind === "error" ? (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
            <div className="w-full max-w-2xl py-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleReconfigure}
                  className="btn-secondary"
                  id="btn-merge-reconfigure"
                >
                  <ArrowLeft size={15} />
                  {state.kind === "error" ? "Edit configuration" : "Adjust files"}
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="btn-secondary sm:ml-auto"
                  id="btn-merge-start-over"
                >
                  <RotateCcw size={15} />
                  Start over
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                {state.kind === "done"
                  ? "Your merged PDF was generated locally. You can adjust the files or start fresh."
                  : "An error occurred. Adjust your configuration or start over with new files."}
              </p>
            </div>
          </div>
        ) : null
      }
    >
      <div
        className={`flex-1 flex flex-col w-full space-y-4 ${
          !isProcessing ? "overflow-hidden" : "justify-center"
        }`}
      >
        {/* Page title */}
        <div className="space-y-1.5 text-center shrink-0">
          <h1
            className="text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            {isProcessing
              ? "Merging files…"
              : state.kind === "done"
                ? "Your merged PDF is ready"
                : state.kind === "error"
                  ? "Something went wrong"
                  : "Preparing…"}
          </h1>
          <p
            className="text-sm leading-6 max-w-md mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {isProcessing
              ? "This may take a moment for large files."
              : state.kind === "done"
                ? `${state.result.totalPages} pages compiled from ${state.result.contributions.length} files.`
                : state.kind === "error"
                  ? "Check the error below and try again."
                  : ""}
          </p>
        </div>

        {/* Processing */}
        {isProcessing && (
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
              Merging your PDFs…
            </p>
          </div>
        )}

        {/* Error */}
        {state.kind === "error" && (
          <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-3 pb-36">
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
                  Merge failed
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

        {/* Done */}
        {state.kind === "done" && (
          <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-3 pb-36 space-y-4">
            {/* Success banner */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 animate-fade-in"
              style={{
                background: "var(--color-success-bg)",
                border: "1px solid var(--color-success-border)",
              }}
            >
              <CheckCircle2 size={16} style={{ color: "var(--color-success-text)" }} />
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-success-text)" }}
              >
                Merge completed successfully
              </p>
            </div>

            {/* Merged file card */}
            <div
              className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between animate-slide-in"
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
                  <FileDown size={18} style={{ color: "var(--color-text-secondary)" }} />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {state.fileName}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {state.result.totalPages} pages total ·{" "}
                    {formatFileSize(state.result.bytes)}
                  </p>
                </div>
              </div>
              <a
                href={state.url}
                download={state.fileName}
                className="btn-primary shrink-0"
                id="btn-download-merged"
              >
                <Download size={14} />
                Download
              </a>
            </div>

            {/* Per-file contribution breakdown */}
            <div>
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                Contribution breakdown
              </p>
              <div className="space-y-2">
                {state.result.contributions.map((c, i) => (
                  <div
                    key={`${c.fileName}-${i}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 animate-slide-in"
                    style={{
                      background: "var(--color-bg-subtle)",
                      border: "1px solid var(--color-border)",
                      animationDelay: `${i * 50}ms`,
                    }}
                  >
                    <p
                      className="truncate text-sm max-w-[60%]"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {c.fileName}
                    </p>
                    <p className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                      {c.fromPage === c.toPage
                        ? `p. ${c.fromPage}`
                        : `pp. ${c.fromPage}–${c.toPage}`}{" "}
                      · {c.pagesContributed}{" "}
                      {c.pagesContributed === 1 ? "page" : "pages"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
