/**
 * Simple in-memory store to pass PDF session state between route pages.
 * Since this app is entirely client-side, we use a module-level singleton
 * rather than serializing File objects to URL params or localStorage.
 *
 * Supports two independent flows:
 *  - Split/Extract: single-file, page-range-based extraction
 *  - Merge: multi-file, each with an optional per-file page range
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
