"use client";

import type { Dispatch, PointerEvent, SetStateAction } from "react";
import { useRef, useState } from "react";

type ReorderableItem = { id: string };
type DropPosition = "before" | "after";

type DragPoint = {
  x: number;
  y: number;
};

type DragFrame = {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

type PendingDrag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  frame: DragFrame;
};

const DRAG_THRESHOLD = 4;

export function useDragReorder<T extends ReorderableItem>(
  setItems: Dispatch<SetStateAction<T[]>>,
) {
  const pendingDragRef = useRef<PendingDrag | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);
  const dropTargetRef = useRef<{ id: string; position: DropPosition } | null>(
    null,
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const [dragFrame, setDragFrame] = useState<DragFrame | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: DropPosition;
  } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLElement>, itemId: string) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest('[data-no-drag="true"]')) return;

    const rect = event.currentTarget.getBoundingClientRect();
    pendingDragRef.current = {
      id: itemId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      frame: {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        height: rect.height,
      },
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const pending = pendingDragRef.current;
    if (!pending || pending.pointerId !== event.pointerId) return;

    if (!draggingIdRef.current) {
      const distance = Math.hypot(
        event.clientX - pending.startX,
        event.clientY - pending.startY,
      );
      if (distance < DRAG_THRESHOLD) return;

      draggingIdRef.current = pending.id;
      suppressClickRef.current = true;
      setDraggingId(pending.id);
      setDragFrame(pending.frame);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    setDragPoint({ x: event.clientX, y: event.clientY });

    const activeId = draggingIdRef.current;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-reorder-id]");
    const targetId = target?.dataset.reorderId;

    if (!target || !targetId || targetId === activeId) {
      dropTargetRef.current = null;
      setDropTarget(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const position: DropPosition =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    const nextTarget = { id: targetId, position };
    dropTargetRef.current = nextTarget;
    setDropTarget(nextTarget);
  }

  function handlePointerEnd(event: PointerEvent<HTMLElement>) {
    const pending = pendingDragRef.current;
    if (!pending || pending.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const activeId = draggingIdRef.current;
    const target = dropTargetRef.current;

    if (activeId && target && activeId !== target.id) {
      event.preventDefault();
      setItems((previous) => {
        const fromIndex = previous.findIndex((item) => item.id === activeId);
        if (fromIndex < 0) return previous;

        const next = [...previous];
        const [moved] = next.splice(fromIndex, 1);
        const targetIndex = next.findIndex((item) => item.id === target.id);
        if (targetIndex < 0) return previous;

        next.splice(
          targetIndex + (target.position === "after" ? 1 : 0),
          0,
          moved,
        );
        return next;
      });
    }

    pendingDragRef.current = null;
    draggingIdRef.current = null;
    dropTargetRef.current = null;
    setDraggingId(null);
    setDragPoint(null);
    setDragFrame(null);
    setDropTarget(null);

    if (suppressClickRef.current) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  }

  function getDropIndicator(itemId: string): DropPosition | null {
    return dropTarget?.id === itemId ? dropTarget.position : null;
  }

  function consumeClickSuppression(): boolean {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }

  return {
    draggingId,
    dragPoint,
    dragFrame,
    getDropIndicator,
    consumeClickSuppression,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
  };
}
