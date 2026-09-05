"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { StepBar } from "./step-bar";

type PageShellProps = {
  step: 0 | 1 | 2;
  mode?:
    | "split"
    | "merge"
    | "image"
    | "organize"
    | "page-numbers"
    | "watermark"
    | "crop"
    | "pdf-to-image"
    | "extract-images"
    | "resize"
    | "sign";
  children: ReactNode;
  footer?: ReactNode;
  fullHeight?: boolean;
  wide?: boolean;
};

export function PageShell({
  step,
  mode = "split",
  children,
  footer,
  fullHeight,
  wide,
}: PageShellProps) {
  const contentWidth = wide ? "max-w-[1440px]" : "max-w-3xl";

  return (
    <main
      className={`relative flex flex-col items-center px-3 py-3 md:px-5 lg:px-6 ${
        fullHeight ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"
      }`}
    >
      {/* Header - Sticky at the top */}
      <div className="w-full max-w-5xl bg-[var(--color-bg)] z-20 animate-fade-in shrink-0">
        <div className="flex items-center justify-between py-3">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group select-none"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
              PAGECUT
            </span>
          </Link>
          <StepBar current={step} mode={mode} />
        </div>
        <div
          className={`h-[1px] w-full ${wide ? "mb-2 sm:mb-4" : "mb-4"}`}
          style={{ background: "var(--color-border)" }}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col w-full ${contentWidth} ${wide ? "py-1 sm:py-2" : "py-4"} animate-fade-in-up ${
          fullHeight ? "overflow-hidden" : "justify-center"
        }`}
      >
        {children}
      </div>

      {/* Footer rendered outside of transform container to prevent containing-block bugs */}
      {footer}
    </main>
  );
}
