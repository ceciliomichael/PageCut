"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { SignLivePreview } from "@/components/pdf-live-preview";
import { isSupportedImageFile, readImageDimensions } from "@/lib/image-to-pdf";
import {
  getPdfUtilitySession,
  type SignatureMode,
  setPdfUtilitySession,
} from "@/lib/pdf-utility-session";

const MODES: Array<{ value: SignatureMode; label: string }> = [
  { value: "type", label: "Type" },
  { value: "draw", label: "Draw" },
  { value: "upload", label: "Upload" },
];

type Point = { x: number; y: number };

export default function SignConfigureStep() {
  const router = useRouter();
  const session = getPdfUtilitySession("sign");
  const [options, setOptions] = useState(() => session?.options ?? null);
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [hasDrawing, setHasDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  useEffect(() => {
    if (!session) router.replace("/sign");
  }, [router, session]);

  if (!session || !options) return null;
  const activeSession = session;
  const activeOptions = options;
  const selectedPage = activeOptions.placement.pageIndex;
  const ready =
    activeOptions.mode === "type"
      ? activeOptions.text.trim().length > 0
      : Boolean(activeOptions.image);

  function selectMode(mode: SignatureMode) {
    setOptions((current) =>
      current
        ? {
            ...current,
            mode,
            image:
              mode === "type" || current.mode === mode
                ? current.image
                : undefined,
          }
        : current,
    );
    setError(null);
  }

  function canvasPoint(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const point = canvasPoint(event);
    if (!point) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = point;
  }

  function continueDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const point = canvasPoint(event);
    const last = lastPointRef.current;
    const canvas = canvasRef.current;
    if (!point || !last || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.strokeStyle = "#181818";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(last.x, last.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
    setHasDrawing(true);
  }

  function stopDrawing() {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearDrawing() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    setOptions({ ...activeOptions, image: undefined });
  }

  function useDrawing() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawing) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not prepare this signature drawing.");
        return;
      }
      const file = new File([blob], "signature.png", { type: "image/png" });
      setOptions({
        ...activeOptions,
        mode: "draw",
        image: { file, width: canvas.width, height: canvas.height },
      });
      setError(null);
    }, "image/png");
  }

  async function uploadSignature(file: File) {
    if (!isSupportedImageFile(file)) {
      setError("Use a PNG, JPG, or WebP signature image.");
      return;
    }
    try {
      const dimensions = await readImageDimensions(file);
      setOptions({
        ...activeOptions,
        mode: "upload",
        image: { file, ...dimensions },
      });
      setError(null);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not read this signature image.",
      );
    }
  }

  function changePage(pageIndex: number) {
    setOptions({
      ...activeOptions,
      placement: { ...activeOptions.placement, pageIndex },
    });
  }

  function changeSignatureWidth(width: number) {
    const nextWidth = Math.min(0.8, Math.max(0.08, width));
    setOptions({
      ...activeOptions,
      placement: {
        ...activeOptions.placement,
        x: Math.min(activeOptions.placement.x, 1 - nextWidth),
        width: nextWidth,
      },
    });
  }

  function savePdf() {
    if (!ready) {
      setError(
        activeOptions.mode === "type"
          ? "Type your signature first."
          : "Create or upload a signature first.",
      );
      return;
    }
    setPdfUtilitySession({
      ...activeSession,
      options: activeOptions,
      outputName: outputName.trim() || undefined,
    });
    router.push("/sign/results");
  }

  return (
    <PageShell step={1} mode="sign" fullHeight wide>
      <PdfEditorWorkspace
        title="Sign PDF"
        description="Create a signature, place it on any page, then drag and resize it directly in Preview."
        fileName={activeSession.file.name}
        pageCount={activeSession.totalPages}
        preview={
          <SignLivePreview
            file={activeSession.file}
            totalPages={activeSession.totalPages}
            options={activeOptions}
            onSelectPage={changePage}
            onChange={(placement) =>
              setOptions({ ...activeOptions, placement })
            }
          />
        }
        primaryLabel="Sign PDF"
        primaryDisabled={!ready}
        onPrimary={savePdf}
        onBack={() => router.push("/sign")}
        footerNote={`Signature on page ${selectedPage + 1}`}
      >
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2.5">
            <AlertCircle
              size={14}
              className="mt-0.5 shrink-0 text-[var(--color-danger-text)]"
            />
            <p className="text-xs leading-5 text-[var(--color-danger-text)]">
              {error}
            </p>
          </div>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Create signature
          </h2>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-bg-subtle)] p-1">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => selectMode(mode.value)}
                className={`h-9 rounded-lg text-xs font-semibold outline-none focus:outline-none focus-visible:outline-none ${
                  options.mode === mode.value
                    ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {options.mode === "type" && (
            <label className="mt-4 block text-xs font-medium text-[var(--color-text-secondary)]">
              Signature text
              <input
                className="input-field mt-1.5 font-serif italic"
                value={options.text}
                onChange={(event) => {
                  setOptions({ ...options, text: event.target.value });
                  setError(null);
                }}
                placeholder="Your name"
                maxLength={80}
              />
            </label>
          )}

          {options.mode === "draw" && (
            <div className="mt-4 space-y-2">
              <canvas
                ref={canvasRef}
                width={600}
                height={220}
                className="h-32 w-full touch-none rounded-xl border border-[var(--color-border)] bg-white"
                onPointerDown={startDrawing}
                onPointerMove={continueDrawing}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                aria-label="Draw your signature"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!hasDrawing && !options.image}
                  onClick={clearDrawing}
                >
                  <Trash2 size={13} />
                  Clear
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!hasDrawing}
                  onClick={useDrawing}
                >
                  <PenLine size={13} />
                  Use drawing
                </button>
              </div>
              {options.image && (
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Drawing is ready. Drag it in Preview to place it.
                </p>
              )}
            </div>
          )}

          {options.mode === "upload" && (
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] px-3 py-5 text-xs font-semibold text-[var(--color-text-secondary)]">
              <Upload size={15} />
              {options.image
                ? "Replace signature image"
                : "Choose signature image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadSignature(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          )}
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Placement
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-subtle)] disabled:text-[var(--color-text-muted)]"
              disabled={selectedPage === 0}
              onClick={() => changePage(Math.max(0, selectedPage - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} strokeWidth={2.25} className="shrink-0" />
            </button>
            <div className="flex h-9 flex-1 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)] text-xs font-medium text-[var(--color-text-secondary)]">
              Page {selectedPage + 1} of {activeSession.totalPages}
            </div>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-subtle)] disabled:text-[var(--color-text-muted)]"
              disabled={selectedPage === activeSession.totalPages - 1}
              onClick={() =>
                changePage(
                  Math.min(activeSession.totalPages - 1, selectedPage + 1),
                )
              }
              aria-label="Next page"
            >
              <ChevronRight size={16} strokeWidth={2.25} className="shrink-0" />
            </button>
          </div>

          <label className="mt-4 block text-xs font-medium text-[var(--color-text-secondary)]">
            Signature size · {Math.round(options.placement.width * 100)}%
            <input
              type="range"
              min={8}
              max={80}
              step={1}
              value={Math.round(options.placement.width * 100)}
              className="mt-2 w-full"
              onChange={(event) =>
                changeSignatureWidth(Number(event.target.value) / 100)
              }
            />
          </label>
          <p className="mt-2 text-[11px] leading-4 text-[var(--color-text-muted)]">
            Drag the signature to position it in Preview. Use this slider to
            change its size.
          </p>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Output filename
            <div className="relative mt-1.5 flex items-center">
              <input
                className="input-field pr-14"
                value={outputName}
                onChange={(event) => setOutputName(event.target.value)}
                placeholder="signed-document"
                maxLength={120}
              />
              <span className="pointer-events-none absolute right-3 text-xs text-[var(--color-text-muted)]">
                .pdf
              </span>
            </div>
          </label>
        </section>
      </PdfEditorWorkspace>
    </PageShell>
  );
}
