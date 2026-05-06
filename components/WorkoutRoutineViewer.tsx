import React, { useState } from 'react';
import { WorkoutRoutine, RoutineExercise } from '../types';
import { ChevronLeft, Calendar as CalendarIcon, List, LayoutGrid, Edit2, TrendingUp, Plus, X } from 'lucide-react';

interface WorkoutRoutineViewerProps {
  routine: WorkoutRoutine;
  onBack: () => void;
  onEdit: () => void;
  onUpdateRoutine?: (routine: WorkoutRoutine) => void;
}

export const WorkoutRoutineViewer: React.FC<WorkoutRoutineViewerProps> = ({ routine, onBack, onEdit, onUpdateRoutine }) => {
  const [viewMode, setViewMode] = useState<'lista' | 'semanal'>('lista');
  const [selectedExercise, setSelectedExercise] = useState<{ dayId: string; ex: RoutineExercise } | null>(null);
  const [newLoad, setNewLoad] = useState('');
  const [newReps, setNewReps] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const handleAddProgression = () => {
    if (!selectedExercise || !onUpdateRoutine || !newLoad.trim()) return;
    
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      load: newLoad,
      reps: newReps,
      notes: newNotes,
    };

    const newRoutine = { ...routine };
    const dayIndex = newRoutine.days.findIndex(d => d.id === selectedExercise.dayId);
    if (dayIndex === -1) return;
    
    const exIndex = newRoutine.days[dayIndex].exercises.findIndex(e => e.id === selectedExercise.ex.id);
    if (exIndex === -1) return;

    const currentHistory = newRoutine.days[dayIndex].exercises[exIndex].loadHistory || [];
    
    newRoutine.days[dayIndex].exercises[exIndex] = {
      ...newRoutine.days[dayIndex].exercises[exIndex],
      currentLoad: newLoad,
      loadHistory: [newEntry, ...currentHistory]
    };

    onUpdateRoutine(newRoutine);
    setSelectedExercise({ dayId: selectedExercise.dayId, ex: newRoutine.days[dayIndex].exercises[exIndex] });
    setNewLoad('');
    setNewReps('');
    setNewNotes('');
  };

  const handleRemoveProgression = (histId: string) => {
    if (!selectedExercise || !onUpdateRoutine) return;
    
    const newRoutine = { ...routine };
    const dayIndex = newRoutine.days.findIndex(d => d.id === selectedExercise.dayId);
    if (dayIndex === -1) return;
    
    const exIndex = newRoutine.days[dayIndex].exercises.findIndex(e => e.id === selectedExercise.ex.id);
    if (exIndex === -1) return;

    const currentHistory = newRoutine.days[dayIndex].exercises[exIndex].loadHistory || [];
    const updatedHistory = currentHistory.filter(h => h.id !== histId);
    
    newRoutine.days[dayIndex].exercises[exIndex] = {
      ...newRoutine.days[dayIndex].exercises[exIndex],
      currentLoad: updatedHistory.length > 0 ? updatedHistory[0].load : '',
      loadHistory: updatedHistory,
    };

    onUpdateRoutine(newRoutine);
    setSelectedExercise({ dayId: selectedExercise.dayId, ex: newRoutine.days[dayIndex].exercises[exIndex] });
  };

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
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">{routine.description}</p>
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
                          <th className="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-center">Carga Alvo</th>
                          <th className="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {day.exercises.map((ex) => (
                          <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                              {ex.name}
                              {ex.progressionMethod && (
                                <span className="block text-[10px] text-indigo-500 font-medium mt-1">{ex.progressionMethod}</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center font-medium text-slate-600 dark:text-slate-300">{ex.sets}</td>
                            <td className="py-4 px-6 text-center text-indigo-600 dark:text-indigo-400 font-bold">{ex.reps}</td>
                            <td className="py-4 px-6 text-center text-slate-500">{ex.rest}</td>
                            <td className="py-4 px-6 text-slate-500 text-xs text-center">
                              {ex.technique && (
                                <span className="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded font-bold uppercase inline-block whitespace-nowrap">
                                  {ex.technique}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-slate-700 dark:text-slate-300">
                              {ex.currentLoad || '-'}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => setSelectedExercise({ dayId: day.id, ex })}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors inline-flex items-center justify-center"
                                title="Histórico de Progressão"
                              >
                                <TrendingUp className="w-4 h-4" />
                              </button>
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
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col md:max-h-[85vh] max-h-screen animate-scale-in">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">Histórico de Progressão</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedExercise.ex.name}</p>
              </div>
              <button 
                onClick={() => setSelectedExercise(null)} 
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto">
              <div className="mb-6 space-y-3 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Nova Evolução</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Carga (ex: 20kg)</label>
                    <input 
                      type="text" 
                      value={newLoad}
                      onChange={e => setNewLoad(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Reps executadas</label>
                    <input 
                      type="text"
                      value={newReps}
                      onChange={e => setNewReps(e.target.value)}
                      placeholder="Ex: 12"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Observações (opcional)</label>
                  <input 
                    type="text"
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    placeholder="Sentiu fácil? Amplitude máxima?"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <button 
                  onClick={handleAddProgression}
                  disabled={!newLoad.trim()}
                  className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Registrar Progressão
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Histórico ({selectedExercise.ex.loadHistory?.length || 0})
                </h4>
                
                <div className="space-y-3">
                  {(!selectedExercise.ex.loadHistory || selectedExercise.ex.loadHistory.length === 0) ? (
                    <p className="text-center text-sm text-slate-400 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      Nenhum registro ainda.
                    </p>
                  ) : (
                    selectedExercise.ex.loadHistory.map((h, i) => (
                      <div key={h.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between group">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-white">{h.load}</span>
                            {h.reps && <span className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-medium text-slate-600 dark:text-slate-300">{h.reps} reps</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                            {h.notes && (
                              <span className="text-[10px] text-slate-500 line-clamp-1 flex-1">
                                • {h.notes}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveProgression(h.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
