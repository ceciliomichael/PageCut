import { PDFDocument } from "pdf-lib";
import type { MergeFileItem } from "./pdf-session";

export type MergeResult = {
  /** Final merged document bytes. */
  bytes: Uint8Array;
  /** Total number of pages in the merged document. */
  totalPages: number;
  /** Per-source file contribution details (for the results summary). */
  contributions: Array<{
    fileName: string;
    pagesContributed: number;
    fromPage: number;
    toPage: number;
  }>;
};

/**
 * Merges the given files (in order) into a single PDF, respecting per-item
 * page range preferences. All work happens in the browser — no network calls.
 *
 * @throws When a file cannot be loaded, or a page range exceeds the document.
 */
export async function mergePdfFiles(
  items: MergeFileItem[],
): Promise<MergeResult> {
  if (items.length === 0) {
    throw new Error("At least one PDF file is required to merge.");
  }

  const mergedDocument = await PDFDocument.create();
  const contributions: MergeResult["contributions"] = [];

  for (const item of items) {
    const pdfBytes = await item.file.arrayBuffer();
    const sourceDocument = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: false,
    });

    const totalSourcePages = sourceDocument.getPageCount();

    if (totalSourcePages === 0) {
      throw new Error(`"${item.file.name}" contains no pages.`);
    }

    // Determine the 1-indexed range to extract from this source document.
    let fromPage: number;
    let toPage: number;

    if (item.rangeMode === "custom" && item.customRange) {
      fromPage = item.customRange.from;
      toPage = item.customRange.to;

      if (
        fromPage < 1 ||
        toPage < 1 ||
        fromPage > toPage ||
        toPage > totalSourcePages
      ) {
        throw new Error(
          `Invalid page range ${fromPage}–${toPage} for "${item.file.name}" (${totalSourcePages} pages).`,
        );
      }
    } else {
      fromPage = 1;
      toPage = totalSourcePages;
    }

    // Convert to 0-indexed for pdf-lib.
    const pageIndices = Array.from(
      { length: toPage - fromPage + 1 },
      (_, i) => fromPage - 1 + i,
    );

    const copiedPages = await mergedDocument.copyPages(
      sourceDocument,
      pageIndices,
    );

    for (const page of copiedPages) {
      mergedDocument.addPage(page);
    }

    contributions.push({
      fileName: item.file.name,
      pagesContributed: pageIndices.length,
      fromPage,
      toPage,
    });
  }

  const mergedBytes = await mergedDocument.save();
  const totalPages = mergedDocument.getPageCount();

  return { bytes: mergedBytes, totalPages, contributions };
}
