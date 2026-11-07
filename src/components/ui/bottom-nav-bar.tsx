'use client';

import React from 'react';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
<<<<<<< HEAD
import { IOS_EASE } from '@/lib/motion';
=======
import { IOS_EASE, iconFxVariants, type IconFx } from '@/lib/motion';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

export type NavItem = {
  id?: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
<<<<<<< HEAD
=======
  /** little scene the icon plays when tapped/activated */
  fx?: IconFx;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
};

export type BottomNavBarProps = {
  className?: string;
  items: NavItem[];
  activeIndex: number;
  onChange?: (index: number) => void;
<<<<<<< HEAD
};

export function BottomNavBar({ className, items, activeIndex, onChange }: BottomNavBarProps) {
=======
  /** "light" (padrão) ou "dark" — varia o grau do vidro para fundo escuro. */
  tone?: "light" | "dark";
  /** Ícones apenas (label recolhido). Útil em telas muito pequenas. */
  compact?: boolean;
};

export function BottomNavBar({ className, items, activeIndex, onChange, tone, compact }: BottomNavBarProps) {
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  const handleSelect = (idx: number) => {
    onChange?.(idx);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: IOS_EASE }}
      role="navigation"
      aria-label="bottom navigation"
<<<<<<< HEAD
=======
      data-tone={tone}
      data-compact={compact === true ? "true" : compact === false ? "false" : undefined}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      className={cn(
        'liquid-glass-nav relative rounded-full border shadow-floating w-max max-w-[95vw] h-[52px]',
        className,
      )}
    >
      <div className="relative z-10 flex items-center p-1.5 space-x-1 h-full">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeIndex === idx;
<<<<<<< HEAD
=======
          const showLabel = !compact;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

          return (
            <motion.button
              key={item.id || item.label}
              whileTap={{ scale: 0.94 }}
              className={cn(
<<<<<<< HEAD
                'flex items-center gap-0 px-3 py-2 rounded-full transition-colors duration-200 relative h-10 min-w-[44px] min-h-[44px] max-h-[44px] cursor-pointer',
                isActive
                  ? 'text-ceci-brand-strong gap-2'
                  : 'bg-transparent text-ceci-tertiary hover:bg-[color:var(--color-glass-hairline)]',
=======
                'ripple-target flex items-center gap-0 rounded-full transition-colors duration-200 relative h-10 min-w-[44px] min-h-[44px] max-h-[44px] cursor-pointer overflow-hidden',
                compact ? 'px-2 py-1.5' : 'px-3 py-2',
                isActive && !compact
                  ? 'text-ceci-brand-strong gap-2'
                  : isActive && compact
                    ? 'text-ceci-brand-strong'
                    : 'bg-transparent text-ceci-tertiary hover:bg-[color:var(--color-glass-hairline)]',
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-2',
              )}
              onClick={() => handleSelect(idx)}
              aria-label={item.label}
              type="button"
            >
<<<<<<< HEAD
              {isActive && (
                <motion.span
                  layoutId="bottomnav-active-pill"
                  className="absolute inset-0 rounded-full liquid-glass-pill border"
=======
              <span className="ripple" aria-hidden="true" />
              {isActive && (
                <motion.span
                  layoutId="bottomnav-active-pill"
                  className="absolute inset-0 rounded-full liquid-glass-pill border z-10"
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}

<<<<<<< HEAD
              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 1.8}
                aria-hidden
                className={cn(
                  'relative z-10 transition-colors duration-200 shrink-0',
                  isActive ? 'text-ceci-brand-strong' : 'text-ceci-tertiary',
                )}
              />
=======
              <motion.span
                className="nv-ico relative z-10 inline-flex shrink-0"
                animate={isActive ? 'active' : 'idle'}
                variants={iconFxVariants[item.fx ?? 'pop']}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  aria-hidden
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-ceci-brand-strong' : 'text-ceci-tertiary',
                  )}
                />
              </motion.span>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

              <motion.div
                initial={false}
                animate={{
<<<<<<< HEAD
                  width: isActive ? 'auto' : '0px',
                  opacity: isActive ? 1 : 0,
                  marginLeft: isActive ? '6px' : '0px',
=======
                  width: showLabel && isActive ? 'auto' : '0px',
                  opacity: showLabel && isActive ? 1 : 0,
                  marginLeft: showLabel && isActive ? '6px' : '0px',
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
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
<<<<<<< HEAD
=======
                    !showLabel && 'sr-only',
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
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
