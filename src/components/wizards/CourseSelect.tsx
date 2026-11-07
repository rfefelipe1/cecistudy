import React from 'react';
<<<<<<< HEAD
import { VAZIO, CELEBRACAO, frase } from '@/lib/voice';
=======
import { VAZIO, CELEBRACAO, DICA, frase } from '@/lib/voice';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { useMobileApp } from '@/context/mobileApp';
import { Picker } from '../ui/Picker';

interface CourseSelectProps {
  value: string;
  onChange: (value: string) => void;
  /** Rótulo exibido acima do seletor. */
  label?: string;
  /** Rótulo/papel "opcional" adicionado ao label. */
  optional?: boolean;
  placeholder?: string;
  /** Oferece "sem vínculo" dentro da sheet (vínculo opcional). */
  clearable?: boolean;
  /** Mensagem do empty state quando não há matérias cadastradas. */
  emptyMessage?: string;
}

/**
 * Seletor de disciplina padronizado dos wizards: mesmo empty state carinhoso,
 * criação contextual de matéria e sheet única. Substitui os Picker de curso
 * repetidos pelos arquivos (antes cada wizard duplicava o bloco + handler).
 */
export const CourseSelect: React.FC<CourseSelectProps> = ({
  value,
  onChange,
  label = 'disciplina',
  optional = false,
  placeholder,
  clearable = false,
  emptyMessage = frase(VAZIO, 'semDisciplinas'),
}) => {
  const { courses, openEditCourse, showToast } = useMobileApp();

  const createCourseInline = () => {
    showToast(frase(CELEBRACAO, 'materiaPrecisaCadastro'));
    openEditCourse();
  };

  return (
    <Picker
      label={optional ? `${label} (opcional)` : label}
      value={value}
      onChange={onChange}
      options={courses.map((c) => ({ value: c.id, label: c.name }))}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
<<<<<<< HEAD
      createLabel="criar matéria agora"
=======
      createLabel={frase(DICA, 'criarMateriaAgora')}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      onCreate={createCourseInline}
      clearable={clearable ? true : undefined}
    />
  );
};
