"use client";

import {
  ArrowRight,
  Crop,
  FileImage,
  GitMerge,
  Hash,
  Images,
  ListOrdered,
  Maximize2,
  PenLine,
  Scissors,
  Stamp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearExtractImagesSession } from "@/lib/extract-images-session";
import {
  clearImageToPdfSession,
  clearMergeSession,
  clearSession,
} from "@/lib/pdf-session";
import { clearPdfToImageSession } from "@/lib/pdf-to-image-session";
import { clearPdfUtilitySession } from "@/lib/pdf-utility-session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    clearSession();
    clearMergeSession();
    clearImageToPdfSession();
    clearPdfUtilitySession();
    clearPdfToImageSession();
    clearExtractImagesSession();
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 md:px-6 lg:px-8"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="w-full max-w-5xl animate-fade-in-up">
        {/* Brand header */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          <span
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ background: "var(--color-accent)" }}
          />
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            PAGECUT
          </span>
        </div>

        {/* Hero text */}
        <div className="text-center space-y-3 mb-10">
          <h1
            className="text-3xl font-semibold tracking-tight md:text-4xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            What would you like to do?
          </h1>
          <p
            className="text-sm leading-6 max-w-sm mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Choose a tool below. Everything runs locally in your browser — your
            files never leave your device.
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Split & Extract card */}
          <button
            type="button"
            id="btn-mode-split"
            onClick={() => router.push("/split")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="icon-box h-11 w-11">
                <Scissors
                  size={20}
                  style={{ color: "var(--color-text-secondary)" }}
                />
              </div>
              <ArrowRight
                size={16}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1"
                style={{ color: "var(--color-text-muted)" }}
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <p
                className="text-base font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Split &amp; Extract
              </p>
              <p
                className="text-sm leading-5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Upload one PDF and extract specific page ranges into separate
                downloadable files.
              </p>
            </div>

            <div
              className="mt-5 pt-4"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                1 PDF → multiple files
              </p>
            </div>
          </button>

          <button
            type="button"
            id="btn-mode-pdf-to-image"
            onClick={() => router.push("/pdf-to-image")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="icon-box h-11 w-11">
                <FileImage
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              </div>
              <ArrowRight
                size={16}
                className="mt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[var(--color-text-muted)]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                PDF to PNG
              </p>
              <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
                Export PDF pages as lossless PNG images with range and
                resolution controls.
              </p>
            </div>
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Lossless PNG · page range
              </p>
            </div>
          </button>

          {/* Merge card */}
          <button
            type="button"
            id="btn-mode-merge"
            onClick={() => router.push("/merge")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="icon-box h-11 w-11">
                <GitMerge
                  size={20}
                  style={{ color: "var(--color-text-secondary)" }}
                />
              </div>
              <ArrowRight
                size={16}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1"
                style={{ color: "var(--color-text-muted)" }}
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <p
                className="text-base font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Merge PDFs
              </p>
              <p
                className="text-sm leading-5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Combine multiple PDFs into one. Reorder files and choose which
                pages to include from each.
              </p>
            </div>

            <div
              className="mt-5 pt-4"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Multiple PDFs → 1 file
              </p>
            </div>
          </button>

          {/* Image to PDF card */}
          <button
            type="button"
            id="btn-mode-image-to-pdf"
            onClick={() => router.push("/image-to-pdf")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="icon-box h-11 w-11">
                <Images
                  size={20}
                  style={{ color: "var(--color-text-secondary)" }}
                />
              </div>
              <ArrowRight
                size={16}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1"
                style={{ color: "var(--color-text-muted)" }}
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <p
                className="text-base font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Image to PDF
              </p>
              <p
                className="text-sm leading-5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Turn JPG, PNG, and WebP images into a single PDF in the order
                you choose.
              </p>
            </div>

            <div
              className="mt-5 pt-4"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Multiple images → 1 PDF
              </p>
            </div>
          </button>

          <button
            type="button"
            id="btn-mode-organize"
            onClick={() => router.push("/organize")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="icon-box h-11 w-11">
                <ListOrdered
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              </div>
              <ArrowRight
                size={16}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 text-[var(--color-text-muted)]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                Organize PDF
              </p>
              <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
                Reorder, rotate, and remove PDF pages in one tool.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)]">
                Reorder · rotate · remove
              </p>
            </div>
          </button>

          <button
            type="button"
            id="btn-mode-crop"
            onClick={() => router.push("/crop")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="icon-box h-11 w-11">
                <Crop
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              </div>
              <ArrowRight
                size={16}
                className="mt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[var(--color-text-muted)]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                Crop PDF
              </p>
              <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
                Trim page edges with a draggable live crop frame or precise
                margins.
              </p>
            </div>
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Drag · margins · vector-safe
              </p>
            </div>
          </button>

          <button
            type="button"
            id="btn-mode-page-numbers"
            onClick={() => router.push("/page-numbers")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="icon-box h-11 w-11">
                <Hash
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              </div>
              <ArrowRight
                size={16}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 text-[var(--color-text-muted)]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                Add Page Numbers
              </p>
              <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
                Number every page or a custom range with flexible placement.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)]">
                Position · format · range
              </p>
            </div>
          </button>

          <button
            type="button"
            id="btn-mode-watermark"
            onClick={() => router.push("/watermark")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="icon-box h-11 w-11">
                <Stamp
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              </div>
              <ArrowRight
                size={16}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 text-[var(--color-text-muted)]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                Add Watermark
              </p>
              <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
                Apply customizable text or image watermarks across the entire
                PDF.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)]">
                Text · image · opacity
              </p>
            </div>
          </button>

          <button
            type="button"
            id="btn-mode-sign"
            onClick={() => router.push("/sign")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="icon-box h-11 w-11">
                <PenLine
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              </div>
              <ArrowRight
                size={16}
                className="mt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[var(--color-text-muted)]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                Sign PDF
              </p>
              <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
                Type, draw, or upload a signature and place it directly on any
                PDF page.
              </p>
            </div>
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Type · draw · upload
              </p>
            </div>
          </button>

          <button
            type="button"
            id="btn-mode-extract-images"
            onClick={() => router.push("/extract-images")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="icon-box h-11 w-11">
                <Images
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              </div>
              <ArrowRight
                size={16}
                className="mt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[var(--color-text-muted)]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                Extract Images
              </p>
              <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
                Pull supported embedded raster images out of a PDF as lossless
                PNG files.
              </p>
            </div>
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Embedded raster images · PNG
              </p>
            </div>
          </button>

          <button
            type="button"
            id="btn-mode-resize"
            onClick={() => router.push("/resize")}
            className="mode-card group flex h-full flex-col p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="icon-box h-11 w-11">
                <Maximize2
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              </div>
              <ArrowRight
                size={16}
                className="mt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-[var(--color-text-muted)]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                Resize PDF
              </p>
              <p className="text-sm leading-5 text-[var(--color-text-secondary)]">
                Resize pages to A4, Letter, Legal, or custom dimensions with
                live fit and fill preview.
              </p>
            </div>
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Presets · custom size · fit/fill
              </p>
            </div>
          </button>
        </div>

        {/* Footer note */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: "var(--color-text-muted)" }}
        >
          All processing happens in your browser. No uploads, no accounts.
        </p>
      </div>
    </main>
  );
}
