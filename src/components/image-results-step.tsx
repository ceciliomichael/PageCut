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
import type { ImagePdfResult } from "@/lib/image-to-pdf";
import { createPdfFromImages } from "@/lib/image-to-pdf";
import {
  clearImageToPdfSession,
  getImageToPdfSession,
} from "@/lib/pdf-session";

type ProcessState =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "done"; result: ImagePdfResult; url: string; fileName: string }
  | { kind: "error"; message: string };

function formatFileSize(bytes: Uint8Array): string {
  const size = bytes.byteLength;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildFileName(sourceName: string | undefined): string {
  const base = sourceName?.replace(/\.(jpe?g|png|webp)$/i, "") || "images";
  const safe = base.replace(/[^a-z0-9._-]+/gi, "-");
  return `${safe}-images.pdf`;
}

export default function ImageResultsStep() {
  const router = useRouter();
  const [state, setState] = useState<ProcessState>({ kind: "idle" });
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const session = getImageToPdfSession();
    if (!session) {
      router.replace("/image-to-pdf");
      return;
    }
    const activeSession = session;

    async function runConversion() {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setState({ kind: "processing" });

      try {
        const result = await createPdfFromImages(activeSession.items);
        const blob = new Blob(
          [new Uint8Array(result.bytes).buffer as ArrayBuffer],
          { type: "application/pdf" },
        );
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const userLabel = activeSession.outputName?.trim();
        const safeLabel = userLabel
          ? userLabel.replace(/[^a-z0-9._-]+/gi, "-").replace(/\.pdf$/i, "")
          : null;
        const fileName = safeLabel
          ? `${safeLabel}.pdf`
          : buildFileName(activeSession.items[0]?.file.name);

        setState({ kind: "done", result, url, fileName });
      } catch (error) {
        setState({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "An error occurred while creating the PDF.",
        });
      }
    }

    void runConversion();
  }, [router]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleStartOver() {
    clearImageToPdfSession();
    router.push("/");
  }

  const isProcessing = state.kind === "processing";

  return (
    <PageShell
      step={2}
      mode="image"
      fullHeight={state.kind !== "processing"}
      footer={
        state.kind === "done" || state.kind === "error" ? (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
            <div className="w-full max-w-2xl py-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => router.push("/image-to-pdf/configure")}
                  className="btn-secondary"
                  id="btn-image-reconfigure"
                >
                  <ArrowLeft size={15} />
                  Adjust images
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="btn-secondary sm:ml-auto"
                  id="btn-image-start-over"
                >
                  <RotateCcw size={15} />
                  Start over
                </button>
              </div>
              <p
                className="text-xs text-center"
                style={{ color: "var(--color-text-muted)" }}
              >
                {state.kind === "done"
                  ? "Your PDF was generated locally in this browser."
                  : "Adjust your images and try again, or start over."}
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
        <div className="space-y-1.5 text-center shrink-0">
          <h1
            className="text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            {isProcessing
              ? "Creating your PDF..."
              : state.kind === "done"
                ? "Your PDF is ready"
                : state.kind === "error"
                  ? "Something went wrong"
                  : "Preparing..."}
          </h1>
          <p
            className="text-sm leading-6 max-w-md mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {isProcessing
              ? "Large images may take a moment to process."
              : state.kind === "done"
                ? `${state.result.totalPages} ${state.result.totalPages === 1 ? "page" : "pages"} created from ${state.result.sources.length} ${state.result.sources.length === 1 ? "image" : "images"}.`
                : state.kind === "error"
                  ? "Check the error below and try again."
                  : ""}
          </p>
        </div>

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
              Converting images to PDF...
            </p>
          </div>
        )}

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
                  Conversion failed
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

        {state.kind === "done" && (
          <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto px-3 overflow-hidden space-y-4 mb-44 sm:mb-28">
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
                PDF created successfully
              </p>
            </div>

            <div
              className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between animate-slide-in shrink-0"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="icon-box h-10 w-10 rounded-xl">
                  <FileDown
                    size={18}
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {state.fileName}
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {state.result.totalPages}{" "}
                    {state.result.totalPages === 1 ? "page" : "pages"} ·{" "}
                    {formatFileSize(state.result.bytes)}
                  </p>
                </div>
              </div>
              <a
                href={state.url}
                download={state.fileName}
                className="btn-primary shrink-0"
                id="btn-download-image-pdf"
              >
                <Download size={14} />
                Download
              </a>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-wider shrink-0"
                style={{ color: "var(--color-text-muted)" }}
              >
                Page order
              </p>
              <div className="flex-1 overflow-y-auto space-y-2 pb-2 scrollbar-thin">
                {state.result.sources.map((source, index) => (
                  <div
                    key={`${source.fileName}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 animate-slide-in"
                    style={{
                      background: "var(--color-bg-subtle)",
                      border: "1px solid var(--color-border)",
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <p
                      className="truncate text-sm"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {source.fileName}
                    </p>
                    <p
                      className="text-xs shrink-0"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Page {index + 1} · {source.width} × {source.height}
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
