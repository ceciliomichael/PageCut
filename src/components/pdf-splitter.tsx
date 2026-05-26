"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  PDF_SPLIT_PAGE_SIZE,
  type PdfSplitChunk,
  splitPdfFile,
} from "@/lib/pdf-split";

type DownloadablePdf = PdfSplitChunk & {
  url: string;
};

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function formatPageRange(pageStart: number, pageEnd: number): string {
  return pageStart === pageEnd
    ? `Page ${pageStart}`
    : `Pages ${pageStart}-${pageEnd}`;
}

export default function PdfSplitter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloads, setDownloads] = useState<DownloadablePdf[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentObjectUrlsRef = useRef<string[]>([]);

  const totalPages = useMemo(
    () => downloads.reduce((sum, chunk) => sum + chunk.pageCount, 0),
    [downloads],
  );

  function revokeGeneratedDownloads() {
    for (const url of currentObjectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }

    currentObjectUrlsRef.current = [];
  }

  function clearGeneratedDownloads() {
    revokeGeneratedDownloads();
    setDownloads([]);
  }

  function setGeneratedDownloads(chunks: PdfSplitChunk[]) {
    revokeGeneratedDownloads();

    const nextDownloads = chunks.map((chunk) => ({
      ...chunk,
      url: URL.createObjectURL(
        new Blob([toArrayBuffer(chunk.bytes)], { type: "application/pdf" }),
      ),
    }));

    currentObjectUrlsRef.current = nextDownloads.map((chunk) => chunk.url);
    setDownloads(nextDownloads);
  }

  useEffect(() => {
    return () => {
      for (const url of currentObjectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setErrorMessage(null);

    if (!file) {
      setSelectedFile(null);
      clearGeneratedDownloads();
      return;
    }

    const isPdfFile =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdfFile) {
      setSelectedFile(null);
      setErrorMessage("Please upload a PDF file.");
      clearGeneratedDownloads();
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const chunks = await splitPdfFile(file, PDF_SPLIT_PAGE_SIZE);
      setGeneratedDownloads(chunks);
    } catch (error) {
      clearGeneratedDownloads();
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to split the uploaded PDF.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F7FF] px-4 py-6 text-[#101011] md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-[#F0F2F6] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex rounded-full bg-[#F3F0FF] px-4 py-2 text-sm font-medium text-[#8771FF]">
                PDF splitter
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Split any PDF into 250-page parts
                </h1>
                <p className="text-sm leading-6 text-[#606266] md:text-base">
                  Upload a PDF, and the app will automatically break it into
                  chunks of {PDF_SPLIT_PAGE_SIZE}
                  pages each. Every part gets its own download button.
                </p>
              </div>
            </div>

            <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-[#8771FF] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#6d5ed6] hover:scale-[1.02] active:scale-95">
              <span>{isProcessing ? "Processing..." : "Choose PDF"}</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#F0F2F6] bg-[#F8F7FF] p-4">
              <p className="text-sm text-[#606266]">Selected file</p>
              <p className="mt-2 break-words text-base font-medium text-[#101011]">
                {selectedFile ? selectedFile.name : "No file selected"}
              </p>
            </div>
            <div className="rounded-2xl border border-[#F0F2F6] bg-[#F8F7FF] p-4">
              <p className="text-sm text-[#606266]">Generated files</p>
              <p className="mt-2 text-base font-medium text-[#101011]">
                {downloads.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[#F0F2F6] bg-[#F8F7FF] p-4">
              <p className="text-sm text-[#606266]">
                Total pages across outputs
              </p>
              <p className="mt-2 text-base font-medium text-[#101011]">
                {totalPages}
              </p>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[#F0F2F6] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#101011]">
                Download split files
              </h2>
              <p className="mt-1 text-sm text-[#606266]">
                Each file is limited to {PDF_SPLIT_PAGE_SIZE} pages. For
                example, a 1,000-page PDF becomes 4 downloads, and a 1,100-page
                PDF becomes 5 downloads.
              </p>
            </div>
            {downloads.length > 0 ? (
              <p className="text-sm text-[#606266]">
                {downloads.length} part{downloads.length === 1 ? "" : "s"} ready
              </p>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {downloads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#F0F2F6] bg-[#F8F7FF] px-4 py-10 text-center text-sm text-[#606266]">
                Upload a PDF to generate the split downloads here.
              </div>
            ) : (
              downloads.map((chunk, index) => (
                <article
                  key={chunk.url}
                  className="flex flex-col gap-4 rounded-2xl border border-[#F0F2F6] bg-[#F8F7FF] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-base font-medium text-[#101011]">
                      {chunk.fileName}
                    </p>
                    <p className="text-sm text-[#606266]">
                      {formatPageRange(chunk.pageStart, chunk.pageEnd)} •{" "}
                      {chunk.pageCount} pages
                    </p>
                  </div>

                  <a
                    href={chunk.url}
                    download={chunk.fileName}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#8771FF] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#6d5ed6] hover:scale-[1.02] active:scale-95"
                  >
                    Download part {index + 1}
                  </a>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
