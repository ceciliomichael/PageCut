export type PdfUtilityKind = "organize" | "page-numbers" | "watermark";

export type QuarterTurn = 0 | 90 | 180 | 270;

export type OrganizedPage = {
  id: string;
  sourceIndex: number;
  rotation: QuarterTurn;
};

export type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type PageNumberFormat = "number" | "page-number" | "number-total";

export type PageNumberOptions = {
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontSize: number;
  startNumber: number;
  fromPage: number;
  toPage: number;
};

export type WatermarkPosition = "center" | "top" | "bottom";

export type WatermarkOptions = {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
};

type UtilityBase = {
  file: File;
  totalPages: number;
  outputName?: string;
};

export type OrganizeSession = UtilityBase & {
  kind: "organize";
  pages: OrganizedPage[];
};

export type PageNumbersSession = UtilityBase & {
  kind: "page-numbers";
  options: PageNumberOptions;
};

export type WatermarkSession = UtilityBase & {
  kind: "watermark";
  options: WatermarkOptions;
};

export type PdfUtilitySession =
  | OrganizeSession
  | PageNumbersSession
  | WatermarkSession;

let _utilitySession: PdfUtilitySession | null = null;

function pageId(index: number): string {
  return `page-${index + 1}`;
}

export function createPdfUtilitySession(
  kind: PdfUtilityKind,
  file: File,
  totalPages: number,
): PdfUtilitySession {
  if (kind === "organize") {
    return {
      kind,
      file,
      totalPages,
      pages: Array.from({ length: totalPages }, (_, index) => ({
        id: pageId(index),
        sourceIndex: index,
        rotation: 0,
      })),
    };
  }

  if (kind === "page-numbers") {
    return {
      kind,
      file,
      totalPages,
      options: {
        position: "bottom-center",
        format: "number",
        fontSize: 12,
        startNumber: 1,
        fromPage: 1,
        toPage: totalPages,
      },
    };
  }

  return {
    kind,
    file,
    totalPages,
    options: {
      text: "CONFIDENTIAL",
      fontSize: 42,
      opacity: 0.2,
      rotation: -35,
      position: "center",
    },
  };
}

export function setPdfUtilitySession(session: PdfUtilitySession): void {
  _utilitySession = session;
}

export function getPdfUtilitySession(kind: "organize"): OrganizeSession | null;
export function getPdfUtilitySession(
  kind: "page-numbers",
): PageNumbersSession | null;
export function getPdfUtilitySession(
  kind: "watermark",
): WatermarkSession | null;
export function getPdfUtilitySession(
  kind: PdfUtilityKind,
): PdfUtilitySession | null;
export function getPdfUtilitySession(
  kind: PdfUtilityKind,
): PdfUtilitySession | null {
  return _utilitySession?.kind === kind ? _utilitySession : null;
}

export function clearPdfUtilitySession(): void {
  _utilitySession = null;
}
