// Wizard "transformar nota" — formulário de sessão de estudo (MOD-001 / B.5).
import React from 'react';
import type { ReactNode } from 'react';
<<<<<<< HEAD
import { DateInput, FieldLabel, TextInput } from '../wizardFields';
=======
import { FieldLabel, TextInput } from '../wizardFields';
import { CeciDatePicker } from '../../ui/ceci';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

interface SessionFormProps {
  topic: string;
  onTopicChange: (v: string) => void;
  courseSelect: ReactNode;
  date: string;
  onDateChange: (d: string) => void;
  duration: number;
  onDurationChange: (n: number) => void;
}

const SessionForm: React.FC<SessionFormProps> = ({
  topic,
  onTopicChange,
  courseSelect,
  date,
  onDateChange,
  duration,
  onDurationChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={topic}
      onChange={(e) => onTopicChange(e.target.value)}
      placeholder="tópico da sessão"
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
        <FieldLabel>duração (min)</FieldLabel>
        <TextInput
          type="number"
          value={duration}
          onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
  </div>
);

export default SessionForm;
