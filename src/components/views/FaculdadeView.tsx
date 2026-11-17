import React, { useMemo } from 'react';
import { Course } from '../../types';
import { CourseDetailView } from './CourseDetailView';
import {
  useDataClientApp,
  useDataClientCourses,
  useDataClientStudy,
} from '@/context/DataClientProvider';
import { useNavValue } from '@/context/shellNavContexts';
import { buildCalendarEntries, getTodaySchedule } from '../../lib/schedule';
import { useTermScope } from '../../lib/termScope';
import { addDaysKey, todayKeyLocal } from '../../lib/dateBR';
import HeroSection from './faculdade/HeroSection';
import WeekGrid from './faculdade/WeekGrid';
import DisciplinasGrid from './faculdade/DisciplinasGrid';
import WeekEventsList from './faculdade/WeekEventsList';

interface FaculdadeViewProps {
  /** Disciplina em foco (pilha `course`). Quando presente, renderiza o CourseDetailView. */
  course?: Course;
}

export const FaculdadeView: React.FC<FaculdadeViewProps> = ({ course }) => {
  const {
    profile,
    internshipLogs,
    academicTerms,
    tcc,
    thesisChapters,
    thesisMeetings,
    thesisTasks,
  } = useDataClientApp();
  const { courses, classes, exams, tasks } = useDataClientCourses();
  const { sessions } = useDataClientStudy();
  // Recorte do período (SPEC-005): a tela do "agora" só enxerga o semestre ativo.
  // `all` preserva a lista completa para o calendário e a busca.
  const { term, active, grade, archived, activeIds } = useTermScope(courses, academicTerms);
  const {
    openCourseDetail,
    openTccScreen,
    openWizard,
    openCalendar,
    openInternshipDiary,
    openStudy,
    openManageItem,
  } = useNavValue();

  const now = useMemo(() => new Date(), []);

  // Regras de Hooks: nenhum hook pode ficar depois do early return de
  // `course` abaixo.
  const weekEntries = useMemo(
    () =>
      buildCalendarEntries({
        courses,
        exams,
        tasks,
        thesis: tcc,
        chapters: thesisChapters,
        thesisTasks,
        meetings: thesisMeetings,
        internshipLogs,
        studySessions: sessions,
        from: todayKeyLocal(),
        to: addDaysKey(todayKeyLocal(), 14),
      })
        .filter(
          (e) =>
            e.kind === 'tarefa' || e.kind === 'prova' || e.kind === 'tcc' || e.kind === 'estagio',
        )
        .slice(0, 5),
    [
      courses,
      exams,
      tasks,
      tcc,
      thesisChapters,
      thesisTasks,
      thesisMeetings,
      internshipLogs,
      sessions,
    ],
  );

  // If a course detail is active, render CourseDetailView
  if (course) {
    return <CourseDetailView course={course} />;
  }

  // ---- dados reais derivados do estado ----
  // Provas/tarefas herdam o período pelo `courseId` da disciplina (§D3).
  const pendingExams = exams.filter(
    (e) => !e.completed && (!e.courseId || activeIds.has(e.courseId)),
  );
  const pendingTasks = tasks.filter(
    (t) => !t.completed && (!t.disciplineId || activeIds.has(t.disciplineId)),
  );

  const todaySchedule = getTodaySchedule(grade, now);

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1">
      {/* 1. HERO — semestre + resumo real */}
      <HeroSection
        semester={term?.ordinal ?? profile.semester}
        coursesCount={active.length}
        pendingExamsCount={pendingExams.length}
        pendingTasksCount={pendingTasks.length}
        hasClassesToday={todaySchedule.length > 0}
        onOpenCalendar={() => openCalendar()}
      />

      {/* 2. MINHA SEMANA — grade real da semana (seg → dom) */}
      <WeekGrid courses={grade} now={now} onOpenCourse={openCourseDetail} />

      {/* Desktop (≥ lg): grade 12 colunas — esquerda: sub-tabs · direita: semana */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* coluna esquerda */}
        <div className="lg:col-span-12 space-y-6">
          {/* Grade de disciplinas — única sub-tab da Faculdade (SPEC-M-032). */}
          <DisciplinasGrid
            courses={grade}
            classes={classes}
            exams={exams}
            onNewCourse={() => openWizard('course')}
            onOpenCourse={openCourseDetail}
          />
        </div>

        {/* coluna direita */}
        <div className="lg:col-span-5 space-y-6">
          <WeekEventsList
            entries={weekEntries}
            nav={{
              openCourseDetail,
              openTccScreen,
              openInternshipDiary,
              openStudy,
              openManageItem,
            }}
            exams={exams}
          />
        </div>
      </div>
    </div>
  );
};
