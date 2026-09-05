"use client";

import { Check, Loader2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PageRange } from "@/lib/pdf-extract";
import type {
  PageNumberOptions,
  PdfUtilitySession,
  QuarterTurn,
  WatermarkOptions,
} from "@/lib/pdf-utility-session";

type PdfViewport = {
  width: number;
  height: number;
};

type PdfRenderTask = {
  promise: Promise<void>;
  cancel: () => void;
};

type PdfPageProxy = {
  rotate: number;
  getViewport: (options: { scale: number; rotation?: number }) => PdfViewport;
  render: (options: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => PdfRenderTask;
};

type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocumentProxy>;
};

type PreviewPageSpec = {
  id: string;
  file: File;
  sourceIndex: number;
  rotation: QuarterTurn;
  outputIndex: number;
  marker?: string;
  marked?: boolean;
};

type PageInfo = {
  page: PdfPageProxy;
  width: number;
  height: number;
  displayScale: number;
};

type MergePreviewItem = {
  id: string;
  file: File;
  totalPages: number;
  rangeMode: "all" | "custom";
  customRange?: { from: number; to: number };
};

type ImagePreviewItem = {
  id: string;
  file: File;
  width: number;
  height: number;
};

const MAX_PAGE_WIDTH = 820;
const MAX_CSS_SCALE = 1.3;
const documentCache = new WeakMap<File, Promise<PdfDocumentProxy>>();

function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

function loadPdfDocument(file: File): Promise<PdfDocumentProxy> {
  const cached = documentCache.get(file);
  if (cached) return cached;

  const promise = (async () => {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const bytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      useSystemFonts: true,
    }) as unknown as PdfLoadingTask;
    return loadingTask.promise;
  })();

  documentCache.set(file, promise);
  void promise.catch(() => documentCache.delete(file));
  return promise;
}

function pageNumberLabel(
  pageIndex: number,
  options: PageNumberOptions,
): string | null {
  if (
    !Number.isFinite(options.fromPage) ||
    !Number.isFinite(options.toPage) ||
    options.fromPage > options.toPage ||
    pageIndex < options.fromPage - 1 ||
    pageIndex > options.toPage - 1
  ) {
    return null;
  }

  const count = options.toPage - options.fromPage + 1;
  const number = options.startNumber + (pageIndex - (options.fromPage - 1));
  const finalNumber = options.startNumber + count - 1;

  if (options.format === "page-number") return `Page ${number}`;
  if (options.format === "number-total") return `${number} / ${finalNumber}`;
  return String(number);
}

function PageNumberOverlay({
  pageIndex,
  options,
  scale,
}: {
  pageIndex: number;
  options: PageNumberOptions;
  scale: number;
}) {
  const label = pageNumberLabel(pageIndex, options);
  if (!label) return null;

  const fontSize = Number.isFinite(options.fontSize) ? options.fontSize : 12;
  const margin = 28 * scale;
  const style: CSSProperties = {
    position: "absolute",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: `${Math.max(6, fontSize) * scale}px`,
    lineHeight: 1,
    color: "rgb(46 46 46)",
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };

  if (options.position.startsWith("top")) style.top = `${margin}px`;
  else style.bottom = `${margin}px`;

  if (options.position.endsWith("left")) style.left = `${margin}px`;
  else if (options.position.endsWith("right")) style.right = `${margin}px`;
  else {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  }

  return <span style={style}>{label}</span>;
}

function WatermarkOverlay({
  options,
  scale,
}: {
  options: WatermarkOptions;
  scale: number;
}) {
  if (!options.text.trim()) return null;

  const fontSize = Number.isFinite(options.fontSize) ? options.fontSize : 42;
  const opacity = Number.isFinite(options.opacity) ? options.opacity : 0.2;
  const rotation = Number.isFinite(options.rotation) ? options.rotation : 0;
  const edge = 36 * scale;
  const style: CSSProperties = {
    position: "absolute",
    left: "50%",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontWeight: 700,
    fontSize: `${Math.max(10, fontSize) * scale}px`,
    lineHeight: 1,
    color: "rgb(89 89 89)",
    opacity: Math.min(1, Math.max(0.05, opacity)),
    whiteSpace: "nowrap",
    pointerEvents: "none",
    transformOrigin: "center",
  };

  if (options.position === "top") {
    style.top = `${edge}px`;
    style.transform = `translateX(-50%) rotate(${-rotation}deg)`;
  } else if (options.position === "bottom") {
    style.bottom = `${edge}px`;
    style.transform = `translateX(-50%) rotate(${-rotation}deg)`;
  } else {
    style.top = "50%";
    style.transform = `translate(-50%, -50%) rotate(${-rotation}deg)`;
  }

  return <span style={style}>{options.text}</span>;
}

function PdfCanvasPage({
  document,
  spec,
  renderOverlay,
}: {
  document: PdfDocumentProxy;
  spec: PreviewPageSpec;
  renderOverlay?: (spec: PreviewPageSpec, scale: number) => ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [actualScale, setActualScale] = useState(1);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    document.getPage(spec.sourceIndex + 1).then((page) => {
      if (cancelled) return;
      const rotation = normalizeRotation(page.rotate + spec.rotation);
      const base = page.getViewport({ scale: 1, rotation });
      const displayScale = Math.min(MAX_CSS_SCALE, MAX_PAGE_WIDTH / base.width);
      setPageInfo({
        page,
        width: base.width * displayScale,
        height: base.height * displayScale,
        displayScale,
      });
      setRendered(false);
    });

    return () => {
      cancelled = true;
    };
  }, [document, spec.rotation, spec.sourceIndex]);

  useEffect(() => {
    const element = wrapperRef.current;
    const info = pageInfo;
    if (!element || !info) return;

    const updateScale = () => {
      const width = element.getBoundingClientRect().width;
      setActualScale((width / info.width) * info.displayScale);
    };
    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, [pageInfo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const info = pageInfo;
    if (!visible || !canvas || !info) return;

    renderTaskRef.current?.cancel();
    const outputScale = Math.min(window.devicePixelRatio || 1, 1.5);
    const rotation = normalizeRotation(info.page.rotate + spec.rotation);
    const viewport = info.page.getViewport({
      scale: info.displayScale * outputScale,
      rotation,
    });
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const task = info.page.render({ canvas, canvasContext: context, viewport });
    renderTaskRef.current = task;
    let cancelled = false;

    task.promise
      .then(() => {
        if (!cancelled) setRendered(true);
      })
      .catch((error: unknown) => {
        if (
          !cancelled &&
          !(
            error instanceof Error &&
            error.name === "RenderingCancelledException"
          )
        ) {
          setRendered(false);
        }
      });

    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [pageInfo, spec.rotation, visible]);

  const width = pageInfo?.width ?? 612;
  const height = pageInfo?.height ?? 792;

  return (
    <div className="flex justify-center px-4 sm:px-5 md:px-6">
      <div
        ref={wrapperRef}
        className={`relative overflow-hidden bg-white shadow-[0_4px_18px_rgba(0,0,0,0.10)] sm:shadow-[0_8px_28px_rgba(0,0,0,0.10)] ${
          spec.marked
            ? "ring-2 ring-[var(--color-accent)]"
            : "ring-1 ring-black/8"
        }`}
        style={{
          width: "100%",
          maxWidth: `${width}px`,
          aspectRatio: `${width} / ${height}`,
        }}
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-150 ${
            rendered ? "opacity-100" : "opacity-0"
          }`}
        />
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <Loader2 size={18} className="animate-spin-slow text-neutral-400" />
          </div>
        )}
        {renderOverlay?.(spec, actualScale)}
        {spec.marker && (
          <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold text-white/95">
            {spec.marker}
          </span>
        )}
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
          {spec.outputIndex + 1}
        </span>
      </div>
    </div>
  );
}

function PdfPreviewSurface({
  pages,
  pageCount,
  title = "Live document",
  emptyMessage = "Nothing to preview yet.",
  renderOverlay,
}: {
  pages: PreviewPageSpec[];
  pageCount: number;
  title?: string;
  emptyMessage?: string;
  renderOverlay?: (spec: PreviewPageSpec, scale: number) => ReactNode;
}) {
  const [documents, setDocuments] = useState(
    () => new Map<File, PdfDocumentProxy>(),
  );
  const [error, setError] = useState<string | null>(null);

  const files = useMemo(() => {
    const unique: File[] = [];
    const seen = new Set<File>();
    for (const page of pages) {
      if (!seen.has(page.file)) {
        seen.add(page.file);
        unique.push(page.file);
      }
    }
    return unique;
  }, [pages]);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    Promise.all(
      files.map(async (file) => [file, await loadPdfDocument(file)] as const),
    )
      .then((entries) => {
        if (cancelled) return;
        setDocuments((previous) => {
          const next = new Map<File, PdfDocumentProxy>(entries);
          const unchanged =
            previous.size === next.size &&
            entries.every(
              ([file, document]) => previous.get(file) === document,
            );
          return unchanged ? previous : next;
        });
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not render this PDF preview.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [files]);

  const ready = files.every((file) => documents.has(file));

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg-subtle)]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:h-12 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
          <span className="truncate text-[13px] font-semibold text-[var(--color-text-primary)] sm:text-sm">
            {title}
          </span>
          <span className="shrink-0 text-[11px] text-[var(--color-text-muted)] sm:text-xs">
            {pageCount} {pageCount === 1 ? "page" : "pages"}
          </span>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] sm:text-xs">
          {ready && !error ? (
            <>
              <Check size={13} />
              <span className="hidden sm:inline">Live</span>
            </>
          ) : error ? (
            <span className="hidden sm:inline">Preview issue</span>
          ) : (
            <>
              <Loader2 size={13} className="animate-spin-slow" />
              <span className="hidden sm:inline">Loading PDF</span>
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 sm:py-5 md:py-7 scrollbar-thin">
        {error ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="max-w-sm text-sm text-[var(--color-danger-text)]">
              {error}
            </p>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
              {emptyMessage}
            </p>
          </div>
        ) : ready ? (
          <div className="space-y-4 sm:space-y-5 md:space-y-7">
            {pages.map((spec) => {
              const document = documents.get(spec.file);
              return document ? (
                <PdfCanvasPage
                  key={spec.id}
                  document={document}
                  spec={spec}
                  renderOverlay={renderOverlay}
                />
              ) : null;
            })}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2
              size={22}
              className="animate-spin-slow text-[var(--color-text-secondary)]"
            />
            <p className="text-sm text-[var(--color-text-muted)]">
              Rendering document
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export function PdfLivePreview({
  session,
  pageCount,
}: {
  session: PdfUtilitySession;
  pageCount: number;
}) {
  const pages = useMemo<PreviewPageSpec[]>(() => {
    if (session.kind === "organize") {
      return session.pages.map((page, outputIndex) => ({
        id: page.id,
        file: session.file,
        sourceIndex: page.sourceIndex,
        rotation: page.rotation,
        outputIndex,
      }));
    }

    return Array.from({ length: pageCount }, (_, outputIndex) => ({
      id: `page-${outputIndex}`,
      file: session.file,
      sourceIndex: outputIndex,
      rotation: 0,
      outputIndex,
    }));
  }, [pageCount, session]);

  const renderOverlay = (spec: PreviewPageSpec, scale: number) =>
    session.kind === "page-numbers" ? (
      <PageNumberOverlay
        pageIndex={spec.sourceIndex}
        options={session.options}
        scale={scale}
      />
    ) : session.kind === "watermark" ? (
      <WatermarkOverlay options={session.options} scale={scale} />
    ) : null;

  return (
    <PdfPreviewSurface
      pages={pages}
      pageCount={pageCount}
      renderOverlay={renderOverlay}
    />
  );
}

export function SplitLivePreview({
  file,
  totalPages,
  ranges,
}: {
  file: File;
  totalPages: number;
  ranges: readonly PageRange[];
}) {
  const pages = useMemo<PreviewPageSpec[]>(() => {
    return Array.from({ length: totalPages }, (_, sourceIndex) => {
      const pageNumber = sourceIndex + 1;
      const markers: string[] = [];

      ranges.forEach((range, rangeIndex) => {
        if (
          range.from >= 1 &&
          range.to >= range.from &&
          range.to <= totalPages &&
          pageNumber >= range.from &&
          pageNumber <= range.to
        ) {
          markers.push(`R${rangeIndex + 1}`);
        }
      });

      return {
        id: `split-page-${sourceIndex}`,
        file,
        sourceIndex,
        rotation: 0,
        outputIndex: sourceIndex,
        marker: markers.length > 0 ? markers.join(" · ") : undefined,
        marked: markers.length > 0,
      };
    });
  }, [file, ranges, totalPages]);

  return (
    <PdfPreviewSurface
      pages={pages}
      pageCount={totalPages}
      title="Source preview"
      emptyMessage="Add a valid range to mark pages in the source PDF."
    />
  );
}

function getValidMergeRange(
  item: MergePreviewItem,
): { from: number; to: number } | null {
  if (item.rangeMode === "all") {
    return item.totalPages > 0 ? { from: 1, to: item.totalPages } : null;
  }

  const range = item.customRange;
  if (
    !range ||
    range.from < 1 ||
    range.to < range.from ||
    range.to > item.totalPages
  ) {
    return null;
  }

  return range;
}

export function getMergePreviewPageCount(
  items: readonly MergePreviewItem[],
): number {
  return items.reduce((total, item) => {
    const range = getValidMergeRange(item);
    return range ? total + range.to - range.from + 1 : total;
  }, 0);
}

export function MergeLivePreview({
  items,
}: {
  items: readonly MergePreviewItem[];
}) {
  const pages = useMemo<PreviewPageSpec[]>(() => {
    const result: PreviewPageSpec[] = [];

    items.forEach((item, itemIndex) => {
      const range = getValidMergeRange(item);
      if (!range) return;

      for (
        let pageNumber = range.from;
        pageNumber <= range.to;
        pageNumber += 1
      ) {
        result.push({
          id: `${item.id}-page-${pageNumber}`,
          file: item.file,
          sourceIndex: pageNumber - 1,
          rotation: 0,
          outputIndex: result.length,
          marker: `PDF ${itemIndex + 1}`,
        });
      }
    });

    return result;
  }, [items]);

  return (
    <PdfPreviewSurface
      pages={pages}
      pageCount={pages.length}
      title="Merged preview"
      emptyMessage="Choose valid custom page ranges to preview the merged output."
    />
  );
}

function ImagePreviewPage({
  item,
  outputIndex,
}: {
  item: ImagePreviewItem;
  outputIndex: number;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(item.file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [item.file]);

  const displayScale = Math.min(MAX_CSS_SCALE, MAX_PAGE_WIDTH / item.width);
  const width = item.width * displayScale;
  const height = item.height * displayScale;

  return (
    <div className="flex justify-center px-4 sm:px-5 md:px-6">
      <div
        className="relative overflow-hidden bg-white shadow-[0_4px_18px_rgba(0,0,0,0.10)] ring-1 ring-black/8 sm:shadow-[0_8px_28px_rgba(0,0,0,0.10)]"
        style={{
          width: "100%",
          maxWidth: `${width}px`,
          aspectRatio: `${width} / ${height}`,
        }}
      >
        {url ? (
          // A plain img mirrors the final PDF behavior and the blob URL is already local.
          // biome-ignore lint/performance/noImgElement: local blob previews should not use Next image optimization
          <img
            src={url}
            alt=""
            className="absolute inset-0 h-full w-full object-fill"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <Loader2 size={18} className="animate-spin-slow text-neutral-400" />
          </div>
        )}
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
          {outputIndex + 1}
        </span>
      </div>
    </div>
  );
}

export function ImageLivePreview({
  items,
}: {
  items: readonly ImagePreviewItem[];
}) {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg-subtle)]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:h-12 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
          <span className="truncate text-[13px] font-semibold text-[var(--color-text-primary)] sm:text-sm">
            PDF preview
          </span>
          <span className="shrink-0 text-[11px] text-[var(--color-text-muted)] sm:text-xs">
            {items.length} {items.length === 1 ? "page" : "pages"}
          </span>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] sm:text-xs">
          <Check size={13} />
          <span className="hidden sm:inline">Live</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 sm:py-5 md:py-7 scrollbar-thin">
        <div className="space-y-4 sm:space-y-5 md:space-y-7">
          {items.map((item, outputIndex) => (
            <ImagePreviewPage
              key={item.id}
              item={item}
              outputIndex={outputIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
