import React, { useState } from 'react';
import { WorkoutRoutine } from '../types';
import { ChevronLeft, Calendar as CalendarIcon, List, LayoutGrid, Edit2 } from 'lucide-react';

interface WorkoutRoutineViewerProps {
  routine: WorkoutRoutine;
  onBack: () => void;
  onEdit: () => void;
}

export const WorkoutRoutineViewer: React.FC<WorkoutRoutineViewerProps> = ({ routine, onBack, onEdit }) => {
  const [viewMode, setViewMode] = useState<'lista' | 'semanal'>('lista');

  return (
    <div className="animate-fade-in relative pb-32">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
              {routine.name}
            </h2>
            {routine.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{routine.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode('lista')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'lista' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visão em Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('semanal')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'semanal' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visão Semanal"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          
          <button onClick={onEdit} className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === 'lista' ? (
        <div className="space-y-8">
          {routine.days.map((day) => (
            <div key={day.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-black text-lg text-slate-800 dark:text-white">{day.name}</h3>
              </div>
              <div className="p-0">
                {day.exercises.length === 0 ? (
                  <p className="p-6 text-center text-slate-400">Nenhum exercício neste dia.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Exercício</th>
                          <th className="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-center">Séries</th>
                          <th className="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-center">Reps</th>
                          <th className="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-center">Descanso</th>
                          <th className="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Técnica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {day.exercises.map((ex) => (
                          <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">{ex.name}</td>
                            <td className="py-4 px-6 text-center font-medium text-slate-600 dark:text-slate-300">{ex.sets}</td>
                            <td className="py-4 px-6 text-center text-indigo-600 dark:text-indigo-400 font-bold">{ex.reps}</td>
                            <td className="py-4 px-6 text-center text-slate-500">{ex.rest}</td>
                            <td className="py-4 px-6 text-slate-500 text-xs">
                              {ex.technique && (
                                <span className="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded font-bold uppercase">
                                  {ex.technique}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <CalendarIcon className="w-16 h-16 text-indigo-200 dark:text-indigo-900 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Visão Calendário/Semanal em Desenvolvimento</h3>
          <p className="text-slate-500 max-w-md">
            Aqui você visualizará sua ficha de treino distribuída ao longo da semana ou em um formato de calendário mensal interativo, com logs de execução.
          </p>
        </div>
      )}
    </div>
  );
};
