// Wizard "transformar nota" — formulário de prova/avaliação (MOD-001 / B.5).
import React from 'react';
import type { ReactNode } from 'react';
<<<<<<< HEAD
import { DateInput, FieldLabel, TextInput } from '../wizardFields';
=======
import { FieldLabel, TextInput } from '../wizardFields';
import { CeciDatePicker } from '../../ui/ceci';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { TagField } from '../../ui/TagField';
import { VAZIO, frase } from '../../../lib/voice';

interface ExamFormProps {
  value: string;
  onChange: (v: string) => void;
  courseSelect: ReactNode;
  date: string;
  onDateChange: (d: string) => void;
  weight: string;
  onWeightChange: (w: string) => void;
  topics: string[];
  onTopicsChange: (t: string[]) => void;
}

const ExamForm: React.FC<ExamFormProps> = ({
  value,
  onChange,
  courseSelect,
  date,
  onDateChange,
  weight,
  onWeightChange,
  topics,
  onTopicsChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="título da prova"
      autoFocus
    />
    {courseSelect}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel>data</FieldLabel>
<<<<<<< HEAD
        <DateInput value={date} onChange={(e) => onDateChange(e.target.value)} />
=======
        <CeciDatePicker value={date ?? null} onChange={onDateChange} />
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      </div>
      <div>
        <FieldLabel>peso</FieldLabel>
        <TextInput
          value={weight}
          onChange={(e) => onWeightChange(e.target.value)}
          placeholder="ex: 40% da nota"
        />
      </div>
    </div>
    <TagField
      tags={topics}
      onChange={onTopicsChange}
      placeholder="tópicos da prova (ex: transtornos de ansiedade)"
      emptyMessage={frase(VAZIO, 'campoOpcional')}
    />
  </div>
);

export default ExamForm;
