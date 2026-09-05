export type PdfToImageOptions = {
  scale: number;
  fromPage: number;
  toPage: number;
};

export type PdfToImageSession = {
  file: File;
  totalPages: number;
  options: PdfToImageOptions;
  outputName?: string;
};

let _session: PdfToImageSession | null = null;

export function createPdfToImageSession(
  file: File,
  totalPages: number,
): PdfToImageSession {
  return {
    file,
    totalPages,
    options: {
      scale: 2,
      fromPage: 1,
      toPage: totalPages,
    },
  };
}

export function setPdfToImageSession(session: PdfToImageSession): void {
  _session = session;
}

export function getPdfToImageSession(): PdfToImageSession | null {
  return _session;
}

export function clearPdfToImageSession(): void {
  _session = null;
}
