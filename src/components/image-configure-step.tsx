"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Images,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { truncateFileName } from "@/lib/pdf-extract";
import type { ImageFileItem } from "@/lib/pdf-session";
import {
  getImageToPdfSession,
  updateImageToPdfSessionItems,
} from "@/lib/pdf-session";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageConfigureStep() {
  const router = useRouter();
  const session = getImageToPdfSession();
  const [items, setItems] = useState<ImageFileItem[]>(
    () => session?.items ?? [],
  );
  const [outputName, setOutputName] = useState(session?.outputName ?? "");

  useEffect(() => {
    if (!session) router.replace("/image-to-pdf");
  }, [router, session]);

  if (!session) return null;

  function moveUp(index: number) {
    if (index === 0) return;
    setItems((previous) => {
      const next = [...previous];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    setItems((previous) => {
      if (index >= previous.length - 1) return previous;
      const next = [...previous];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleCreatePdf() {
    if (items.length === 0) return;

    updateImageToPdfSessionItems(items);
    const currentSession = getImageToPdfSession();
    if (currentSession)
      currentSession.outputName = outputName.trim() || undefined;
    router.push("/image-to-pdf/results");
  }

  return (
    <PageShell
      step={1}
      mode="image"
      fullHeight
      footer={
        <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
          <div className="w-full max-w-2xl py-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => router.push("/image-to-pdf")}
                className="btn-secondary"
                id="btn-image-back"
              >
                <ArrowLeft size={15} />
                Back
              </button>
              <button
                type="button"
                onClick={handleCreatePdf}
                className="btn-primary sm:ml-auto"
                id="btn-image-create-pdf"
              >
                Create PDF
                <ArrowRight size={15} />
              </button>
            </div>
            <p
              className="text-xs text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              Images become PDF pages in the order shown.
            </p>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col w-full space-y-4 overflow-hidden">
        <div className="space-y-1.5 text-center shrink-0">
          <h1
            className="text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            Organize your PDF pages
          </h1>
          <p
            className="text-sm leading-6 max-w-md mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Set the image order and choose a filename for the finished PDF.
          </p>
        </div>

        <div className="w-full max-w-2xl mx-auto shrink-0">
          <label
            htmlFor="image-output-name"
            className="block text-xs font-medium mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Output filename
          </label>
          <div className="relative flex items-center">
            <input
              id="image-output-name"
              type="text"
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              placeholder="e.g. scanned-pages"
              maxLength={120}
              className="input-field w-full pr-14"
            />
            <span
              className="pointer-events-none absolute right-3 text-xs select-none"
              style={{ color: "var(--color-text-muted)" }}
            >
              .pdf
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-3 mb-44 sm:mb-28 pb-2 scrollbar-thin space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl p-4 animate-slide-in"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    aria-label="Move image up"
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 disabled:opacity-30"
                    style={{ background: "var(--color-bg-subtle)" }}
                  >
                    <ArrowUp
                      size={13}
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === items.length - 1}
                    aria-label="Move image down"
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 disabled:opacity-30"
                    style={{ background: "var(--color-bg-subtle)" }}
                  >
                    <ArrowDown
                      size={13}
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </button>
                </div>

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

                <span
                  className="shrink-0 text-xs font-semibold"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {index + 1}/{items.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
