"use client";

import {
  AlertCircle,
  Images,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { isSupportedImageFile, readImageDimensions } from "@/lib/image-to-pdf";
import { truncateFileName } from "@/lib/pdf-extract";
import type { ImageFileItem } from "@/lib/pdf-session";
import { getImageToPdfSession, setImageToPdfSession } from "@/lib/pdf-session";

type UploadState =
  | { kind: "idle" }
  | { kind: "dragging" }
  | { kind: "loading" }
  | { kind: "error"; message: string };

function generateId(): string {
  return `img-${Math.random().toString(36).slice(2, 9)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageUploadStep() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ImageFileItem[]>(
    () => getImageToPdfSession()?.items ?? [],
  );
  const [uploadState, setUploadState] = useState<UploadState>({ kind: "idle" });

  const isDragging = uploadState.kind === "dragging";
  const isLoading = uploadState.kind === "loading";

  async function processFiles(files: File[]) {
    const supported = files.filter(isSupportedImageFile);

    if (supported.length === 0) {
      setUploadState({
        kind: "error",
        message: "Add JPG, PNG, or WebP image files.",
      });
      return;
    }

    setUploadState({ kind: "loading" });

    const nextItems: ImageFileItem[] = [];
    let unreadableCount = 0;

    for (const file of supported) {
      try {
        const dimensions = await readImageDimensions(file);
        nextItems.push({ id: generateId(), file, ...dimensions });
      } catch {
        unreadableCount += 1;
      }
    }

    setItems((previous) => [...previous, ...nextItems]);

    const unsupportedCount = files.length - supported.length;
    if (unsupportedCount > 0 || unreadableCount > 0) {
      const skippedCount = unsupportedCount + unreadableCount;
      setUploadState({
        kind: "error",
        message: `${skippedCount} file${skippedCount === 1 ? " was" : "s were"} skipped because the format was unsupported or the image could not be read.`,
      });
    } else {
      setUploadState({ kind: "idle" });
    }
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    await processFiles(Array.from(event.dataTransfer.files));
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setUploadState((previous) =>
      previous.kind === "dragging" ? previous : { kind: "dragging" },
    );
  }

  function handleDragLeave() {
    setUploadState((previous) =>
      previous.kind === "dragging" ? { kind: "idle" } : previous,
    );
  }

  async function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await processFiles(files);
  }

  function removeItem(id: string) {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }

  function handleContinue() {
    if (items.length === 0) return;

    setImageToPdfSession({
      items,
      outputName: getImageToPdfSession()?.outputName,
    });
    router.push("/image-to-pdf/configure");
  }

  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);

  return (
    <PageShell
      step={0}
      mode="image"
      fullHeight={items.length > 0}
      footer={
        items.length > 0 ? (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
            <div className="w-full max-w-2xl py-4 space-y-3">
              <button
                type="button"
                onClick={handleContinue}
                className="btn-primary w-full"
                id="btn-image-continue"
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
              <p
                className="text-xs text-center"
                style={{ color: "var(--color-text-muted)" }}
              >
                Your images never leave your device. All processing happens
                locally.
              </p>
            </div>
          </div>
        ) : undefined
      }
    >
      <div
        className={`w-full space-y-4 ${items.length > 0 ? "flex-1 flex flex-col overflow-hidden" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          className="sr-only"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        <div className="space-y-1.5 text-center shrink-0">
          <h1
            className="text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            Add images to convert
          </h1>
          <p
            className="text-sm leading-6 max-w-md mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Upload one or more JPG, PNG, or WebP images. Each image becomes one
            page in the PDF.
          </p>
        </div>

        {items.length === 0 && (
          <button
            type="button"
            aria-label="Upload images by clicking or dragging"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isLoading && inputRef.current?.click()}
            className="relative overflow-hidden rounded-2xl transition-all duration-200 w-full max-w-2xl mx-auto shrink-0 animate-fade-in"
            style={{
              background: isDragging
                ? "var(--color-bg-subtle)"
                : "var(--color-surface)",
              border: `2px dashed ${isDragging ? "var(--color-border-strong)" : "var(--color-border)"}`,
              cursor: isLoading ? "default" : "pointer",
            }}
          >
            <span className="flex min-h-72 flex-col items-center justify-center gap-4 p-12 text-center">
              {isLoading ? (
                <>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "var(--color-bg-subtle)" }}
                  >
                    <Loader2
                      size={22}
                      className="animate-spin-slow"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </span>
                  <span
                    className="block text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Reading images...
                  </span>
                </>
              ) : (
                <>
                  <span
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
                  </span>
                  <span className="block space-y-1">
                    <span
                      className="block text-base font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {isDragging
                        ? "Release to add images"
                        : "Drop images here"}
                    </span>
                    <span
                      className="block text-sm"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      or{" "}
                      <span
                        className="font-medium underline underline-offset-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        click to browse
                      </span>{" "}
                      and select multiple files
                    </span>
                  </span>
                </>
              )}
            </span>
          </button>
        )}

        {uploadState.kind === "error" && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 w-full max-w-2xl mx-auto animate-fade-in shrink-0"
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
              {uploadState.message}
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between shrink-0 animate-fade-in">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              {items.length} {items.length === 1 ? "image" : "images"} added
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {formatFileSize(totalBytes)} total
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-3 mb-28 pb-2 scrollbar-thin">
            <div className="w-full space-y-3 animate-fade-in text-left">
              {items.map((item) => (
                <div key={item.id} className="file-item-row animate-slide-in">
                  <div className="icon-box h-9 w-9">
                    <Images
                      size={16}
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {truncateFileName(item.file.name)}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {formatFileSize(item.file.size)} · {item.width} ×{" "}
                      {item.height}
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

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-150 disabled:opacity-50"
                style={{
                  background: "transparent",
                  border: "1.5px dashed var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {isLoading ? (
                  <Loader2 size={15} className="animate-spin-slow" />
                ) : (
                  <Plus size={15} />
                )}
                {isLoading ? "Reading images..." : "Add more images"}
              </button>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <p
            className="text-xs text-center animate-fade-in shrink-0 mt-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Your images never leave your device. All processing happens locally.
          </p>
        )}
      </div>
    </PageShell>
  );
}
