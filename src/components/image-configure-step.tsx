"use client";

import { ArrowDown, ArrowUp, Images } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { ImageLivePreview } from "@/components/pdf-live-preview";
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
    <PageShell step={1} mode="image" fullHeight wide>
      <PdfEditorWorkspace
        title="Image to PDF"
        description="Arrange the image pages while the finished PDF layout updates beside you."
        fileName={`${items.length} source ${items.length === 1 ? "image" : "images"}`}
        pageCount={items.length}
        preview={<ImageLivePreview items={items} />}
        primaryLabel="Create PDF"
        onPrimary={handleCreatePdf}
        onBack={() => router.push("/image-to-pdf")}
        primaryDisabled={items.length === 0}
        footerNote="Images become PDF pages in this order"
      >
        <div>
          <label
            htmlFor="image-output-name"
            className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]"
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

        <div>
          <div className="mb-3">
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">
              Page order
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-muted)]">
              Move images up or down. The preview pages move immediately without
              rebuilding the PDF.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 animate-slide-in"
              >
                <div className="flex items-center gap-3">
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      aria-label="Move image up"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)] transition-colors duration-150 disabled:opacity-30"
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
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)] transition-colors duration-150 disabled:opacity-30"
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

                  <span className="shrink-0 text-xs font-semibold text-[var(--color-text-muted)]">
                    {index + 1}/{items.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PdfEditorWorkspace>
    </PageShell>
  );
}
