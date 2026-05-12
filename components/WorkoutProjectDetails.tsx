import React, { useState } from 'react';
import { ChevronLeft, Target, Calendar as CalendarIcon, Activity, Plus, Edit2, Trash2 } from 'lucide-react';
import { WorkoutProject, WorkoutRoutine, RoutineDay, RoutineExercise } from '../types';
import { WorkoutRoutineEditor } from './WorkoutRoutineEditor';
import { WorkoutRoutineViewer } from './WorkoutRoutineViewer';
import { WorkoutPlayer } from './WorkoutPlayer';

interface WorkoutProjectDetailsProps {
  project: WorkoutProject;
  onBack: () => void;
  data: any;
  actions: any;
}

export const WorkoutProjectDetails: React.FC<WorkoutProjectDetailsProps> = ({ project, onBack, data, actions }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'routines' | 'dietas'>('info');
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null | 'new'>(null);
  const [viewingRoutine, setViewingRoutine] = useState<WorkoutRoutine | null>(null);
  const [playingRoutineDay, setPlayingRoutineDay] = useState<{ routineId: string; dayIndex: number } | null>(null);
  const [editingExercisePointer, setEditingExercisePointer] = useState<{ dayIndex: number, exIndex: number } | null>(null);

  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [objectiveInput, setObjectiveInput] = useState(project.objective);
  const [descriptionInput, setDescriptionInput] = useState(project.description || '');

  const statusColors = {
    'Planejado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    'Em andamento': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
    'Pausado': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    'Finalizado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  };

  const priorityColors = {
    'Alta': 'text-rose-500',
    'Média': 'text-amber-500',
    'Baixa': 'text-emerald-500',
  };

  const projectRoutines = (data.workoutRoutines || []).filter(
    (r: WorkoutRoutine) => r.projectId === project.id
  );

  const handleSaveRoutine = (routineData: any) => {
    if (editingRoutine === 'new') {
      actions.addWorkoutRoutine?.(routineData);
    } else if (editingRoutine) {
      actions.updateWorkoutRoutine?.(editingRoutine.id || routineData.id, routineData);
    }
    setEditingRoutine(null);
    setEditingExercisePointer(null);
  };

  if (viewingRoutine) {
    // If the routine was updated, we want to view the updated version next render
    const upToDateRoutine = projectRoutines.find((r: WorkoutRoutine) => r.id === viewingRoutine.id) || viewingRoutine;
    if (playingRoutineDay) {
      return (
        <>
          <WorkoutPlayer 
            routine={upToDateRoutine}
            dayIndex={playingRoutineDay.dayIndex}
            onBack={() => setPlayingRoutineDay(null)}
            onUpdateRoutine={(r: WorkoutRoutine) => {
              actions.updateWorkoutRoutine?.(r.id, r);
            }}
            onEditExercise={(dayIndex, exIndex) => {
              setEditingExercisePointer({ dayIndex, exIndex });
              setEditingRoutine(upToDateRoutine);
            }}
          />
          {editingRoutine && editingExercisePointer && (
            <div className="fixed inset-0 z-[60]">
              <WorkoutRoutineEditor 
                routine={upToDateRoutine} 
                projectId={project.id} 
                onSave={handleSaveRoutine} 
                onCancel={() => {
                  setEditingRoutine(null);
                  setEditingExercisePointer(null);
                }} 
                initialEditingEx={editingExercisePointer}
                isQuickEdit={!!editingExercisePointer}
              />
            </div>
          )}
        </>
      );
    }
    if (editingRoutine && editingExercisePointer) {
      return (
        <WorkoutRoutineEditor 
          routine={upToDateRoutine} 
          projectId={project.id} 
          onSave={handleSaveRoutine} 
          onCancel={() => {
            setEditingRoutine(null);
            setEditingExercisePointer(null);
          }} 
          initialEditingEx={editingExercisePointer}
          isQuickEdit={!!editingExercisePointer}
        />
      );
    }
    if (editingRoutine) {
      return (
        <WorkoutRoutineEditor 
          routine={upToDateRoutine} 
          projectId={project.id} 
          onSave={handleSaveRoutine} 
          onCancel={() => {
            setEditingRoutine(null);
            setEditingExercisePointer(null);
          }} 
          initialEditingEx={editingExercisePointer}
          isQuickEdit={!!editingExercisePointer}
        />
      );
    }
    return (
      <WorkoutRoutineViewer 
        routine={upToDateRoutine} 
        onBack={() => setViewingRoutine(null)} 
        onEdit={() => setEditingRoutine(upToDateRoutine)} 
        onUpdateRoutine={(r: WorkoutRoutine) => {
          actions.updateWorkoutRoutine?.(r.id, r);
        }}
        onEditExercise={(dayIndex, exIndex) => {
          setEditingExercisePointer({ dayIndex, exIndex });
          setEditingRoutine(upToDateRoutine);
        }}
        onPlayDay={(dayIndex) => setPlayingRoutineDay({ routineId: upToDateRoutine.id, dayIndex })}
      />
    );
  }

  if (editingRoutine === 'new') {
    return (
      <WorkoutRoutineEditor 
        routine={null} 
        projectId={project.id} 
        onSave={handleSaveRoutine} 
        onCancel={() => {
          setEditingRoutine(null);
          setEditingExercisePointer(null);
        }} 
      />
    );
  }

  return (
    <div className="animate-fade-in relative pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {project.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[project.status]}`}>
              {project.status}
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${priorityColors[project.priority]}`}>
              <Activity className="w-3 h-3" /> {project.priority} Prio
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-px">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'info' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Informações
        </button>
        <button
          onClick={() => setActiveTab('routines')}
          className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'routines' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Fichas de Treino
        </button>
        <button
          onClick={() => setActiveTab('dietas')}
          className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'dietas' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Dietas
        </button>
      </div>

      {activeTab === 'dietas' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Acompanhamento de dieta por projeto será desenvolvido em breve.
          </p>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                <Target className="w-4 h-4" /> Objetivo Principal
              </h3>
              {!isEditingObjective && (
                 <button onClick={() => {
                   setObjectiveInput(project.objective);
                   setDescriptionInput(project.description || '');
                   setIsEditingObjective(true);
                 }} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                   <Edit2 className="w-4 h-4" />
                 </button>
              )}
            </div>
            
            {isEditingObjective ? (
              <div className="space-y-3">
                <input 
                  type="text"
                  value={objectiveInput}
                  onChange={e => setObjectiveInput(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:border-indigo-500 font-semibold"
                  placeholder="Seu objetivo principal"
                />
                <textarea 
                  value={descriptionInput}
                  onChange={e => setDescriptionInput(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:border-indigo-500 text-sm"
                  placeholder="Descrição ou detalhes (opcional)"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditingObjective(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700 px-3 py-1">Cancelar</button>
                  <button onClick={() => {
                    if (actions.updateWorkoutProject && objectiveInput.trim()) {
                      actions.updateWorkoutProject(project.id, { 
                        objective: objectiveInput, 
                        description: descriptionInput 
                      });
                    }
                    setIsEditingObjective(false);
                  }} className="text-sm font-bold bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700">Salvar</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-slate-800 dark:text-white">{project.objective}</p>
                {project.description && (
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm whitespace-pre-wrap">{project.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'routines' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              Fichas Vinculadas
            </h3>
            <button onClick={() => setEditingRoutine('new')} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              <Plus className="w-4 h-4" /> Nova Ficha
            </button>
          </div>

          {projectRoutines.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma ficha de treino cadastrada para este projeto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectRoutines.map((routine: WorkoutRoutine) => (
                <div 
                  key={routine.id} 
                  onClick={() => setViewingRoutine(routine)}
                  className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
                >
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); actions.deleteWorkoutRoutine?.(routine.id); }}
                      className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-lg pr-12">{routine.name}</h4>
                  {routine.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{routine.description}</p>}
                  <div className="mt-4 text-xs font-bold text-slate-400 uppercase">
                    {routine.days.length} dias na rotina
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
