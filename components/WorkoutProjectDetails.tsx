import React, { useState } from 'react';
import { ChevronLeft, Target, Calendar as CalendarIcon, Activity, Plus, Edit2, Trash2 } from 'lucide-react';
import { WorkoutProject, WorkoutRoutine, RoutineDay, RoutineExercise } from '../types';
import { WorkoutRoutineEditor } from './WorkoutRoutineEditor';
import { WorkoutRoutineViewer } from './WorkoutRoutineViewer';

interface WorkoutProjectDetailsProps {
  project: WorkoutProject;
  onBack: () => void;
  data: any;
  actions: any;
}

export const WorkoutProjectDetails: React.FC<WorkoutProjectDetailsProps> = ({ project, onBack, data, actions }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'routines'>('info');
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null | 'new'>(null);
  const [viewingRoutine, setViewingRoutine] = useState<WorkoutRoutine | null>(null);

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
      actions.updateWorkoutRoutine?.(editingRoutine.id, routineData);
    }
    setEditingRoutine(null);
  };

  if (viewingRoutine) {
    // If the routine was updated, we want to view the updated version next render
    const upToDateRoutine = projectRoutines.find((r: WorkoutRoutine) => r.id === viewingRoutine.id) || viewingRoutine;
    if (editingRoutine) {
      return (
        <WorkoutRoutineEditor 
          routine={upToDateRoutine} 
          projectId={project.id} 
          onSave={handleSaveRoutine} 
          onCancel={() => setEditingRoutine(null)} 
        />
      );
    }
    return (
      <WorkoutRoutineViewer 
        routine={upToDateRoutine} 
        onBack={() => setViewingRoutine(null)} 
        onEdit={() => setEditingRoutine(upToDateRoutine)} 
      />
    );
  }

  if (editingRoutine === 'new') {
    return (
      <WorkoutRoutineEditor 
        routine={null} 
        projectId={project.id} 
        onSave={handleSaveRoutine} 
        onCancel={() => setEditingRoutine(null)} 
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
      </div>

      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" /> Objetivo Principal
            </h3>
            <p className="text-lg font-semibold text-slate-800 dark:text-white">{project.objective}</p>
            {project.description && (
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">{project.description}</p>
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
