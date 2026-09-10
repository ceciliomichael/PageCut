"use client";

import { GripVertical, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  DragReorderOverlay,
  DropIndicator,
} from "@/components/drag-reorder-overlay";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { ImageLivePreview } from "@/components/pdf-live-preview";
import { isSupportedImageFile, readImageDimensions } from "@/lib/image-to-pdf";
import { truncateFileName } from "@/lib/pdf-extract";
import type { ImageFileItem } from "@/lib/pdf-session";
import {
  getImageToPdfSession,
  updateImageToPdfSessionItems,
} from "@/lib/pdf-session";
import { useDragReorder } from "@/lib/use-drag-reorder";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateId(): string {
  return `img-${Math.random().toString(36).slice(2, 9)}`;
}

function ImageThumbnail({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-subtle)]">
      {url && (
        // biome-ignore lint/performance/noImgElement: local blob thumbnail should not use Next image optimization
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

export default function ImageConfigureStep() {
  const router = useRouter();
  const session = getImageToPdfSession();
  const [items, setItems] = useState<ImageFileItem[]>(
    () => session?.items ?? [],
  );
  const [outputName, setOutputName] = useState(session?.outputName ?? "");
  const [activeItemId, setActiveItemId] = useState<string | undefined>();
  const [previewScrollRequest, setPreviewScrollRequest] = useState(0);
  const [isAddingImages, setIsAddingImages] = useState(false);
  const [addImagesError, setAddImagesError] = useState<string | null>(null);
  const addImagesInputRef = useRef<HTMLInputElement>(null);
  const listItemRefs = useRef(new Map<string, HTMLDivElement>());
  const dragReorder = useDragReorder(setItems);
  const draggedItem = dragReorder.draggingId
    ? items.find((item) => item.id === dragReorder.draggingId)
    : undefined;

  useEffect(() => {
    if (!session) router.replace("/image-to-pdf");
  }, [router, session]);

  if (!session) return null;

  function handleCreatePdf() {
    if (items.length === 0) return;

    updateImageToPdfSessionItems(items);
    const currentSession = getImageToPdfSession();
    if (currentSession)
      currentSession.outputName = outputName.trim() || undefined;
    router.push("/image-to-pdf/results");
  }

  function selectFromList(itemId: string) {
    setActiveItemId(itemId);
    setPreviewScrollRequest((request) => request + 1);
  }

  function selectFromPreview(itemId: string) {
    listItemRefs.current.get(itemId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  async function handleAddImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const supported = files.filter(isSupportedImageFile);
    if (supported.length === 0) {
      setAddImagesError("Add JPG, PNG, or WebP image files.");
      return;
    }

    setIsAddingImages(true);
    setAddImagesError(null);

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

    const skippedCount = files.length - supported.length + unreadableCount;
    if (skippedCount > 0) {
      setAddImagesError(
        `${skippedCount} file${skippedCount === 1 ? " was" : "s were"} skipped because the format was unsupported or the image could not be read.`,
      );
    }
    setIsAddingImages(false);
  }

  return (
    <PageShell step={1} mode="image" fullHeight wide>
      <PdfEditorWorkspace
        title="Image to PDF"
        description="Arrange the image pages while the finished PDF layout updates beside you."
        fileName={`${items.length} source ${items.length === 1 ? "image" : "images"}`}
        pageCount={items.length}
        preview={
          <ImageLivePreview
            items={items}
            scrollToItemId={activeItemId}
            scrollRequestKey={previewScrollRequest}
            onItemSelect={selectFromPreview}
          />
        }
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
          <input
            ref={addImagesInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            className="sr-only"
            onChange={handleAddImages}
            disabled={isAddingImages}
          />
          <div className="mb-3">
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">
              Page order
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-muted)]">
              Drag images to reorder them. The preview updates immediately.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const dropIndicator = dragReorder.getDropIndicator(item.id);
              return (
                <div
                  key={item.id}
                  ref={(element) => {
                    if (element) listItemRefs.current.set(item.id, element);
                    else listItemRefs.current.delete(item.id);
                  }}
                  data-reorder-id={item.id}
                  className={`relative touch-none cursor-grab rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)] active:cursor-grabbing animate-slide-in ${dragReorder.draggingId === item.id ? "opacity-50" : ""}`}
                  onPointerDown={(event) =>
                    dragReorder.handlePointerDown(event, item.id)
                  }
                  onPointerMove={dragReorder.handlePointerMove}
                  onPointerUp={dragReorder.handlePointerEnd}
                  onPointerCancel={dragReorder.handlePointerEnd}
                >
                  {dropIndicator && <DropIndicator position={dropIndicator} />}
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-7 shrink-0 items-center justify-center text-[var(--color-text-muted)]">
                      <GripVertical size={15} />
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (dragReorder.consumeClickSuppression()) return;
                        selectFromList(item.id);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 bg-transparent p-0 text-left outline-none"
                    >
                      <ImageThumbnail file={item.file} />

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
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => addImagesInputRef.current?.click()}
              disabled={isAddingImages}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-150 disabled:opacity-50"
              style={{
                background: "transparent",
                border: "1.5px dashed var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              {isAddingImages ? (
                <Loader2 size={15} className="animate-spin-slow" />
              ) : (
                <Plus size={15} />
              )}
              {isAddingImages ? "Reading images..." : "Add more images"}
            </button>

            {addImagesError && (
              <p className="text-xs text-[var(--color-danger-text)]">
                {addImagesError}
              </p>
            )}
          </div>
        </div>
      </PdfEditorWorkspace>
      {draggedItem && dragReorder.dragPoint && dragReorder.dragFrame && (
        <DragReorderOverlay
          x={dragReorder.dragPoint.x}
          y={dragReorder.dragPoint.y}
          offsetX={dragReorder.dragFrame.offsetX}
          offsetY={dragReorder.dragFrame.offsetY}
          width={dragReorder.dragFrame.width}
        >
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl opacity-95">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-7 shrink-0 items-center justify-center text-[var(--color-text-muted)]">
                <GripVertical size={15} />
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ImageThumbnail file={draggedItem.file} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {truncateFileName(draggedItem.file.name)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatFileSize(draggedItem.file.size)} ·{" "}
                    {draggedItem.width} × {draggedItem.height}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DragReorderOverlay>
      )}
    </PageShell>
  );
}
