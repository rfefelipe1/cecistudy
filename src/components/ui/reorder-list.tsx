"use client";

import { createContext, useCallback, useContext, useId, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { Reorder, useDragControls, useReducedMotion } from "@/lib/motion";

const CELL = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const;
const INSTANT = { duration: 0 } as const;

function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [taken] = next.splice(from, 1);
  next.splice(to, 0, taken);
  return next;
}

/** Contexto provido por cada linha do ReorderList. O consumidor consome via
 *  `ReorderGrip` e coloca a alça onde quiser dentro do próprio card. */
type DragHandleContextValue = {
  label: string;
  grabbed: boolean;
  disabled: boolean;
  startDrag: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
};

const DragHandleContext =
  createContext<DragHandleContextValue | null>(null);

export type ReorderListProps<T> = {
  items: readonly T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  /** Ordem final escolhida pela usuária (arrastar ou teclado). O consumidor converte
   *  em posição canônica e grava (ex.: `commitFlatOrder`). */
  onReorder: (next: T[]) => void;
  /** Notificado quando um item termina de ser arrastado. Útil para evitar que um
   *  onClick do próprio item abra o conteúdo sem querer logo após o arrastar. */
  onItemDragEnd?: (id: string) => void;
  disabled?: boolean;
  children: (item: T) => React.ReactNode;
  label?: string;
};

/** Alça de arrastar. Deve ser renderizada dentro de uma linha do ReorderList. */
export function ReorderGrip({
  className = "",
}: {
  className?: string;
} = {}) {
  const handle = useContext(DragHandleContext);
  if (!handle) return null;
  return (
    <button
      type="button"
      data-no-swipe
      disabled={handle.disabled}
      aria-label={`arrastar ${handle.label}`}
      aria-pressed={handle.grabbed}
      onPointerDown={handle.startDrag}
      onKeyDown={handle.onKeyDown}
      className={`shrink-0 w-8 min-h-[44px] flex items-center justify-center text-ceci-tertiary hover:text-ceci-primary touch-none cursor-grab active:cursor-grabbing rounded-xl ${className}`}
    >
      <GripVertical className="w-4 h-4" aria-hidden />
    </button>
  );
}

function ReorderRow<T>({
  item,
  id,
  label,
  grabbed,
  disabled,
  reduced,
  onKeyDown,
  onDragEnd,
  onItemDragEnd,
  children,
}: {
  item: T;
  id: string;
  label: string;
  grabbed: boolean;
  disabled: boolean;
  reduced: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onItemDragEnd?: (id: string) => void;
  children: React.ReactNode;
}) {
  const controls = useDragControls();
  const handle: DragHandleContextValue = {
    label,
    grabbed,
    disabled,
    startDrag: (e) => controls.start(e),
    onKeyDown,
  };
  return (
    <Reorder.Item
      key={id}
      value={item}
      drag={disabled ? false : "y"}
      dragListener={false}
      dragControls={controls}
      onDragEnd={() => {
        onDragEnd();
        onItemDragEnd?.(id);
      }}
      transition={reduced ? INSTANT : CELL}
      whileDrag={reduced ? undefined : { scale: 1.02 }}
      className="list-none"
    >
      <DragHandleContext.Provider value={handle}>
        <span className="sr-only">{label}</span>
        <div className="min-w-0 flex-1">{children}</div>
      </DragHandleContext.Provider>
    </Reorder.Item>
  );
}

export function ReorderList<T>({
  items,
  getId,
  getLabel,
  onReorder,
  onItemDragEnd,
  disabled = false,
  children,
  label = "Lista reordenável",
}: ReorderListProps<T>) {
  const [dragOrder, setDragOrder] = useState<T[] | null>(null);
  const dragOrderRef = useRef<T[] | null>(null);
  const [grabbedId, setGrabbedId] = useState<string | null>(null);
  const [spoken, setSpoken] = useState("");
  const snapshotRef = useRef<readonly T[] | null>(null);
  const hintId = useId();
  const reduced = useReducedMotion() === true;

  const list = (dragOrder ?? items) as T[];
  const indexOf = useCallback(
    (id: string) => list.findIndex((item) => getId(item) === id),
    [list, getId],
  );

  const announce = useCallback((msg: string) => setSpoken(msg), []);

  const grab = useCallback(
    (id: string) => {
      snapshotRef.current = list;
      setGrabbedId(id);
      const at = indexOf(id);
      const item = list[at];
      announce(`${getLabel(item)} pega, posição ${at + 1} de ${list.length}.`);
    },
    [list, getId, getLabel, indexOf, announce],
  );

  /** Grava a ordem atual. Usado ao soltar (arrastar ou teclado). */
  const commit = useCallback(
    (next: T[]) => {
      dragOrderRef.current = null;
      snapshotRef.current = null;
      setGrabbedId(null);
      setDragOrder(null);
      onReorder(next);
    },
    [onReorder],
  );

  const drop = useCallback(
    (id: string) => {
      const at = indexOf(id);
      const item = list[at];
      announce(`${getLabel(item)} solto na posição ${at + 1}.`);
      // só grava se a ordem realmente mudou
      if (list.every((item, i) => getId(item) === getId(items[i]))) return;
      commit(list);
    },
    [list, items, getId, getLabel, indexOf, announce, commit],
  );

  const cancel = useCallback(() => {
    const snap = snapshotRef.current;
    snapshotRef.current = null;
    setGrabbedId(null);
    setDragOrder(snap ? (snap as T[]) : null);
    announce("Reordenação cancelada.");
  }, [list, announce]);

  const step = useCallback(
    (id: string, delta: -1 | 1) => {
      if (grabbedId !== id) return; // só move enquanto o grip está "seguro"
      const from = indexOf(id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= list.length) return;
      const next = moveItem(list, from, to);
      dragOrderRef.current = next;
      setDragOrder(next);
      const item = next[to];
      announce(`${getLabel(item)}, posição ${to + 1} de ${next.length}.`);
    },
    [list, getId, getLabel, indexOf, grabbedId, announce],
  );

  const handleGroupReorder = useCallback((next: T[]) => {
    dragOrderRef.current = next;
    setDragOrder(next);
  }, []);

  const handleDragEnd = useCallback(() => {
    const final = dragOrderRef.current;
    if (!final) return; // não arrastou / não mudou: nada grava
    commit(final);
  }, [commit]);

  const rowKeyDown = useCallback(
    (id: string) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const held = grabbedId === id;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (held) drop(id);
        else grab(id);
        return;
      }
      if ((e.key === "ArrowUp" || e.key === "ArrowDown") && held) {
        e.preventDefault();
        step(id, e.key === "ArrowUp" ? -1 : 1);
        return;
      }
      if (e.key === "Escape" && held) {
        e.preventDefault();
        cancel();
      }
    },
    [disabled, grabbedId, grab, drop, step, cancel],
  );

  return (
    <>
      <Reorder.Group
        axis="y"
        values={list}
        onReorder={handleGroupReorder}
        aria-label={label}
        className="m-0 list-none p-0 space-y-1"
      >
        {list.map((item) => {
          const id = getId(item);
          const held = grabbedId === id;
          return (
            <ReorderRow
              key={id}
              item={item}
              id={id}
              label={getLabel(item)}
              grabbed={held}
              disabled={disabled}
              reduced={reduced}
              onKeyDown={rowKeyDown(id)}
              onDragEnd={handleDragEnd}
              onItemDragEnd={onItemDragEnd}
            >
              {children(item)}
            </ReorderRow>
          );
        })}
      </Reorder.Group>
      <span id={hintId} className="sr-only">
        Arrastar para reordenar. No teclado, Espaço pega a linha, as setas movem,
        Espaço solta e Esc desfaz.
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {spoken}
      </span>
    </>
  );
}

export default ReorderList;
