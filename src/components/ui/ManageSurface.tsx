import React from 'react';
import type { ManagedItemKind } from '../../types';
<<<<<<< HEAD
import { useMobileApp } from '@/context/mobileApp';
=======
import { useManageItem } from '@/context/shellNavContexts';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { useLongPress } from '../../lib/useLongPress';

interface ManageSurfaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  kind: ManagedItemKind;
  id: string;
  /** Ação do toque normal (o long-press abre o menu editar/excluir no lugar). */
  onTap?: () => void;
}

/**
 * Card/linha que responde a long-press (mobile) ou clique com botão direito
 * (desktop) abrindo o menu universal de editar/excluir. O toque normal chama
 * `onTap` normalmente.
 */
export const ManageSurface: React.FC<ManageSurfaceProps> = ({
  kind,
  id,
  onTap,
  children,
  ...rest
}) => {
<<<<<<< HEAD
  const { openManageItem } = useMobileApp();
=======
  const { openManageItem } = useManageItem();
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  const handlers = useLongPress({
    onLongPress: () => openManageItem(kind, id),
    onClick: onTap,
  });
  return (
    <div {...handlers} {...rest}>
      {children}
    </div>
  );
};
