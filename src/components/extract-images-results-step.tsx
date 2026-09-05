"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ImageIcon,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import {
  type ExtractedImageItem,
  extractImagesFromPdf,
} from "@/lib/extract-images";
import {
  clearExtractImagesSession,
  getExtractImagesSession,
} from "@/lib/extract-images-session";

type ReadyImage = ExtractedImageItem & { url: string };

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

export default function ExtractImagesResultsStep() {
  const router = useRouter();
  const urlsRef = useRef<string[]>([]);
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    const session = getExtractImagesSession();
    if (!session) {
      router.replace("/extract-images");
      return;
    }
    const activeSession = session;
    const total =
      activeSession.options.toPage - activeSession.options.fromPage + 1;
    let cancelled = false;

    async function run() {
      setState({ kind: "processing", completed: 0, total });
      try {
        const items = await extractImagesFromPdf(
          activeSession,
          (completed, progressTotal) => {
            if (!cancelled) {
              setState({ kind: "processing", completed, total: progressTotal });
            }
          },
        );
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
                : "Could not extract images from this PDF.",
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
    clearExtractImagesSession();
    router.push("/");
  }

  const finished = state.kind === "done" || state.kind === "error";

  return (
    <PageShell
      step={2}
      mode="extract-images"
      fullHeight={state.kind !== "processing"}
      footer={
        finished ? (
          <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 md:px-6 lg:px-8">
            <div className="w-full max-w-2xl space-y-3 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => router.push("/extract-images/configure")}
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
                Embedded images were inspected and converted locally in your
                browser.
              </p>
            </div>
          </div>
        ) : undefined
      }
    >
      <div
        className={`flex w-full flex-1 flex-col space-y-4 ${
          state.kind === "processing" ? "justify-center" : "overflow-hidden"
        }`}
      >
        <div className="shrink-0 space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-3xl">
            {state.kind === "processing"
              ? "Finding embedded images..."
              : state.kind === "done"
                ? state.images.length > 0
                  ? "Your images are ready"
                  : "No raster images found"
                : state.kind === "error"
                  ? "Something went wrong"
                  : "Preparing..."}
          </h1>
          {state.kind === "processing" && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {state.completed} of {state.total} pages scanned
            </p>
          )}
          {state.kind === "done" && state.images.length > 0 && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {state.images.length} embedded{" "}
              {state.images.length === 1 ? "image" : "images"} extracted
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

        {state.kind === "done" && state.images.length === 0 && (
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center">
            <ImageIcon
              size={24}
              className="mx-auto text-[var(--color-text-muted)]"
            />
            <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
              This range has no supported embedded raster images.
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[var(--color-text-muted)]">
              The PDF may contain only text/vector artwork, very small images
              below your filter, or image encodings that PDF.js does not expose
              as normal raster objects. Try lowering the minimum dimensions or
              scanning more pages.
            </p>
          </div>
        )}

        {state.kind === "done" && state.images.length > 0 && (
          <div className="mx-auto mb-40 flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-4 sm:mb-28">
            <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <CheckCircle2
                  size={16}
                  className="text-[var(--color-success-text)]"
                />
                <p className="text-sm font-medium text-[var(--color-success-text)]">
                  Extraction completed successfully
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
                  key={image.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-bg-subtle)]">
                    {/* biome-ignore lint/performance/noImgElement: preview uses a local blob URL. */}
                    <img
                      src={image.url}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
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
                    aria-label={`Download image ${image.imageNumber} from page ${image.pageNumber}`}
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
