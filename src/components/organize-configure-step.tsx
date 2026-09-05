"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FileText,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import {
  getPdfUtilitySession,
  type OrganizedPage,
  type QuarterTurn,
  setPdfUtilitySession,
} from "@/lib/pdf-utility-session";

function rotateValue(value: QuarterTurn, delta: number): QuarterTurn {
  return ((value + delta + 360) % 360) as QuarterTurn;
}

export default function OrganizeConfigureStep() {
  const router = useRouter();
  const session = getPdfUtilitySession("organize");
  const [pages, setPages] = useState<OrganizedPage[]>(
    () => session?.pages ?? [],
  );
  const [outputName, setOutputName] = useState(session?.outputName ?? "");

  useEffect(() => {
    if (!session) router.replace("/organize");
  }, [router, session]);

  if (!session) return null;
  const activeSession = session;

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= pages.length) return;
    setPages((previous) => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function rotate(id: string, delta: -90 | 90) {
    setPages((previous) =>
      previous.map((page) =>
        page.id === id
          ? { ...page, rotation: rotateValue(page.rotation, delta) }
          : page,
      ),
    );
  }

  function remove(id: string) {
    if (pages.length <= 1) return;
    setPages((previous) => previous.filter((page) => page.id !== id));
  }

  function continueToResults() {
    setPdfUtilitySession({
      ...activeSession,
      pages,
      outputName: outputName.trim() || undefined,
    });
    router.push("/organize/results");
  }

  return (
    <PageShell
      step={1}
      mode="organize"
      fullHeight
      footer={
        <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 md:px-6 lg:px-8 bg-[var(--color-bg)] border-t border-[var(--color-border)] z-30">
          <div className="w-full max-w-2xl py-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => router.push("/organize")}
                className="btn-secondary"
              >
                <ArrowLeft size={15} />
                Back
              </button>
              <button
                type="button"
                onClick={continueToResults}
                className="btn-primary sm:ml-auto"
              >
                Save PDF
                <ArrowRight size={15} />
              </button>
            </div>
            <p className="text-xs text-center text-[var(--color-text-muted)]">
              {pages.length} of {activeSession.totalPages} pages will be kept.
            </p>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col w-full space-y-4 overflow-hidden">
        <div className="space-y-1.5 text-center shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl text-[var(--color-text-primary)]">
            Organize PDF pages
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Reorder, rotate, or remove pages. Changes are applied when you save.
          </p>
        </div>

        <div className="w-full max-w-2xl mx-auto shrink-0">
          <label
            htmlFor="organize-output"
            className="block mb-1.5 text-xs font-medium text-[var(--color-text-secondary)]"
          >
            Output filename
          </label>
          <div className="relative flex items-center">
            <input
              id="organize-output"
              className="input-field w-full pr-14"
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              placeholder="organized-document"
              maxLength={120}
            />
            <span className="absolute right-3 text-xs text-[var(--color-text-muted)]">
              .pdf
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-3 mb-44 sm:mb-28 pb-2 scrollbar-thin space-y-3">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="rounded-xl p-4 bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)] disabled:opacity-30"
                    aria-label="Move page up"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === pages.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)] disabled:opacity-30"
                    aria-label="Move page down"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>

                <div className="icon-box h-10 w-10">
                  <FileText size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Page {page.sourceIndex + 1}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Output page {index + 1} · Rotation {page.rotation}°
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => rotate(page.id, -90)}
                    className="btn-secondary px-2.5"
                    aria-label="Rotate left"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotate(page.id, 90)}
                    className="btn-secondary px-2.5"
                    aria-label="Rotate right"
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(page.id)}
                    disabled={pages.length <= 1}
                    className="btn-danger px-2.5 disabled:opacity-30"
                    aria-label="Remove page"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
