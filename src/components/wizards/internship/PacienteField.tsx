import React from 'react';
import { AlertCircle } from 'lucide-react';
import { TextInput } from '../wizardFields';
import { CeciChoicePill } from '../../ui/ceci';
import { formatPatientLabel } from '../../../lib/internshipCases';

interface PacienteFieldProps {
  patient: string;
  onPatientChange: (value: string) => void;
  onPatientSelect: (alvo: {
    key: string;
    label: string;
    case: { sessionNumber?: number; latestAge?: string; latestApproach?: string } | undefined;
    sessionNumber?: string;
    patientAge?: string;
    approach?: string;
  }) => void;
  existingPatients: { key: string; label: string; case: unknown }[];
  typedKey: string;
  duplicateCase: { patientKey: string; patientLabel: string } | undefined;
  looksFullName: boolean;
}

/** Campo de paciente com iniciais, detecção de nome completo e sugestão de casos existentes. */
export const PacienteField: React.FC<PacienteFieldProps> = ({
  patient,
  onPatientChange,
  onPatientSelect,
  existingPatients,
  typedKey,
  duplicateCase,
  looksFullName,
}) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor="internship-paciente-input"
        className="block text-xs font-medium text-ceci-secondary mb-1"
      >
        paciente (só iniciais, sem nome completo ♡)
      </label>
      <TextInput
        id="internship-paciente-input"
        value={patient}
        onChange={(e) => onPatientChange(e.target.value)}
        placeholder="ex: M. S."
        onBlur={() => onPatientChange(formatPatientLabel(patient))}
      />
      {existingPatients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[
            ...existingPatients.slice(0, 8).map((p) => ({ value: p.key, label: p.label })),
            { value: '__none__', label: '+ novo' },
          ].map((opt) => (
            <CeciChoicePill
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={typedKey === opt.value}
              onChange={(key) => {
                if (key === '__none__') return;
                const alvo = existingPatients.find((p) => p.key === key);
                if (!alvo) return;
                onPatientSelect({
                  key: alvo.key,
                  label: alvo.label,
                  case: undefined,
                  sessionNumber: undefined,
                  patientAge: undefined,
                  approach: undefined,
                });
              }}
            />
          ))}
        </div>
      )}
      {duplicateCase && duplicateCase.patientKey !== undefined && (
        <p className="text-[11px] text-status-warning-strong inline-flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden /> já existe “
          {duplicateCase.patientLabel}” — as duas vão virar o mesmo caso
        </p>
      )}
      {looksFullName && (
        <p className="text-[11px] text-status-warning-strong">
          isso parece um nome completo — iniciais protegem o paciente
        </p>
      )}
    </div>
  );
};
