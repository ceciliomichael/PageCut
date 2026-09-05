/**
 * Simple in-memory store to pass PDF session state between route pages.
 * Since this app is entirely client-side, we use a module-level singleton
 * rather than serializing File objects to URL params or localStorage.
 *
 * Supports three independent flows:
 *  - Split/Extract: single-file, page-range-based extraction
 *  - Merge: multi-file, each with an optional per-file page range
 *  - Image to PDF: multiple images, one image per output page
 */

import type { PageRange } from "./pdf-extract";

// ---------------------------------------------------------------------------
// Split session
// ---------------------------------------------------------------------------

export type PdfSession = {
  file: File;
  totalPages: number;
  ranges: PageRange[];
};

let _splitSession: PdfSession | null = null;

export function setSession(session: PdfSession): void {
  _splitSession = session;
}

export function getSession(): PdfSession | null {
  return _splitSession;
}

export function clearSession(): void {
  _splitSession = null;
}

export function updateSessionRanges(ranges: PageRange[]): void {
  if (_splitSession) {
    _splitSession = { ..._splitSession, ranges };
  }
}

// ---------------------------------------------------------------------------
// Merge session
// ---------------------------------------------------------------------------

/** Specifies which pages to pull from a single file when merging. */
export type MergeRangeMode = "all" | "custom";

export type MergeFileItem = {
  /** Stable unique identifier for this entry. */
  id: string;
  /** The uploaded File object (stays in memory, never leaves the browser). */
  file: File;
  /** Total page count for validation purposes. */
  totalPages: number;
  /** Whether to pull all pages or a custom range from this file. */
  rangeMode: MergeRangeMode;
  /** Only relevant when rangeMode === "custom". */
  customRange?: { from: number; to: number };
};

export type MergeSession = {
  items: MergeFileItem[];
  /** Optional user-defined name for the merged PDF output (without extension). */
  outputName?: string;
};

let _mergeSession: MergeSession | null = null;

export function setMergeSession(session: MergeSession): void {
  _mergeSession = session;
}

export function getMergeSession(): MergeSession | null {
  return _mergeSession;
}

export function clearMergeSession(): void {
  _mergeSession = null;
}

export function updateMergeSessionItems(items: MergeFileItem[]): void {
  if (_mergeSession) {
    _mergeSession = { ..._mergeSession, items };
  }
}

// ---------------------------------------------------------------------------
// Image to PDF session
// ---------------------------------------------------------------------------

export type ImageFileItem = {
  id: string;
  file: File;
  width: number;
  height: number;
};

export type ImageToPdfSession = {
  items: ImageFileItem[];
  outputName?: string;
};

let _imageToPdfSession: ImageToPdfSession | null = null;

export function setImageToPdfSession(session: ImageToPdfSession): void {
  _imageToPdfSession = session;
}

export function getImageToPdfSession(): ImageToPdfSession | null {
  return _imageToPdfSession;
}

export function clearImageToPdfSession(): void {
  _imageToPdfSession = null;
}

export function updateImageToPdfSessionItems(items: ImageFileItem[]): void {
  if (_imageToPdfSession) {
    _imageToPdfSession = { ..._imageToPdfSession, items };
  }
}
