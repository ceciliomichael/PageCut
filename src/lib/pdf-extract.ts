import { PDFDocument } from "pdf-lib";

export type PageRange = {
  id: string;
  from: number;
  to: number;
  label?: string;
};

export type ExtractedChunk = {
  rangeId: string;
  fileName: string;
  pageStart: number;
  pageEnd: number;
  pageCount: number;
  bytes: Uint8Array;
};

function sanitizeBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.pdf$/i, "");
  const sanitized = withoutExtension.replace(/[^a-z0-9._-]+/gi, "-");
  return sanitized.length > 0 ? sanitized : "document";
}

export function validateRange(
  range: PageRange,
  totalPages: number,
): string | null {
  if (!Number.isInteger(range.from) || range.from < 1) {
    return "Start page must be a whole number of at least 1.";
  }
  if (!Number.isInteger(range.to) || range.to < 1) {
    return "End page must be a whole number of at least 1.";
  }
  if (range.from > range.to) {
    return "Start page cannot be greater than end page.";
  }
  if (range.from > totalPages || range.to > totalPages) {
    return `Page range exceeds document length (${totalPages} pages).`;
  }
  return null;
}

export async function getPageCount(file: File): Promise<number> {
  const pdfBytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
  return doc.getPageCount();
}

export async function extractPageRanges(
  file: File,
  ranges: PageRange[],
): Promise<ExtractedChunk[]> {
  if (ranges.length === 0) {
    throw new Error("At least one page range is required.");
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
  const chunks: ExtractedChunk[] = [];

  for (const range of ranges) {
    const error = validateRange(range, totalPages);
    if (error) {
      throw new Error(`Range ${range.from}–${range.to}: ${error}`);
    }

    // Convert 1-indexed user input to 0-indexed
    const pageIndices = Array.from(
      { length: range.to - range.from + 1 },
      (_, i) => range.from - 1 + i,
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
    const pageCount = range.to - range.from + 1;

    chunks.push({
      rangeId: range.id,
      fileName: `${baseName}-pages-${range.from}-${range.to}.pdf`,
      pageStart: range.from,
      pageEnd: range.to,
      pageCount,
      bytes: chunkBytes,
    });
  }

  return chunks;
}

export function truncateFileName(name: string, maxLen: number = 48): string {
  if (name.length <= maxLen) return name;
  const lastDot = name.lastIndexOf(".");
  if (lastDot === -1) {
    return `${name.slice(0, maxLen - 3)}...`;
  }
  const ext = name.slice(lastDot + 1); // e.g. "pdf" (stripped the dot)
  const base = name.slice(0, lastDot);
  const extWithDotLength = ext.length + 1;
  const allowedBaseLen = maxLen - extWithDotLength - 3;
  if (allowedBaseLen <= 0) {
    return `${name.slice(0, maxLen - 3)}...`;
  }
  return `${base.slice(0, allowedBaseLen)}...${ext}`;
}
