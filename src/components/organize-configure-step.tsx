"use client";

import { ArrowDown, ArrowUp, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
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

  const previewSession = useMemo(
    () => (session ? { ...session, pages, outputName: undefined } : null),
    [pages, session],
  );

  if (!session || !previewSession) return null;
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

  function savePdf() {
    setPdfUtilitySession({
      ...activeSession,
      pages,
      outputName: outputName.trim() || undefined,
    });
    router.push("/organize/results");
  }

  return (
    <PageShell step={1} mode="organize" fullHeight wide>
      <PdfEditorWorkspace
        title="Organize PDF"
        description="Arrange the document while the complete PDF updates beside you."
        fileName={activeSession.file.name}
        pageCount={pages.length}
        previewSession={previewSession}
        primaryLabel="Save PDF"
        onPrimary={savePdf}
        onBack={() => router.push("/organize")}
        footerNote={`${pages.length} of ${activeSession.totalPages} pages kept`}
      >
        <section>
          <label
            htmlFor="organize-output"
            className="block text-xs font-medium text-[var(--color-text-secondary)]"
          >
            Output filename
          </label>
          <div className="relative mt-1.5 flex items-center">
            <input
              id="organize-output"
              className="input-field pr-14"
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              placeholder="organized-document"
              maxLength={120}
            />
            <span className="absolute right-3 text-xs text-[var(--color-text-muted)]">
              .pdf
            </span>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Pages
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Reorder, rotate, or remove. Preview updates automatically.
              </p>
            </div>
            <span className="tag-badge">{pages.length}</span>
          </div>

          <div className="space-y-2">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-2"
              >
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-surface)] text-[var(--color-text-secondary)] disabled:opacity-25"
                    aria-label={`Move page ${page.sourceIndex + 1} up`}
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === pages.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-surface)] text-[var(--color-text-secondary)] disabled:opacity-25"
                    aria-label={`Move page ${page.sourceIndex + 1} down`}
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Page {page.sourceIndex + 1}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Position {index + 1} · {page.rotation}°
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => rotate(page.id, -90)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
                    aria-label={`Rotate page ${page.sourceIndex + 1} left`}
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotate(page.id, 90)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
                    aria-label={`Rotate page ${page.sourceIndex + 1} right`}
                  >
                    <RotateCw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(page.id)}
                    disabled={pages.length <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)] disabled:opacity-25"
                    aria-label={`Remove page ${page.sourceIndex + 1}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </PdfEditorWorkspace>
    </PageShell>
  );
}
