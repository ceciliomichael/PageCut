export type ExtractImagesOptions = {
  fromPage: number;
  toPage: number;
  minWidth: number;
  minHeight: number;
};

export type ExtractImagesSession = {
  file: File;
  totalPages: number;
  options: ExtractImagesOptions;
  outputName?: string;
};

let _session: ExtractImagesSession | null = null;

export function createExtractImagesSession(
  file: File,
  totalPages: number,
): ExtractImagesSession {
  return {
    file,
    totalPages,
    options: {
      fromPage: 1,
      toPage: totalPages,
      minWidth: 16,
      minHeight: 16,
    },
  };
}

export function setExtractImagesSession(session: ExtractImagesSession): void {
  _session = session;
}

export function getExtractImagesSession(): ExtractImagesSession | null {
  return _session;
}

export function clearExtractImagesSession(): void {
  _session = null;
}
