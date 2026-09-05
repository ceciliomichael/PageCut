import {
  degrees,
  PDFDocument,
  type PDFFont,
  type PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib";
import { embedImageFile } from "./image-to-pdf";
import type {
  CropMargins,
  CropSession,
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

function validateCropMargins(options: CropMargins): void {
  const values = [options.top, options.right, options.bottom, options.left];
  if (
    values.some((value) => !Number.isFinite(value) || value < 0 || value > 0.99)
  ) {
    throw new Error("Crop margins must be between 0% and 99%.");
  }
  if (
    options.left + options.right > 0.99 ||
    options.top + options.bottom > 0.99
  ) {
    throw new Error("Crop margins must leave at least 1% of the page visible.");
  }
}

function imageWatermarkPoint(
  page: PDFPage,
  width: number,
  height: number,
  position: WatermarkOptions["position"],
): { x: number; y: number } {
  const pageSize = page.getSize();
  const x = (pageSize.width - width) / 2;
  if (position === "top") return { x, y: pageSize.height - height - 36 };
  if (position === "bottom") return { x, y: 36 };
  return { x, y: (pageSize.height - height) / 2 };
}

function imageWatermarkRotatedPoint(
  point: { x: number; y: number },
  width: number,
  height: number,
  rotation: number,
): { x: number; y: number } {
  const radians = (rotation * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const centerX = point.x + width / 2;
  const centerY = point.y + height / 2;

  return {
    x: centerX - (cosine * width) / 2 + (sine * height) / 2,
    y: centerY - (sine * width) / 2 - (cosine * height) / 2,
  };
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
  const { options } = session;

  if (options.mode === "image") {
    if (!options.image) throw new Error("Choose an image watermark first.");
    const image = await embedImageFile(document, options.image.file);
    for (const page of document.getPages()) {
      const pageWidth = page.getSize().width;
      const width = pageWidth * options.imageScale;
      const height = width * (image.height / image.width);
      const basePoint = imageWatermarkPoint(
        page,
        width,
        height,
        options.position,
      );
      const point = imageWatermarkRotatedPoint(
        basePoint,
        width,
        height,
        options.rotation,
      );
      page.drawImage(image, {
        ...point,
        width,
        height,
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
  } else {
    const font = await document.embedFont(StandardFonts.HelveticaBold);
    for (const page of document.getPages()) {
      drawWatermark(page, font, options);
    }
  }

  return {
    bytes: await document.save(),
    totalPages: document.getPageCount(),
    summary: `Watermark added to ${document.getPageCount()} ${document.getPageCount() === 1 ? "page" : "pages"}`,
  };
}

async function cropPdf(session: CropSession): Promise<PdfUtilityResult> {
  const document = await PDFDocument.load(await session.file.arrayBuffer(), {
    ignoreEncryption: false,
  });
  const pages = document.getPages();
  if (session.options.length !== pages.length) {
    throw new Error("Crop settings do not match the number of PDF pages.");
  }

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const page = pages[pageIndex];
    const options = session.options[pageIndex];
    if (!page || !options) continue;
    validateCropMargins(options);
    const box = page.getCropBox();
    const x = box.x + box.width * options.left;
    const y = box.y + box.height * options.bottom;
    const width = box.width * (1 - options.left - options.right);
    const height = box.height * (1 - options.top - options.bottom);
    page.setCropBox(x, y, width, height);
  }

  return {
    bytes: await document.save(),
    totalPages: document.getPageCount(),
    summary: `Cropped ${document.getPageCount()} ${document.getPageCount() === 1 ? "page" : "pages"}`,
  };
}

export async function processPdfUtility(
  session: PdfUtilitySession,
): Promise<PdfUtilityResult> {
  if (session.kind === "organize") return organizePdf(session);
  if (session.kind === "page-numbers") return addPageNumbers(session);
  if (session.kind === "crop") return cropPdf(session);
  return addWatermark(session);
}
