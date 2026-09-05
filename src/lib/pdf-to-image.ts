import type { PdfToImageSession } from "./pdf-to-image-session";

type PdfViewport = {
  width: number;
  height: number;
};

type PdfRenderTask = {
  promise: Promise<void>;
};

type PdfPageProxy = {
  getViewport: (options: { scale: number }) => PdfViewport;
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
  destroy?: () => Promise<void>;
};

export type PdfImageResultItem = {
  pageNumber: number;
  fileName: string;
  blob: Blob;
  width: number;
  height: number;
};

function safeBaseName(sourceName: string, customName?: string): string {
  const source = (customName?.trim() || sourceName).replace(
    /\.(?:pdf|jpe?g|png)$/i,
    "",
  );
  return (
    source.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") ||
    "pagecut-pages"
  );
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create an image from this PDF page."));
    }, "image/png");
  });
}

export async function convertPdfToImages(
  session: PdfToImageSession,
  onProgress?: (completed: number, total: number) => void,
): Promise<PdfImageResultItem[]> {
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
  if (![1, 1.5, 2, 3].includes(options.scale)) {
    throw new Error("Choose a valid image resolution.");
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await session.file.arrayBuffer()),
    useSystemFonts: true,
  }) as unknown as PdfLoadingTask;
  const pdfDocument = await loadingTask.promise;
  const results: PdfImageResultItem[] = [];
  const total = options.toPage - options.fromPage + 1;
  const base = safeBaseName(session.file.name, session.outputName);

  try {
    for (
      let pageNumber = options.fromPage;
      pageNumber <= options.toPage;
      pageNumber += 1
    ) {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: options.scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Could not prepare the image canvas.");

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const blob = await canvasToPngBlob(canvas);
      const suffix = total === 1 ? "" : `-page-${pageNumber}`;
      results.push({
        pageNumber,
        fileName: `${base}${suffix}.png`,
        blob,
        width: canvas.width,
        height: canvas.height,
      });
      canvas.width = 1;
      canvas.height = 1;
      onProgress?.(results.length, total);
    }
  } finally {
    await loadingTask.destroy?.();
  }

  return results;
}
