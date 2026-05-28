"use client";

import { AlertCircle, FileText, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useCallback, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { getPageCount, truncateFileName } from "@/lib/pdf-extract";
import { setSession } from "@/lib/pdf-session";

type UploadState =
  | { kind: "idle" }
  | { kind: "dragging" }
  | { kind: "loading" }
  | { kind: "ready"; file: File; totalPages: number }
  | { kind: "error"; message: string };

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      if (totalPages === 0) {
        setState({
          kind: "error",
          message: "This PDF has no pages.",
        });
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

  async function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await processFile(file);
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setState({ kind: "idle" });
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState((prev) =>
      prev.kind !== "dragging" ? { kind: "dragging" } : prev,
    );
  }, []);

  const handleDragLeave = useCallback(() => {
    setState((prev) => (prev.kind === "dragging" ? { kind: "idle" } : prev));
  }, []);

  function handleClear() {
    setState({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleContinue() {
    if (state.kind !== "ready") return;
    setSession({ file: state.file, totalPages: state.totalPages, ranges: [] });
    router.push("/split/configure");
  }

  const isDragging = state.kind === "dragging";
  const isLoading = state.kind === "loading";
  const isReady = state.kind === "ready";
  const isError = state.kind === "error";

  return (
    <PageShell
      step={0}
      fullHeight={isReady}
      footer={
        isReady ? (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
            <div className="w-full max-w-2xl py-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-secondary"
                  id="btn-clear-file"
                >
                  <X size={15} />
                  Remove file
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="btn-primary sm:ml-auto"
                  id="btn-continue-to-configure"
                >
                  Continue
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <p
                className="text-xs text-center"
                style={{ color: "var(--color-text-muted)" }}
              >
                Your file never leaves your device. All processing happens locally.
              </p>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className={`w-full space-y-6 ${isReady ? "flex-1 flex flex-col justify-center pb-28" : ""}`}>
        <div className="space-y-2 text-center shrink-0">
          <h1
            className="text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            Upload your PDF
          </h1>
          <p
            className="text-sm leading-6 max-w-md mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            This file will be used as a template. You'll define exactly which
            pages to extract in the next step.
          </p>
        </div>

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload PDF by clicking or dragging"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isLoading && !isReady && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!isLoading && !isReady) inputRef.current?.click();
            }
          }}
          className="relative overflow-hidden rounded-2xl transition-all duration-200 w-full max-w-2xl mx-auto shrink-0"
          style={{
            background: isDragging
              ? "var(--color-bg-subtle)"
              : "var(--color-surface)",
            border: `2px dashed ${isDragging ? "var(--color-border-strong)" : "var(--color-border)"}`,
            cursor: isLoading || isReady ? "default" : "pointer",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={handleInputChange}
            disabled={isLoading}
          />

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
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Reading PDF…
                </p>
              </>
            ) : isReady && state.kind === "ready" ? (
              <>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "var(--color-bg-subtle)" }}
                >
                  <FileText
                    size={22}
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                </div>
                <div className="space-y-1">
                  <p
                    className="max-w-xs break-words text-base font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {truncateFileName(state.file.name)}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {formatFileSize(state.file.size)} ·{" "}
                    <strong>{state.totalPages}</strong>{" "}
                    {state.totalPages === 1 ? "page" : "pages"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-200"
                  style={{
                    background: isDragging
                      ? "var(--color-border)"
                      : "var(--color-bg-subtle)",
                  }}
                >
                  <Upload
                    size={22}
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                </div>
                <div className="space-y-1">
                  <p
                    className="text-base font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {isDragging ? "Release to upload" : "Drop your PDF here"}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    or{" "}
                    <span
                      className="font-medium underline underline-offset-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      click to browse
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {isError && state.kind === "error" && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 max-w-2xl mx-auto animate-fade-in shrink-0"
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
            <p
              className="text-sm"
              style={{ color: "var(--color-danger-text)" }}
            >
              {state.message}
            </p>
          </div>
        )}

        {/* Inline Footer note when no file uploaded yet */}
        {!isReady && (
          <p
            className="text-xs text-center animate-fade-in mt-2 shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          >
            Your file never leaves your device. All processing happens locally.
          </p>
        )}
      </div>
    </PageShell>
  );
}
