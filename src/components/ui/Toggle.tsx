import React from 'react';
import { cn } from '../../lib/utils';
<<<<<<< HEAD
import ToggleSwitch from './toggle-switch-glass';
=======
import { Switch as MaterialDesign3Switch } from './material-design-3-switch';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

<<<<<<< HEAD
/** Interruptor de vidro (toggle-switch-glass), padrão do cecistudy. */
=======
/** Interruptor padrão do cecistudy — delega ao material-design-3-switch. */
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled,
  loading,
  className,
}) => (
<<<<<<< HEAD
  <ToggleSwitch
    isActive={checked}
    onChange={() => onChange()}
    label={label}
    disabled={disabled || loading}
    size="sm"
    colorTheme="brand"
=======
  <MaterialDesign3Switch
    checked={checked}
    onCheckedChange={() => onChange()}
    aria-label={label}
    disabled={disabled || loading}
    size="sm"
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    className={cn('shrink-0', className)}
  />
);
