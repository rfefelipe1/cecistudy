// Perfil → "trocar a pele do cantinho ♡" — seletor visual de tema (TEM-001 D.1).
<<<<<<< HEAD
// Grade 2×3 de mini-mocks; tocar aplica + haptics; ativo ganha borda forte + check.
import React from 'react';
import { Check, Palette } from 'lucide-react';
import { THEMES, THEME_ORDER, type ThemeId } from '../../../lib/themes';
import { hapticSuccess } from '../../../lib/haptics';
=======
// Grade 2×3 de mini-maps; tocar aplica + haptics; ativo ganha borda forte + check.
import React from 'react';
import { Check, Palette } from 'lucide-react';
import { THEMES, THEME_ORDER, type ThemeId, type Theme } from '../../../lib/themes';
import { hapticSuccess } from '../../../lib/haptics';
import { cn } from '@/lib/utils';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

interface ThemePickerCardProps {
  currentTheme: ThemeId;
  onSelect: (id: ThemeId) => void;
}

<<<<<<< HEAD
const ThemePickerCard: React.FC<ThemePickerCardProps> = ({ currentTheme, onSelect }) => {
  const current = THEMES[currentTheme];
  const t = current.tokens;
=======
/** Mini-map de um tema: faixa canvas, superfície, círculos marca/acadêmico e texto primário. */
const ThemeSwatch = ({
  theme,
  isActive,
  onSelect,
  children,
}: {
  theme: Theme;
  isActive: boolean;
  onSelect: (id: ThemeId) => void;
  children?: React.ReactNode;
}) => {
  const t = theme.tokens;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      aria-label={`tema ${theme.label}`}
      onClick={() => {
        hapticSuccess();
        onSelect(theme.id);
      }}
      className={cn(
        'flex flex-col items-start gap-2 rounded-2xl border p-3 tap-interactive cursor-pointer transition-colors',
        isActive
          ? 'border-ceci-border-brand-strong bg-surface-default'
          : 'border-ceci-border-default bg-surface-default hover:border-ceci-border-brand',
      )}
    >
      {/* Faixa de canvas do tema */}
      <div
        className="w-full h-6 rounded-xl"
        style={{ backgroundColor: t.canvas }}
      />
      <div className="w-full flex items-center justify-between gap-2">
        <div
          className="h-3 w-2/3 rounded-lg"
          style={{ backgroundColor: t['surface-default'] }}
        />
        <div
          className="h-3 w-1/3 rounded-lg"
          style={{ backgroundColor: t['surface-muted'] }}
        />
      </div>
      <div className="w-full flex items-center gap-1.5">
        <div className="h-2.5 w-6 rounded-full" style={{ backgroundColor: t['ceci-brand'] }} />
        <div className="h-2.5 w-4 rounded-full" style={{ backgroundColor: t['ceci-academic'] }} />
        <div className="h-2.5 w-3 rounded-full" style={{ backgroundColor: t['ceci-primary'] }} />
      </div>
      {isActive && (
        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-ceci-brand text-white">
          <Check className="w-3 h-3" />
        </div>
      )}
      {children}
    </button>
  );
};

const ThemePickerCard: React.FC<ThemePickerCardProps> = ({ currentTheme, onSelect }) => {
  const current = THEMES[currentTheme];
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-ceci-brand-strong" />
        <h3 className="font-display font-bold text-base text-ceci-primary">
          trocar a pele do cantinho ♡
        </h3>
      </div>
      <p className="text-xs text-ceci-tertiary">
        seis ares de clima para o seu espacinho — é só guardar a escolha.
      </p>

<<<<<<< HEAD
      <div className="rounded-2xl border border-ceci-border-default bg-surface-default p-3 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-semibold text-ceci-secondary uppercase tracking-wide w-20">
            tema
          </label>
          <select
            aria-label="selecionar tema"
            value={currentTheme}
            onChange={(e) => {
              const id = e.target.value as ThemeId;
              if (id !== currentTheme) {
                onSelect(id);
                hapticSuccess();
              }
            }}
            className="flex-1 rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-ceci-brand"
          >
            {THEME_ORDER.map((id) => {
              const theme = THEMES[id];
              return (
                <option key={id} value={id}>
                  {theme.emoji} {theme.label}
                </option>
              );
            })}
          </select>
        </div>

        <div
          className="rounded-xl p-3 border border-black/5"
          style={{ backgroundColor: t['canvas'] }}
        >
          <div
            className="h-1.5 w-2/3 rounded-full mb-2"
            style={{ backgroundColor: t['ceci-primary'] }}
          />
          <div
            className="h-8 rounded-lg px-1.5 py-1 space-y-1"
            style={{ backgroundColor: t['surface-default'] }}
          >
            <div className="flex gap-1">
              <div className="h-2 w-6 rounded-full" style={{ backgroundColor: t['ceci-brand'] }} />
              <div
                className="h-2 w-4 rounded-full"
                style={{ backgroundColor: t['ceci-academic'] }}
              />
            </div>
            <div
              className="h-1 w-3/5 rounded-full"
              style={{ backgroundColor: t['ceci-border-strong'] }}
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-ceci-primary">
            {current.emoji} {current.label}
          </p>
          <p className="text-[10px] leading-snug text-ceci-tertiary mt-0.5 line-clamp-2">
            {current.description}
          </p>
        </div>
=======
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2',
          'rounded-2xl border border-ceci-border-default bg-surface-default p-2',
        )}
      >
        {THEME_ORDER.map((id) => {
          const theme = THEMES[id];
          const isActive = id === currentTheme;
          return (
            <ThemeSwatch
              key={id}
              theme={theme}
              isActive={isActive}
              onSelect={onSelect}
            >
              <div className="flex flex-col items-start gap-1 pt-1">
                <p className="text-[11px] font-semibold text-ceci-primary">
                  {theme.emoji} {theme.label}
                </p>
                <p className="text-[9px] leading-tight text-ceci-tertiary line-clamp-2">
                  {theme.description}
                </p>
              </div>
            </ThemeSwatch>
          );
        })}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      </div>
    </div>
  );
};

export default ThemePickerCard;
