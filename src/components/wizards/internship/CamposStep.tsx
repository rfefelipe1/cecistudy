import React from 'react';
import type { WizardStep } from '../WizardScaffold';
import { ToggleRow } from '../../ui/ToggleRow';
import {
  camposDeReferencia,
  CAMPO_REFERENCIA_LABEL,
  CAMPO_REFERENCIA_DESCRICAO,
  type CampoPendencia,
} from '../../../lib/internshipCases';
import type { InternshipLogType } from '../../../types';

interface CamposStepProps {
  kind: InternshipLogType | null;
  declinedFields: CampoPendencia[];
  onToggle: (campo: CampoPendencia) => void;
}

/** Retorna o objeto WizardStep dos campos de referência (switches de declínio). */
export function CamposStep(props: CamposStepProps): WizardStep {
  const { kind, declinedFields, onToggle } = props;
  return {
    id: 'campos',
    title: 'campos',
    headline: 'quais campos você quer responder?',
    subtitle:
      'os que você desligar ficam anotados como não respondidos — dá para ligar de novo depois.',
    content: (
      <div className="space-y-3">
        {camposDeReferencia(kind ?? 'estagio').map((c) => (
          <ToggleRow
            key={c}
            label={CAMPO_REFERENCIA_LABEL[c]}
            description={CAMPO_REFERENCIA_DESCRICAO[c]}
            checked={!(declinedFields ?? []).includes(c)}
            onChange={() => onToggle(c)}
          />
        ))}
      </div>
    ),
  };
}
