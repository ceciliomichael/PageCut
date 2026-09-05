"use client";

import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useId, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { SplitLivePreview } from "@/components/pdf-live-preview";
import { type PageRange, validateRange } from "@/lib/pdf-extract";
import { getSession, updateSessionRanges } from "@/lib/pdf-session";

type RangeEntry = PageRange & {
  fromRaw: string;
  toRaw: string;
  error?: string;
};

function newEntry(id: string): RangeEntry {
  return { id, from: 0, to: 0, fromRaw: "", toRaw: "", label: "" };
}

function generateId(): string {
  return `range-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ConfigurePage() {
  const session = getSession();
  const router = useRouter();
  const baseId = useId();

  const [entries, setEntries] = useState<RangeEntry[]>(() => {
    if (session?.ranges && session.ranges.length > 0) {
      return session.ranges.map((r) => ({
        ...r,
        fromRaw: r.from.toString(),
        toRaw: r.to.toString(),
      }));
    }
    return [newEntry(`${baseId}-0`)];
  });

  // Redirect back if session is missing (e.g. page refresh)
  useEffect(() => {
    if (!session) {
      router.replace("/split");
    }
  }, [session, router]);

  if (!session) return null;

  const { file, totalPages } = session;

  function updateEntry(
    id: string,
    field: "fromRaw" | "toRaw" | "label",
    value: string,
  ) {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        const updated = { ...entry, [field]: value, error: undefined };

        if (field === "fromRaw" || field === "toRaw") {
          const raw = value.trim();
          const parsed = raw === "" ? 0 : Number.parseInt(raw, 10);
          const isValid = raw !== "" && Number.isInteger(parsed) && parsed >= 1;

          if (field === "fromRaw") {
            updated.from = isValid ? parsed : 0;
          } else {
            updated.to = isValid ? parsed : 0;
          }
        }

        return updated;
      }),
    );
  }

  function addEntry() {
    setEntries((prev) => [...prev, newEntry(generateId())]);
  }

  function removeEntry(id: string) {
    setEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((e) => e.id !== id);
    });
  }

  function validateAll(): RangeEntry[] {
    return entries.map((entry) => {
      if (entry.fromRaw.trim() === "" || entry.toRaw.trim() === "") {
        return { ...entry, error: "Both start and end pages are required." };
      }

      const from = Number.parseInt(entry.fromRaw, 10);
      const to = Number.parseInt(entry.toRaw, 10);

      if (!Number.isInteger(from) || !Number.isInteger(to)) {
        return { ...entry, error: "Pages must be whole numbers." };
      }

      const range: PageRange = { id: entry.id, from, to };
      const error = validateRange(range, totalPages);
      return error ? { ...entry, from, to, error } : { ...entry, from, to };
    });
  }

  function handleExtract() {
    const validated = validateAll();
    const hasErrors = validated.some((e) => e.error);
    setEntries(validated);

    if (hasErrors) return;

    const ranges: PageRange[] = validated.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      label: e.label || undefined,
    }));

    updateSessionRanges(ranges);
    router.push("/split/results");
  }

  const canExtract = entries.some(
    (e) => e.fromRaw.trim() !== "" && e.toRaw.trim() !== "",
  );
  const previewRanges: PageRange[] = entries.map((entry) => ({
    id: entry.id,
    from: entry.from,
    to: entry.to,
    label: entry.label || undefined,
  }));

  return (
    <PageShell step={1} mode="split" fullHeight wide>
      <PdfEditorWorkspace
        title="Split & extract"
        description="Define page ranges while the source PDF stays visible beside you."
        fileName={file.name}
        pageCount={totalPages}
        preview={
          <SplitLivePreview
            file={file}
            totalPages={totalPages}
            ranges={previewRanges}
          />
        }
        primaryLabel="Extract pages"
        onPrimary={handleExtract}
        onBack={() => router.push("/split")}
        primaryDisabled={!canExtract}
        footerNote="Each range creates its own PDF"
      >
        <div>
          <div className="mb-3">
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">
              Page ranges
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-muted)]">
              Valid ranges are marked directly in the source preview. Ranges may
              overlap.
            </p>
          </div>

          <div className="space-y-3">
            {entries.map((entry, index) => (
              <RangeRow
                key={entry.id}
                entry={entry}
                index={index}
                totalPages={totalPages}
                canRemove={entries.length > 1}
                onChange={updateEntry}
                onRemove={removeEntry}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addEntry}
            id="btn-add-range"
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-150 mt-4"
            style={{
              background: "transparent",
              border: "1.5px dashed var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--color-border-strong)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--color-bg-subtle)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--color-border)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <Plus size={15} />
            Add another range
          </button>
        </div>
      </PdfEditorWorkspace>
    </PageShell>
  );
}

type RangeRowProps = {
  entry: RangeEntry;
  index: number;
  totalPages: number;
  canRemove: boolean;
  onChange: (
    id: string,
    field: "fromRaw" | "toRaw" | "label",
    value: string,
  ) => void;
  onRemove: (id: string) => void;
};

function RangeRow({
  entry,
  index,
  canRemove,
  onChange,
  onRemove,
}: RangeRowProps) {
  return (
    <div
      className="rounded-xl p-4 animate-slide-in space-y-3"
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${entry.error ? "var(--color-danger-border)" : "var(--color-border)"}`,
      }}
    >
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Range {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="btn-danger"
            id={`btn-remove-range-${index}`}
            aria-label={`Remove range ${index + 1}`}
          >
            <Trash2 size={13} />
            Remove
          </button>
        )}
      </div>

      {/* Page inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`range-from-${entry.id}`}
            className="mb-1.5 block text-xs font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Start page
          </label>
          <input
            id={`range-from-${entry.id}`}
            type="number"
            min={1}
            placeholder="e.g. 1"
            value={entry.fromRaw}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(entry.id, "fromRaw", e.target.value)
            }
            className="input-field"
            style={
              entry.error
                ? {
                    borderColor: "var(--color-danger-border)",
                    boxShadow: "0 0 0 3px rgba(185,28,28,0.06)",
                  }
                : {}
            }
          />
        </div>
        <div>
          <label
            htmlFor={`range-to-${entry.id}`}
            className="mb-1.5 block text-xs font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            End page
          </label>
          <input
            id={`range-to-${entry.id}`}
            type="number"
            min={1}
            placeholder="e.g. 50"
            value={entry.toRaw}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(entry.id, "toRaw", e.target.value)
            }
            className="input-field"
            style={
              entry.error
                ? {
                    borderColor: "var(--color-danger-border)",
                    boxShadow: "0 0 0 3px rgba(185,28,28,0.06)",
                  }
                : {}
            }
          />
        </div>
      </div>

      {/* Optional label */}
      <div>
        <label
          htmlFor={`range-label-${entry.id}`}
          className="mb-1.5 block text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Label{" "}
          <span style={{ color: "var(--color-text-muted)" }}>(optional)</span>
        </label>
        <input
          id={`range-label-${entry.id}`}
          type="text"
          placeholder="e.g. Chapter 1, Introduction…"
          value={entry.label ?? ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(entry.id, "label", e.target.value)
          }
          className="input-field"
        />
      </div>

      {/* Error */}
      {entry.error && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 animate-fade-in"
          style={{
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-danger-border)",
          }}
        >
          <AlertCircle
            size={13}
            className="mt-0.5 shrink-0"
            style={{ color: "var(--color-danger-text)" }}
          />
          <p className="text-xs" style={{ color: "var(--color-danger-text)" }}>
            {entry.error}
          </p>
        </div>
      )}
    </div>
  );
}
