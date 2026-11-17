'use client';

import React, { useRef, useState } from 'react';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { IOS_EASE, prefersReducedMotion } from '@/lib/motion';
import { NAV_DRAG_ENGAGE_PX, navbarIndexFromX } from '@/lib/swipe';

export type NavItem = {
  id?: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

export type BottomNavBarProps = {
  className?: string;
  items: NavItem[];
  activeIndex: number;
  /**
   * `onChange(index, direction?)`: `direction` só vem do arrasto (`+1` = próxima
   * aba, `-1` = anterior) e vale como direção do slide. Toque não passa direção.
   */
  onChange?: (index: number, direction?: 1 | -1) => void;
  /** Durante o arrasto: índice da aba sob o dedo (preview ao vivo, sem navegar). */
  onDragPreview?: (index: number) => void;
  /** No fim do arrasto: índice para o qual commitar, com direção do slide. */
  onDragCommit?: (index: number, direction: 1 | -1) => void;
};

/** Geometria da barra congelada no `pointerdown` do gesto. */
type DragState = {
  pointerId: number;
  startX: number;
  startIndex: number;
  moved: boolean;
  target: number;
  left: number;
  width: number;
  count: number;
};

export function BottomNavBar({
  className,
  items,
  activeIndex,
  onChange,
  onDragPreview,
  onDragCommit,
}: BottomNavBarProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  // Marca que o `click` sintetizado no fim de um arrasto não deve trocar de aba.
  const suppressClickRef = useRef(false);
  // Índice "visual" durante o gesto: faz a pílula e o rótulo seguirem o dedo.
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const count = items.length;
  const displayIndex = dragIndex ?? activeIndex;

  const handleSelect = (idx: number) => {
    // O arrasto já navegou no `pointerup`; o click que vem depois é ruído.
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onChange?.(idx);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Mouse não arrasta: no desktop brigaria com seleção de texto.
    if (e.pointerType === 'mouse' || prefersReducedMotion()) return;
    const row = rowRef.current;
    if (!row || count === 0) return;
    suppressClickRef.current = false;
    const rect = row.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startIndex: activeIndex,
      moved: false,
      target: activeIndex,
      left: rect.left,
      width: rect.width,
      count,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.moved) {
      if (Math.abs(e.clientX - drag.startX) < NAV_DRAG_ENGAGE_PX) return;
      drag.moved = true;
      rowRef.current?.setPointerCapture?.(e.pointerId);
    }
    const idx = navbarIndexFromX(e.clientX, drag.left, drag.width, drag.count);
    if (idx !== drag.target) {
      const direction: 1 | -1 = idx > drag.target ? 1 : -1;
      drag.target = idx;
      setDragIndex(idx);
      // Preview ao vivo: mostra a tela de destino sem navegar de verdade.
      onDragPreview?.(idx);
    }
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { moved, target } = drag;
    dragRef.current = null;
    setDragIndex(null);
    if (!moved) return;
    // Commit: navega de verdade, uma única vez, com a direção do slide.
    onDragCommit?.(target, target > drag.startIndex ? 1 : -1);
    // Barrar o click sintetizado no pointerup para não trocar de aba de novo.
    suppressClickRef.current = true;
  };

  const cancelDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    setDragIndex(null);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: IOS_EASE }}
      role="navigation"
      aria-label="bottom navigation"
      className={cn(
        'liquid-glass-nav relative rounded-full border shadow-floating w-max max-w-[95vw] h-[52px]',
        className,
      )}
    >
      <div
        ref={rowRef}
        // `pan-y`: o scroll vertical da tela continua vivo; o horizontal é do gesto.
        style={{ touchAction: 'pan-y' }}
        className="relative z-10 flex items-center p-1.5 space-x-1 h-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
      >
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isActive = displayIndex === idx;

          return (
            <motion.button
              key={item.id || item.label}
              whileTap={{ scale: 0.94 }}
              className={cn(
                'flex items-center gap-0 px-3 py-2 rounded-full transition-colors duration-200 relative h-10 min-w-[44px] min-h-[44px] max-h-[44px] cursor-pointer',
                isActive
                  ? 'text-ceci-brand-strong gap-2'
                  : 'bg-transparent text-ceci-tertiary hover:bg-[color:var(--color-glass-hairline)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-2',
              )}
              onClick={() => handleSelect(idx)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              type="button"
            >
              {isActive && (
                <motion.span
                  layoutId="bottomnav-active-pill"
                  className="absolute inset-0 rounded-full liquid-glass-pill border"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}

              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 1.8}
                aria-hidden
                className={cn(
                  'relative z-10 transition-colors duration-200 shrink-0',
                  isActive ? 'text-ceci-brand-strong' : 'text-ceci-tertiary',
                )}
              />

              <motion.div
                initial={false}
                animate={{
                  width: isActive ? 'auto' : '0px',
                  opacity: isActive ? 1 : 0,
                  marginLeft: isActive ? '6px' : '0px',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 30,
                }}
                className="relative z-10 overflow-hidden flex items-center whitespace-nowrap"
              >
                <span
                  className={cn(
                    'font-semibold text-xs sm:text-xs text-ceci-brand-strong whitespace-nowrap select-none tracking-tight',
                  )}
                  title={item.label}
                >
                  {item.label}
                </span>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default BottomNavBar;
