// Wizard "transformar nota" — formulário de tarefa (MOD-001 / B.5).
import React from 'react';
import type { ReactNode } from 'react';
import type { Task } from '../../../types';
import { ChoiceCardGrid } from '../../ui/ChoiceCardGrid';
<<<<<<< HEAD
import { DateInput, FieldLabel, TextInput } from '../wizardFields';
=======
import { FieldLabel, TextInput } from '../wizardFields';
import { CeciDatePicker } from '../../ui/ceci';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { PRIORITIES, TASK_CATEGORIES } from './constants';

interface TaskFormProps {
  value: string;
  onChange: (v: string) => void;
  category: Task['category'];
  onCategoryChange: (v: Task['category']) => void;
  priority: Task['priority'];
  onPriorityChange: (v: Task['priority']) => void;
  courseSelect: ReactNode;
  dueDate: string;
  onDueDateChange: (d: string) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  value,
  onChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  courseSelect,
  dueDate,
  onDueDateChange,
}) => (
  <div className="space-y-4">
    <TextInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="título da tarefa"
      autoFocus
    />
    <ChoiceCardGrid
      label="categoria"
      options={TASK_CATEGORIES}
      value={category}
      onChange={onCategoryChange}
    />
    <ChoiceCardGrid
      label="prioridade"
      options={PRIORITIES}
      value={priority}
      onChange={onPriorityChange}
    />
    {courseSelect}
    <div>
      <FieldLabel>prazo</FieldLabel>
<<<<<<< HEAD
      <DateInput value={dueDate} onChange={(e) => onDueDateChange(e.target.value)} />
=======
      <CeciDatePicker value={dueDate ?? null} onChange={onDueDateChange} />
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    </div>
  </div>
);

export default TaskForm;
