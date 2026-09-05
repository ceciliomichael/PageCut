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
import { type PdfUtilityResult, processPdfUtility } from "@/lib/pdf-utilities";
import {
  clearPdfUtilitySession,
  getPdfUtilitySession,
  type PdfUtilityKind,
} from "@/lib/pdf-utility-session";

type ProcessState =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "done"; result: PdfUtilityResult; url: string; fileName: string }
  | { kind: "error"; message: string };

const COPY: Record<
  PdfUtilityKind,
  { processing: string; ready: string; suffix: string; configure: string }
> = {
  organize: {
    processing: "Organizing your PDF...",
    ready: "Your organized PDF is ready",
    suffix: "organized",
    configure: "/organize/configure",
  },
  "page-numbers": {
    processing: "Adding page numbers...",
    ready: "Your numbered PDF is ready",
    suffix: "numbered",
    configure: "/page-numbers/configure",
  },
  watermark: {
    processing: "Applying watermark...",
    ready: "Your watermarked PDF is ready",
    suffix: "watermarked",
    configure: "/watermark/configure",
  },
  crop: {
    processing: "Cropping your PDF...",
    ready: "Your cropped PDF is ready",
    suffix: "cropped",
    configure: "/crop/configure",
  },
  resize: {
    processing: "Resizing PDF pages...",
    ready: "Your resized PDF is ready",
    suffix: "resized",
    configure: "/resize/configure",
  },
  sign: {
    processing: "Adding your signature...",
    ready: "Your signed PDF is ready",
    suffix: "signed",
    configure: "/sign/configure",
  },
};

function formatFileSize(bytes: Uint8Array): string {
  const size = bytes.byteLength;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function outputFileName(
  sourceName: string,
  customName: string | undefined,
  suffix: string,
): string {
  const custom = customName?.trim();
  if (custom) {
    const safe = custom.replace(/[^a-z0-9._-]+/gi, "-").replace(/\.pdf$/i, "");
    return `${safe}.pdf`;
  }
  const base =
    sourceName.replace(/\.pdf$/i, "").replace(/[^a-z0-9._-]+/gi, "-") ||
    "document";
  return `${base}-${suffix}.pdf`;
}

export default function PdfUtilityResultsStep({
  kind,
}: {
  kind: PdfUtilityKind;
}) {
  const router = useRouter();
  const objectUrlRef = useRef<string | null>(null);
  const [state, setState] = useState<ProcessState>({ kind: "idle" });
  const copy = COPY[kind];

  useEffect(() => {
    const session = getPdfUtilitySession(kind);
    if (!session) {
      router.replace(`/${kind}`);
      return;
    }
    const activeSession = session;

    async function run() {
      setState({ kind: "processing" });
      try {
        const result = await processPdfUtility(activeSession);
        const blob = new Blob(
          [new Uint8Array(result.bytes).buffer as ArrayBuffer],
          {
            type: "application/pdf",
          },
        );
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setState({
          kind: "done",
          result,
          url,
          fileName: outputFileName(
            activeSession.file.name,
            activeSession.outputName,
            copy.suffix,
          ),
        });
      } catch (error) {
        setState({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not process this PDF.",
        });
      }
    }

    void run();
  }, [copy.suffix, kind, router]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function startOver() {
    clearPdfUtilitySession();
    router.push("/");
  }

  return (
    <PageShell
      step={2}
      mode={kind}
      fullHeight={state.kind !== "processing"}
      footer={
        state.kind === "done" || state.kind === "error" ? (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
            <div className="w-full max-w-2xl py-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => router.push(copy.configure)}
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
              <p className="text-xs text-center text-[var(--color-text-muted)]">
                The processed PDF was generated locally in your browser.
              </p>
            </div>
          </div>
        ) : undefined
      }
    >
      <div
        className={`flex-1 flex flex-col w-full space-y-4 ${state.kind === "processing" ? "justify-center" : "overflow-hidden"}`}
      >
        <div className="space-y-1.5 text-center shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl text-[var(--color-text-primary)]">
            {state.kind === "processing"
              ? copy.processing
              : state.kind === "done"
                ? copy.ready
                : state.kind === "error"
                  ? "Something went wrong"
                  : "Preparing..."}
          </h1>
          {state.kind === "done" && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {state.result.summary}
            </p>
          )}
        </div>

        {state.kind === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl py-16 bg-[var(--color-surface)] border border-[var(--color-border)]">
            <Loader2
              size={24}
              className="animate-spin-slow text-[var(--color-text-secondary)]"
            />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Processing locally...
            </p>
          </div>
        )}

        {state.kind === "error" && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-4 bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)]">
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
          <div className="w-full max-w-2xl mx-auto space-y-4 mb-40 sm:mb-28">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-[var(--color-success-bg)] border border-[var(--color-success-border)]">
              <CheckCircle2
                size={16}
                className="text-[var(--color-success-text)]"
              />
              <p className="text-sm font-medium text-[var(--color-success-text)]">
                PDF created successfully
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="icon-box h-10 w-10 rounded-xl">
                  <FileDown size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {state.fileName}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {state.result.totalPages} pages ·{" "}
                    {formatFileSize(state.result.bytes)}
                  </p>
                </div>
              </div>
              <a
                href={state.url}
                download={state.fileName}
                className="btn-primary shrink-0"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
