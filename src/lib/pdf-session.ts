/**
 * Simple in-memory store to pass PDF session state between route pages.
 * Since this app is entirely client-side, we use a module-level singleton
 * rather than serializing File objects to URL params or localStorage.
 */

import type { PageRange } from "./pdf-extract";

export type PdfSession = {
  file: File;
  totalPages: number;
  ranges: PageRange[];
};

let _session: PdfSession | null = null;

export function setSession(session: PdfSession): void {
  _session = session;
}

export function getSession(): PdfSession | null {
  return _session;
}

export function clearSession(): void {
  _session = null;
}

export function updateSessionRanges(ranges: PageRange[]): void {
  if (_session) {
    _session = { ..._session, ranges };
  }
}
