"use client";

import { AlertCircle, FileText, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useState } from "react";
import {
  DragReorderOverlay,
  DropIndicator,
} from "@/components/drag-reorder-overlay";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import {
  getMergePreviewPageCount,
  MergeLivePreview,
} from "@/components/pdf-live-preview";
import { truncateFileName } from "@/lib/pdf-extract";
import type { MergeFileItem, MergeRangeMode } from "@/lib/pdf-session";
import { getMergeSession, updateMergeSessionItems } from "@/lib/pdf-session";
import { useDragReorder } from "@/lib/use-drag-reorder";

// ─── local editing state (extends session type with raw input strings) ───────

type EditableItem = MergeFileItem & {
  fromRaw: string;
  toRaw: string;
  validationError?: string;
};

function toEditable(item: MergeFileItem): EditableItem {
  return {
    ...item,
    fromRaw: item.customRange ? String(item.customRange.from) : "",
    toRaw: item.customRange ? String(item.customRange.to) : "",
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── component ──────────────────────────────────────────────────────────────

export default function MergeConfigureStep() {
  const router = useRouter();
  const session = getMergeSession();

  const [items, setItems] = useState<EditableItem[]>(() =>
    session ? session.items.map(toEditable) : [],
  );
  const [outputName, setOutputName] = useState<string>(
    session?.outputName ?? "",
  );
  const dragReorder = useDragReorder(setItems);
  const draggedItem = dragReorder.draggingId
    ? items.find((item) => item.id === dragReorder.draggingId)
    : undefined;
  const draggedIndex = draggedItem
    ? items.findIndex((item) => item.id === draggedItem.id)
    : -1;

  useEffect(() => {
    if (!session) {
      router.replace("/merge");
    }
  }, [session, router]);

  if (!session) return null;

  // ── range mode toggle ──────────────────────────────────────────────────────
  function setMode(id: string, mode: MergeRangeMode) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, rangeMode: mode, validationError: undefined }
          : item,
      ),
    );
  }

  // ── custom range inputs ────────────────────────────────────────────────────
  function updateRaw(id: string, field: "fromRaw" | "toRaw", value: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: value, validationError: undefined }
          : item,
      ),
    );
  }

  // ── validation & proceed ───────────────────────────────────────────────────
  function handleMerge() {
    let hasError = false;

    const validated = items.map((item): EditableItem => {
      if (item.rangeMode === "all") return item;

      const from = Number.parseInt(item.fromRaw, 10);
      const to = Number.parseInt(item.toRaw, 10);

      if (
        !Number.isInteger(from) ||
        !Number.isInteger(to) ||
        from < 1 ||
        to < 1
      ) {
        hasError = true;
        return { ...item, validationError: "Enter valid page numbers." };
      }
      if (from > to) {
        hasError = true;
        return { ...item, validationError: "Start page must be ≤ end page." };
      }
      if (to > item.totalPages) {
        hasError = true;
        return {
          ...item,
          validationError: `End page exceeds document length (${item.totalPages} pages).`,
        };
      }

      return { ...item, customRange: { from, to } };
    });

    setItems(validated);
    if (hasError) return;

    const sessionItems: MergeFileItem[] = validated.map((item) => ({
      id: item.id,
      file: item.file,
      totalPages: item.totalPages,
      rangeMode: item.rangeMode,
      customRange: item.customRange,
    }));

    updateMergeSessionItems(sessionItems);

    // Persist the user-defined output name (trim whitespace; store undefined if empty)
    const session = getMergeSession();
    if (session) {
      session.outputName = outputName.trim() || undefined;
    }

    router.push("/merge/results");
  }

  const previewItems = items.map((item) => {
    if (item.rangeMode === "all") {
      return {
        id: item.id,
        file: item.file,
        totalPages: item.totalPages,
        rangeMode: item.rangeMode,
      };
    }

    const from = Number.parseInt(item.fromRaw, 10);
    const to = Number.parseInt(item.toRaw, 10);
    const valid =
      Number.isInteger(from) &&
      Number.isInteger(to) &&
      from >= 1 &&
      to >= from &&
      to <= item.totalPages;

    return {
      id: item.id,
      file: item.file,
      totalPages: item.totalPages,
      rangeMode: item.rangeMode,
      customRange: valid ? { from, to } : undefined,
    };
  });
  const previewPageCount = getMergePreviewPageCount(previewItems);

  return (
    <PageShell step={1} mode="merge" fullHeight wide>
      <PdfEditorWorkspace
        title="Merge PDFs"
        description="Set file order and page ranges while the merged output updates beside you."
        fileName={`${items.length} PDF ${items.length === 1 ? "file" : "files"}`}
        pageCount={previewPageCount}
        preview={<MergeLivePreview items={previewItems} />}
        primaryLabel="Merge files"
        onPrimary={handleMerge}
        onBack={() => router.push("/merge")}
        footerNote="Files merge in the order shown"
      >
        <div>
          <label
            htmlFor="merge-output-name"
            className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]"
          >
            Output filename
          </label>
          <div className="relative flex items-center">
            <input
              id="merge-output-name"
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="e.g. project-brief"
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
              Source PDFs
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-muted)]">
              Drag files to reorder them or choose a custom range. Invalid
              custom ranges are temporarily omitted from the live preview.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <FileConfigCard
                key={item.id}
                item={item}
                index={index}
                total={items.length}
                dragReorder={dragReorder}
                onModeChange={(mode) => setMode(item.id, mode)}
                onRawChange={(field, value) => updateRaw(item.id, field, value)}
              />
            ))}
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
          <FileConfigCard
            item={draggedItem}
            index={draggedIndex}
            total={items.length}
            dragReorder={dragReorder}
            onModeChange={() => undefined}
            onRawChange={() => undefined}
            isOverlay
          />
        </DragReorderOverlay>
      )}
    </PageShell>
  );
}

// ─── FileConfigCard sub-component ────────────────────────────────────────────

type FileConfigCardProps = {
  item: EditableItem;
  index: number;
  total: number;
  dragReorder: ReturnType<typeof useDragReorder<EditableItem>>;
  onModeChange: (mode: MergeRangeMode) => void;
  onRawChange: (field: "fromRaw" | "toRaw", value: string) => void;
  isOverlay?: boolean;
};

function FileConfigCard({
  item,
  index,
  total,
  dragReorder,
  onModeChange,
  onRawChange,
  isOverlay = false,
}: FileConfigCardProps) {
  const dropIndicator = dragReorder.getDropIndicator(item.id);

  return (
    <div
      data-reorder-id={isOverlay ? undefined : item.id}
      className={`relative rounded-xl bg-[var(--color-surface)] p-4 space-y-3 transition-colors ${isOverlay ? "shadow-xl opacity-95" : "touch-none cursor-grab hover:bg-[var(--color-bg-subtle)] active:cursor-grabbing animate-slide-in"} ${!isOverlay && dragReorder.draggingId === item.id ? "opacity-50" : ""}`}
      style={{
        border: `1px solid ${item.validationError ? "var(--color-danger-border)" : "var(--color-border)"}`,
      }}
      onPointerDown={
        isOverlay
          ? undefined
          : (event) => dragReorder.handlePointerDown(event, item.id)
      }
      onPointerMove={isOverlay ? undefined : dragReorder.handlePointerMove}
      onPointerUp={isOverlay ? undefined : dragReorder.handlePointerEnd}
      onPointerCancel={isOverlay ? undefined : dragReorder.handlePointerEnd}
    >
      {!isOverlay && dropIndicator && (
        <DropIndicator position={dropIndicator} />
      )}
      {/* Header row */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-7 shrink-0 items-center justify-center text-[var(--color-text-muted)]">
          <GripVertical size={15} />
        </span>

        {/* File icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--color-bg-subtle)" }}
        >
          <FileText
            size={16}
            style={{ color: "var(--color-text-secondary)" }}
          />
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {truncateFileName(item.file.name)}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {formatFileSize(item.file.size)} · {item.totalPages}{" "}
            {item.totalPages === 1 ? "page" : "pages"}
          </p>
        </div>

        {/* Position badge */}
        <span
          className="shrink-0 text-xs font-semibold"
          style={{ color: "var(--color-text-muted)" }}
        >
          {index + 1}/{total}
        </span>
      </div>

      {/* Range mode selector */}
      <div
        data-no-drag="true"
        className="flex rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--color-border)" }}
      >
        {(["all", "custom"] as MergeRangeMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            data-no-drag="true"
            onClick={() => onModeChange(mode)}
            className="flex-1 py-2 text-xs font-medium transition-colors duration-150"
            style={{
              background:
                item.rangeMode === mode
                  ? "var(--color-bg-subtle)"
                  : "var(--color-surface)",
              color:
                item.rangeMode === mode
                  ? "var(--color-text-primary)"
                  : "var(--color-text-muted)",
              borderRight:
                mode === "all" ? "1px solid var(--color-border)" : undefined,
            }}
          >
            {mode === "all" ? "All pages" : "Custom range"}
          </button>
        ))}
      </div>

      {/* Custom range inputs */}
      {item.rangeMode === "custom" && (
        <div
          data-no-drag="true"
          className="grid grid-cols-2 gap-3 animate-fade-in"
        >
          <div>
            <label
              htmlFor={`${isOverlay ? "merge-overlay-from" : "merge-from"}-${item.id}`}
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Start page
            </label>
            <input
              id={`${isOverlay ? "merge-overlay-from" : "merge-from"}-${item.id}`}
              type="number"
              data-no-drag="true"
              min={1}
              max={item.totalPages}
              placeholder="e.g. 1"
              value={item.fromRaw}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onRawChange("fromRaw", e.target.value)
              }
              className="input-field"
              style={
                item.validationError
                  ? {
                      borderColor: "var(--color-danger-border)",
                      boxShadow: "0 0 0 3px rgba(185,28,28,0.06)",
                    }
                  : {}
              }
            />
          </div>
          <div>
            <label
              htmlFor={`${isOverlay ? "merge-overlay-to" : "merge-to"}-${item.id}`}
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              End page
            </label>
            <input
              id={`${isOverlay ? "merge-overlay-to" : "merge-to"}-${item.id}`}
              type="number"
              data-no-drag="true"
              min={1}
              max={item.totalPages}
              placeholder={`e.g. ${item.totalPages}`}
              value={item.toRaw}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onRawChange("toRaw", e.target.value)
              }
              className="input-field"
              style={
                item.validationError
                  ? {
                      borderColor: "var(--color-danger-border)",
                      boxShadow: "0 0 0 3px rgba(185,28,28,0.06)",
                    }
                  : {}
              }
            />
          </div>
        </div>
      )}

      {/* Validation error */}
      {item.validationError && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 animate-fade-in"
          style={{
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-danger-border)",
          }}
        >
          <AlertCircle
            size={13}
            className="mt-0.5 shrink-0"
            style={{ color: "var(--color-danger-text)" }}
          />
          <p className="text-xs" style={{ color: "var(--color-danger-text)" }}>
            {item.validationError}
          </p>
        </div>
      )}
    </div>
  );
}
