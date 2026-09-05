import type { ExtractImagesSession } from "./extract-images-session";

type PdfObjects = {
  get: (id: string, callback?: (value: unknown) => void) => unknown;
  has: (id: string) => boolean;
};

type PdfOperatorList = {
  fnArray: number[];
  argsArray: unknown[][];
};

type PdfViewport = {
  width: number;
  height: number;
};

type PdfRenderTask = {
  promise: Promise<void>;
};

type PdfPageProxy = {
  objs: PdfObjects;
  commonObjs: PdfObjects;
  getOperatorList: () => Promise<PdfOperatorList>;
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => PdfRenderTask;
};

type PdfDocumentProxy = {
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocumentProxy>;
  destroy?: () => Promise<void>;
};

type RasterObject = {
  width?: number;
  height?: number;
  data?: Uint8Array | Uint8ClampedArray;
  kind?: number;
  bitmap?: ImageBitmap;
};

export type ExtractedImageItem = {
  id: string;
  pageNumber: number;
  imageNumber: number;
  fileName: string;
  width: number;
  height: number;
  blob: Blob;
};

function safeBaseName(sourceName: string, customName?: string): string {
  const source = (customName?.trim() || sourceName).replace(/\.pdf$/i, "");
  return (
    source.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") ||
    "pagecut-images"
  );
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      try {
        const dataUrl = canvas.toDataURL("image/png");
        void fetch(dataUrl)
          .then((response) => response.blob())
          .then(resolve, reject);
      } catch (error) {
        reject(error);
      }
    }, "image/png");
  });
}

function isRasterCandidate(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const raster = value as RasterObject;
  const hasDimensions =
    Number.isFinite(raster.width) &&
    Number.isFinite(raster.height) &&
    (raster.width ?? 0) > 0 &&
    (raster.height ?? 0) > 0;

  return Boolean(
    raster.bitmap ||
      (hasDimensions &&
        raster.data &&
        typeof raster.data.length === "number") ||
      (typeof ImageData !== "undefined" && value instanceof ImageData) ||
      isDrawableImage(value),
  );
}

function getPdfRasterObject(store: PdfObjects, id: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const accept = (value: unknown) => {
      if (isRasterCandidate(value)) {
        resolve(value);
        return;
      }
      reject(new Error("PDF.js object is not a raster image."));
    };

    try {
      if (store.has(id)) {
        try {
          const value = store.get(id);
          if (isRasterCandidate(value)) {
            resolve(value);
            return;
          }
        } catch {
          // The object can be registered before PDF.js has finished decoding it.
        }
      }
      store.get(id, accept);
    } catch (error) {
      reject(error);
    }
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Timed out while decoding a PDF image object."));
    }, timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function resolveImageObject(
  page: PdfPageProxy,
  id: string,
): Promise<unknown> {
  return withTimeout(
    Promise.any([
      getPdfRasterObject(page.objs, id),
      getPdfRasterObject(page.commonObjs, id),
    ]),
    5_000,
  );
}

function getReadyImageObject(page: PdfPageProxy, id: string): unknown | null {
  for (const store of [page.objs, page.commonObjs]) {
    if (!store.has(id)) continue;
    try {
      const value = store.get(id);
      if (isRasterCandidate(value)) return value;
    } catch {
      // Registered objects can still be waiting for the PDF.js worker to decode them.
    }
  }
  return null;
}

async function decodeLazyPageImages(page: PdfPageProxy): Promise<void> {
  const baseViewport = page.getViewport({ scale: 1 });
  const maxDimension = Math.max(baseViewport.width, baseViewport.height, 1);
  const scale = Math.min(0.1, 512 / maxDimension);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  if (!context) return;

  try {
    await page.render({ canvas, canvasContext: context, viewport }).promise;
  } finally {
    canvas.width = 1;
    canvas.height = 1;
  }
}

function isDrawableImage(value: unknown): value is CanvasImageSource & {
  width?: number;
  height?: number;
  displayWidth?: number;
  displayHeight?: number;
  codedWidth?: number;
  codedHeight?: number;
} {
  if (!value || typeof value !== "object") return false;
  if (typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap)
    return true;
  if (typeof VideoFrame !== "undefined" && value instanceof VideoFrame)
    return true;
  if (
    typeof HTMLCanvasElement !== "undefined" &&
    value instanceof HTMLCanvasElement
  )
    return true;
  if (
    typeof HTMLImageElement !== "undefined" &&
    value instanceof HTMLImageElement
  )
    return true;
  return false;
}

async function rasterObjectToPng(
  source: unknown,
  imageKind: { GRAYSCALE_1BPP: number; RGB_24BPP: number; RGBA_32BPP: number },
): Promise<{ blob: Blob; width: number; height: number } | null> {
  const raster = source as RasterObject;
  const drawable = raster?.bitmap ?? source;
  if (isDrawableImage(drawable)) {
    const width =
      raster?.width ??
      drawable.width ??
      drawable.displayWidth ??
      drawable.codedWidth ??
      0;
    const height =
      raster?.height ??
      drawable.height ??
      drawable.displayHeight ??
      drawable.codedHeight ??
      0;
    if (width < 1 || height < 1) return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(drawable, 0, 0);
    return { blob: await canvasToPngBlob(canvas), width, height };
  }

  if (typeof ImageData !== "undefined" && source instanceof ImageData) {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.putImageData(source, 0, 0);
    return {
      blob: await canvasToPngBlob(canvas),
      width: source.width,
      height: source.height,
    };
  }

  const width = raster?.width;
  const height = raster?.height;
  const data = raster?.data;
  if (!width || !height || !data || width < 1 || height < 1) return null;

  const rgba = new Uint8ClampedArray(width * height * 4);
  if (
    raster.kind === imageKind.RGBA_32BPP ||
    data.length >= width * height * 4
  ) {
    rgba.set(data.subarray(0, rgba.length));
  } else if (
    raster.kind === imageKind.RGB_24BPP ||
    data.length >= width * height * 3
  ) {
    for (let src = 0, dst = 0; dst < rgba.length; src += 3, dst += 4) {
      rgba[dst] = data[src] ?? 0;
      rgba[dst + 1] = data[src + 1] ?? 0;
      rgba[dst + 2] = data[src + 2] ?? 0;
      rgba[dst + 3] = 255;
    }
  } else if (raster.kind === imageKind.GRAYSCALE_1BPP) {
    const rowBytes = Math.ceil(width / 8);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const byte = data[y * rowBytes + Math.floor(x / 8)] ?? 0;
        const bit = (byte >> (7 - (x % 8))) & 1;
        const color = bit ? 255 : 0;
        const dst = (y * width + x) * 4;
        rgba[dst] = color;
        rgba[dst + 1] = color;
        rgba[dst + 2] = color;
        rgba[dst + 3] = 255;
      }
    }
  } else {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const imageData = context.createImageData(width, height);
  imageData.data.set(rgba);
  context.putImageData(imageData, 0, 0);
  return { blob: await canvasToPngBlob(canvas), width, height };
}

export async function extractImagesFromPdf(
  session: ExtractImagesSession,
  onProgress?: (completedPages: number, totalPages: number) => void,
): Promise<ExtractedImageItem[]> {
  const { options } = session;
  if (
    !Number.isInteger(options.fromPage) ||
    !Number.isInteger(options.toPage) ||
    options.fromPage < 1 ||
    options.toPage > session.totalPages ||
    options.fromPage > options.toPage
  ) {
    throw new Error("Choose a valid page range.");
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await session.file.arrayBuffer()),
    useSystemFonts: true,
  }) as unknown as PdfLoadingTask;
  const pdfDocument = await loadingTask.promise;
  const results: ExtractedImageItem[] = [];
  const totalPages = options.toPage - options.fromPage + 1;
  const base = safeBaseName(session.file.name, session.outputName);

  try {
    for (
      let pageNumber = options.fromPage;
      pageNumber <= options.toPage;
      pageNumber += 1
    ) {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const operators = await page.getOperatorList();
        const seenIds = new Set<string>();
        const imageIds: string[] = [];
        const inlineSources: unknown[] = [];

        for (let index = 0; index < operators.fnArray.length; index += 1) {
          const operation = operators.fnArray[index];
          const args = operators.argsArray[index] ?? [];
          if (
            operation === pdfjs.OPS.paintImageXObject ||
            operation === pdfjs.OPS.paintImageXObjectRepeat
          ) {
            const id = args[0];
            if (typeof id === "string" && !seenIds.has(id)) {
              seenIds.add(id);
              imageIds.push(id);
            }
          } else if (operation === pdfjs.OPS.paintInlineImageXObject) {
            if (args[0]) inlineSources.push(args[0]);
          }
        }

        if (imageIds.some((id) => !getReadyImageObject(page, id))) {
          try {
            await decodeLazyPageImages(page);
          } catch {
            // Continue with any image objects that were already available.
          }
        }

        const sources = [...inlineSources];
        for (const id of imageIds) {
          const ready = getReadyImageObject(page, id);
          if (ready) {
            sources.push(ready);
            continue;
          }
          try {
            sources.push(await resolveImageObject(page, id));
          } catch {
            // Some malformed or unsupported PDF image resources never resolve.
          }
        }

        let imageNumber = 0;
        for (const source of sources) {
          try {
            const image = await rasterObjectToPng(source, pdfjs.ImageKind);
            if (
              !image ||
              image.width < options.minWidth ||
              image.height < options.minHeight
            ) {
              continue;
            }
            imageNumber += 1;
            results.push({
              id: `p${pageNumber}-i${imageNumber}`,
              pageNumber,
              imageNumber,
              fileName: `${base}-page-${pageNumber}-image-${imageNumber}.png`,
              width: image.width,
              height: image.height,
              blob: image.blob,
            });
          } catch {
            // Skip one malformed/unsupported raster without failing the page.
          }
        }
      } catch {
        // One malformed page should not prevent supported images on other pages from being returned.
      } finally {
        onProgress?.(pageNumber - options.fromPage + 1, totalPages);
      }
    }
  } finally {
    await loadingTask.destroy?.();
  }

  return results;
}
