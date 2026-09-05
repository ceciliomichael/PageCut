"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileImage,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import {
  convertPdfToImages,
  type PdfImageResultItem,
} from "@/lib/pdf-to-image";
import {
  clearPdfToImageSession,
  getPdfToImageSession,
} from "@/lib/pdf-to-image-session";

type ReadyImage = PdfImageResultItem & { url: string };

type State =
  | { kind: "idle" }
  | { kind: "processing"; completed: number; total: number }
  | { kind: "done"; images: ReadyImage[] }
  | { kind: "error"; message: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function PdfToImageResultsStep() {
  const router = useRouter();
  const urlsRef = useRef<string[]>([]);
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    const session = getPdfToImageSession();
    if (!session) {
      router.replace("/pdf-to-image");
      return;
    }
    const activeSession = session;
    const total =
      activeSession.options.toPage - activeSession.options.fromPage + 1;
    let cancelled = false;

    async function run() {
      setState({ kind: "processing", completed: 0, total });
      try {
        const items = await convertPdfToImages(activeSession, (completed) => {
          if (!cancelled) setState({ kind: "processing", completed, total });
        });
        if (cancelled) return;
        const images = items.map((item) => {
          const url = URL.createObjectURL(item.blob);
          urlsRef.current.push(url);
          return { ...item, url };
        });
        setState({ kind: "done", images });
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not convert these PDF pages.",
          });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    return () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current = [];
    };
  }, []);

  function startOver() {
    clearPdfToImageSession();
    router.push("/");
  }

  return (
    <PageShell
      step={2}
      mode="pdf-to-image"
      fullHeight={state.kind !== "processing"}
      footer={
        state.kind === "done" || state.kind === "error" ? (
          <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 md:px-6 lg:px-8">
            <div className="w-full max-w-2xl space-y-3 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => router.push("/pdf-to-image/configure")}
                  className="btn-secondary"
                >
                  <ArrowLeft size={15} />
                  Adjust settings
                </button>
                <button
                  type="button"
                  onClick={startOver}
                  className="btn-secondary sm:ml-auto"
                >
                  <RotateCcw size={15} />
                  Start over
                </button>
              </div>
              <p className="text-center text-xs text-[var(--color-text-muted)]">
                Images were rendered locally in your browser.
              </p>
            </div>
          </div>
        ) : undefined
      }
    >
      <div
        className={`flex w-full flex-1 flex-col space-y-4 ${state.kind === "processing" ? "justify-center" : "overflow-hidden"}`}
      >
        <div className="shrink-0 space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-3xl">
            {state.kind === "processing"
              ? "Converting your PDF..."
              : state.kind === "done"
                ? "Your images are ready"
                : state.kind === "error"
                  ? "Something went wrong"
                  : "Preparing..."}
          </h1>
          {state.kind === "processing" && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {state.completed} of {state.total} pages rendered
            </p>
          )}
          {state.kind === "done" && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {state.images.length}{" "}
              {state.images.length === 1 ? "image" : "images"} created
            </p>
          )}
        </div>

        {state.kind === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16">
            <Loader2
              size={24}
              className="animate-spin-slow text-[var(--color-text-secondary)]"
            />
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
              <div
                className="h-full bg-[var(--color-accent)] transition-[width]"
                style={{
                  width: `${state.total > 0 ? (state.completed / state.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {state.kind === "error" && (
          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-4">
            <AlertCircle
              size={16}
              className="mt-0.5 text-[var(--color-danger-text)]"
            />
            <p className="text-sm text-[var(--color-danger-text)]">
              {state.message}
            </p>
          </div>
        )}

        {state.kind === "done" && (
          <div className="mx-auto mb-40 flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-4 sm:mb-28">
            <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <CheckCircle2
                  size={16}
                  className="text-[var(--color-success-text)]"
                />
                <p className="text-sm font-medium text-[var(--color-success-text)]">
                  Conversion completed successfully
                </p>
              </div>
              {state.images.length > 1 && (
                <button
                  type="button"
                  className="btn-primary shrink-0"
                  onClick={() => {
                    for (const image of state.images) {
                      triggerDownload(image.url, image.fileName);
                    }
                  }}
                >
                  <Download size={14} />
                  Download all
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
              {state.images.map((image) => (
                <div
                  key={image.pageNumber}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <div className="icon-box h-9 w-9 shrink-0">
                    <FileImage size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                      {image.fileName}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Page {image.pageNumber} · {image.width} × {image.height} ·{" "}
                      {formatBytes(image.blob.size)}
                    </p>
                  </div>
                  <a
                    href={image.url}
                    download={image.fileName}
                    className="btn-secondary shrink-0 px-3"
                    aria-label={`Download page ${image.pageNumber}`}
                  >
                    <Download size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
