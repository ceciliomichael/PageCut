import {
  degrees,
  PDFDocument,
  type PDFFont,
  type PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib";
import type {
  OrganizeSession,
  PageNumberOptions,
  PageNumbersSession,
  PdfUtilitySession,
  WatermarkOptions,
  WatermarkSession,
} from "./pdf-utility-session";

export type PdfUtilityResult = {
  bytes: Uint8Array;
  totalPages: number;
  summary: string;
};

function formatNumber(
  value: number,
  total: number,
  format: PageNumberOptions["format"],
): string {
  if (format === "page-number") return `Page ${value}`;
  if (format === "number-total") return `${value} / ${total}`;
  return String(value);
}

function pageNumberPoint(
  page: PDFPage,
  textWidth: number,
  fontSize: number,
  position: PageNumberOptions["position"],
): { x: number; y: number } {
  const { width, height } = page.getSize();
  const margin = 28;
  const left = margin;
  const center = (width - textWidth) / 2;
  const right = width - margin - textWidth;
  const top = height - margin - fontSize;
  const bottom = margin;

  if (position === "top-left") return { x: left, y: top };
  if (position === "top-center") return { x: center, y: top };
  if (position === "top-right") return { x: right, y: top };
  if (position === "bottom-left") return { x: left, y: bottom };
  if (position === "bottom-right") return { x: right, y: bottom };
  return { x: center, y: bottom };
}

function watermarkPoint(
  page: PDFPage,
  font: PDFFont,
  options: WatermarkOptions,
): { x: number; y: number } {
  const { width, height } = page.getSize();
  const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
  const x = (width - textWidth) / 2;

  if (options.position === "top") {
    return { x, y: height - options.fontSize - 36 };
  }
  if (options.position === "bottom") {
    return { x, y: 36 };
  }
  return { x, y: (height - options.fontSize) / 2 };
}

function drawPageNumber(
  page: PDFPage,
  font: PDFFont,
  pageIndex: number,
  options: PageNumberOptions,
): void {
  if (pageIndex < options.fromPage - 1 || pageIndex > options.toPage - 1) {
    return;
  }

  const count = options.toPage - options.fromPage + 1;
  const finalNumber = options.startNumber + count - 1;
  const pageNumber = options.startNumber + (pageIndex - (options.fromPage - 1));
  const label = formatNumber(pageNumber, finalNumber, options.format);
  const textWidth = font.widthOfTextAtSize(label, options.fontSize);
  const point = pageNumberPoint(
    page,
    textWidth,
    options.fontSize,
    options.position,
  );

  page.drawText(label, {
    ...point,
    size: options.fontSize,
    font,
    color: rgb(0.18, 0.18, 0.18),
  });
}

function drawWatermark(
  page: PDFPage,
  font: PDFFont,
  options: WatermarkOptions,
): void {
  const point = watermarkPoint(page, font, options);
  page.drawText(options.text, {
    ...point,
    size: options.fontSize,
    font,
    color: rgb(0.35, 0.35, 0.35),
    opacity: options.opacity,
    rotate: degrees(options.rotation),
  });
}

async function organizePdf(
  session: OrganizeSession,
): Promise<PdfUtilityResult> {
  if (session.pages.length === 0) {
    throw new Error("Keep at least one page in the PDF.");
  }

  const source = await PDFDocument.load(await session.file.arrayBuffer(), {
    ignoreEncryption: false,
  });
  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(
    source,
    session.pages.map((page) => page.sourceIndex),
  );

  copiedPages.forEach((page, index) => {
    const rotation = session.pages[index]?.rotation ?? 0;
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotation + 360) % 360));
    output.addPage(page);
  });

  return {
    bytes: await output.save(),
    totalPages: output.getPageCount(),
    summary: `${output.getPageCount()} pages organized`,
  };
}

async function addPageNumbers(
  session: PageNumbersSession,
): Promise<PdfUtilityResult> {
  const document = await PDFDocument.load(await session.file.arrayBuffer(), {
    ignoreEncryption: false,
  });
  const font = await document.embedFont(StandardFonts.Helvetica);
  const { options } = session;
  const count = options.toPage - options.fromPage + 1;

  for (
    let pageIndex = options.fromPage - 1;
    pageIndex < options.toPage;
    pageIndex += 1
  ) {
    const page = document.getPage(pageIndex);
    drawPageNumber(page, font, pageIndex, options);
  }

  return {
    bytes: await document.save(),
    totalPages: document.getPageCount(),
    summary: `Page numbers added to ${count} ${count === 1 ? "page" : "pages"}`,
  };
}

async function addWatermark(
  session: WatermarkSession,
): Promise<PdfUtilityResult> {
  const document = await PDFDocument.load(await session.file.arrayBuffer(), {
    ignoreEncryption: false,
  });
  const font = await document.embedFont(StandardFonts.HelveticaBold);

  for (const page of document.getPages()) {
    drawWatermark(page, font, session.options);
  }

  return {
    bytes: await document.save(),
    totalPages: document.getPageCount(),
    summary: `Watermark added to ${document.getPageCount()} ${document.getPageCount() === 1 ? "page" : "pages"}`,
  };
}

export async function processPdfUtility(
  session: PdfUtilitySession,
): Promise<PdfUtilityResult> {
  if (session.kind === "organize") return organizePdf(session);
  if (session.kind === "page-numbers") return addPageNumbers(session);
  return addWatermark(session);
}
