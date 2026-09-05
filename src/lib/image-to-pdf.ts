import { PDFDocument, type PDFImage } from "pdf-lib";
import type { ImageFileItem } from "./pdf-session";

const MAX_PDF_PAGE_DIMENSION = 14_400;

export type ImagePdfResult = {
  bytes: Uint8Array;
  totalPages: number;
  sources: Array<{
    fileName: string;
    width: number;
    height: number;
  }>;
};

export function isSupportedImageFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}

export async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);

  try {
    if (bitmap.width < 1 || bitmap.height < 1) {
      throw new Error("Image has invalid dimensions.");
    }

    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

async function convertWebpToPng(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare this WebP image for conversion.");
    }

    context.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) resolve(value);
        else reject(new Error("Could not convert this WebP image."));
      }, "image/png");
    });

    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    bitmap.close();
  }
}

function fitPageSize(width: number, height: number): [number, number] {
  const largest = Math.max(width, height);
  if (largest <= MAX_PDF_PAGE_DIMENSION) return [width, height];

  const scale = MAX_PDF_PAGE_DIMENSION / largest;
  return [width * scale, height * scale];
}

export async function createPdfFromImages(
  items: ImageFileItem[],
): Promise<ImagePdfResult> {
  if (items.length === 0) {
    throw new Error("Add at least one image before creating a PDF.");
  }

  const document = await PDFDocument.create();
  const sources: ImagePdfResult["sources"] = [];

  for (const item of items) {
    if (!isSupportedImageFile(item.file)) {
      throw new Error(`Unsupported image format: "${item.file.name}".`);
    }

    const fileName = item.file.name.toLowerCase();
    const fileType = item.file.type.toLowerCase();
    let embeddedImage: PDFImage;

    if (fileType === "image/png" || fileName.endsWith(".png")) {
      embeddedImage = await document.embedPng(await item.file.arrayBuffer());
    } else if (
      fileType === "image/jpeg" ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg")
    ) {
      embeddedImage = await document.embedJpg(await item.file.arrayBuffer());
    } else {
      embeddedImage = await document.embedPng(
        await convertWebpToPng(item.file),
      );
    }

    const [pageWidth, pageHeight] = fitPageSize(
      embeddedImage.width,
      embeddedImage.height,
    );
    const page = document.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });

    sources.push({
      fileName: item.file.name,
      width: embeddedImage.width,
      height: embeddedImage.height,
    });
  }

  return {
    bytes: await document.save(),
    totalPages: document.getPageCount(),
    sources,
  };
}
