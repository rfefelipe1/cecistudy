// Perfil — "eu construí": o ritmo em quatro sinais (SPEC-013 D3).
//
// Substitui o grid de 11 tiles (`PerfilView.tsx:257-339`), que exigia leitura e
// comparação para responder o que a tela deveria responder de imediato. Ficam
// quatro métricas acionáveis; o resto vive nos módulos específicos (Estágio, TCC,
// Estudos, Faculdade). Sem nada registrado, o bloco convida em vez de mostrar `0`.
import React from 'react';
import { BookOpen, CheckCircle2, ClipboardList, Clock } from 'lucide-react';
import type { ProfilePulse } from '../../../lib/profileViewModel';
import PulseMetric from './PulseMetric';
<<<<<<< HEAD
=======
import { frase, DICA } from '../../../lib/voice';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

interface ProgressPulseProps {
  pulse: ProfilePulse;
  onOpenSessions: () => void;
  onOpenReadings: () => void;
  onOpenTasks: () => void;
  onOpenExams: () => void;
}

const ProgressPulse: React.FC<ProgressPulseProps> = ({
  pulse,
  onOpenSessions,
  onOpenReadings,
  onOpenTasks,
  onOpenExams,
}) => {
  const isEmpty =
    pulse.studyTimeMinutes === 0 &&
    pulse.pagesRead === 0 &&
    pulse.tasksTotal === 0 &&
    pulse.examsPending === 0;

  return (
    <section
      aria-labelledby="perfil-ritmo-titulo"
<<<<<<< HEAD
      className="rounded-3xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4"
=======
      className="space-y-4"
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    >
      <div>
        <h2 id="perfil-ritmo-titulo" className="font-display font-bold text-xl text-ceci-primary">
          seu ritmo
        </h2>
        <p className="text-xs text-ceci-secondary">o que você já construiu, em quatro toques ♡</p>
      </div>

      {isEmpty ? (
        <p className="rounded-2xl bg-surface-muted border border-ceci-border-subtle px-4 py-5 text-xs text-ceci-secondary text-center">
          ainda não há registros por aqui — comece anotando uma sessão de estudo e este cantinho
          começa a contar a sua história ♡
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <PulseMetric
            icon={<Clock className="w-4 h-4" />}
            label="estudadas"
            value={pulse.studyTimeLabel}
<<<<<<< HEAD
            ariaLabel={`${pulse.studyTimeLabel} estudados. abrir sessões de estudo.`}
=======
            ariaLabel={frase(DICA, 'pulseStudyTime', { label: pulse.studyTimeLabel })}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
            onClick={onOpenSessions}
          />
          <PulseMetric
            icon={<BookOpen className="w-4 h-4" />}
            label="páginas lidas"
            value={pulse.pagesRead}
<<<<<<< HEAD
            ariaLabel={`${pulse.pagesRead} páginas lidas. abrir leituras.`}
=======
            ariaLabel={frase(DICA, 'pulsePagesRead', { n: pulse.pagesRead })}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
            onClick={onOpenReadings}
          />
          <PulseMetric
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="tarefas concluídas"
            value={`${pulse.tasksCompleted}/${pulse.tasksTotal}`}
<<<<<<< HEAD
            ariaLabel={`${pulse.tasksCompleted} de ${pulse.tasksTotal} tarefas concluídas. abrir tarefas.`}
=======
            ariaLabel={frase(DICA, 'pulseTasksCompleted', { n: pulse.tasksCompleted, total: pulse.tasksTotal })}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
            onClick={onOpenTasks}
          />
          <PulseMetric
            icon={<ClipboardList className="w-4 h-4" />}
            label="provas pendentes"
            value={pulse.examsPending}
<<<<<<< HEAD
            ariaLabel={`${pulse.examsPending} provas pendentes. abrir avaliações.`}
=======
            ariaLabel={frase(DICA, 'pulseExamsPending', { n: pulse.examsPending })}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
            onClick={onOpenExams}
            tone={pulse.examsPending > 0 ? 'attention' : 'default'}
          />
        </div>
      )}
    </section>
  );
};

export default ProgressPulse;
