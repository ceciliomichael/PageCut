"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function DragReorderOverlay({
  x,
  y,
  offsetX,
  offsetY,
  width,
  children,
}: {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[100]"
      style={{
        left: x - offsetX,
        top: y - offsetY,
        width,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function DropIndicator({ position }: { position: "before" | "after" }) {
  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 z-20 h-0.5 bg-[var(--color-accent)] ${
        position === "before" ? "-top-[7px]" : "-bottom-[7px]"
      }`}
    />
  );
}
