import { PDFDocument } from "pdf-lib";

export const PDF_SPLIT_PAGE_SIZE = 250;

export type PdfSplitChunk = {
  fileName: string;
  pageCount: number;
  pageStart: number;
  pageEnd: number;
  bytes: Uint8Array;
};

function sanitizeBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.pdf$/i, "");
  const sanitized = withoutExtension.replace(/[^a-z0-9._-]+/gi, "-");

  return sanitized.length > 0 ? sanitized : "split-document";
}

export async function splitPdfFile(
  file: File,
  chunkSize: number = PDF_SPLIT_PAGE_SIZE,
): Promise<PdfSplitChunk[]> {
  if (chunkSize < 1 || !Number.isInteger(chunkSize)) {
    throw new Error("Chunk size must be a positive whole number.");
  }

  const pdfBytes = await file.arrayBuffer();
  const sourceDocument = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: false,
  });
  const totalPages = sourceDocument.getPageCount();

  if (totalPages === 0) {
    throw new Error("The uploaded PDF does not contain any pages.");
  }

  const baseName = sanitizeBaseName(file.name);
  const chunks: PdfSplitChunk[] = [];

  for (
    let startPageIndex = 0;
    startPageIndex < totalPages;
    startPageIndex += chunkSize
  ) {
    const endPageIndexExclusive = Math.min(
      startPageIndex + chunkSize,
      totalPages,
    );
    const pageIndices = Array.from(
      { length: endPageIndexExclusive - startPageIndex },
      (_, index) => startPageIndex + index,
    );

    const chunkDocument = await PDFDocument.create();
    const copiedPages = await chunkDocument.copyPages(
      sourceDocument,
      pageIndices,
    );

    for (const page of copiedPages) {
      chunkDocument.addPage(page);
    }

    const chunkBytes = await chunkDocument.save();
    const pageStart = startPageIndex + 1;
    const pageEnd = endPageIndexExclusive;
    const pageCount = pageEnd - pageStart + 1;
    const chunkIndex = chunks.length + 1;

    chunks.push({
      fileName: `${baseName}-part-${chunkIndex}.pdf`,
      pageCount,
      pageStart,
      pageEnd,
      bytes: chunkBytes,
    });
  }

  return chunks;
}
