import React, { useState } from 'react';
import { WorkoutRoutine, RoutineExercise } from '../types';
import { ChevronLeft, Calendar as CalendarIcon, List, LayoutGrid, Edit2, TrendingUp, Plus, X, Play } from 'lucide-react';

interface WorkoutRoutineViewerProps {
  routine: WorkoutRoutine;
  onBack: () => void;
  onEdit: () => void;
  onUpdateRoutine?: (routine: WorkoutRoutine) => void;
  onEditExercise?: (dayIndex: number, exIndex: number) => void;
  onPlayDay?: (dayIndex: number) => void;
}

export const WorkoutRoutineViewer: React.FC<WorkoutRoutineViewerProps> = ({ routine, onBack, onEdit, onUpdateRoutine, onEditExercise, onPlayDay }) => {
  const [viewMode, setViewMode] = useState<'lista' | 'semanal'>('lista');
  const [selectedExercise, setSelectedExercise] = useState<{ dayId: string; ex: RoutineExercise; setIndex: number } | null>(null);
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

    const setIndex = selectedExercise.setIndex;
    if (!newRoutine.days[dayIndex].exercises[exIndex].setsData || !newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex]) return;

    const currentHistory = newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex].loadHistory || [];
    
    newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex] = {
      ...newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex],
      load: newLoad,
      loadHistory: [newEntry, ...currentHistory]
    };
    
    // Fallback: also update the global load if it's the first set just for backwards compat display in some places
    if (setIndex === 0) {
      newRoutine.days[dayIndex].exercises[exIndex].currentLoad = newLoad;
    }

    onUpdateRoutine(newRoutine);
    setSelectedExercise({ dayId: selectedExercise.dayId, ex: newRoutine.days[dayIndex].exercises[exIndex], setIndex });
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

    const setIndex = selectedExercise.setIndex;
    if (!newRoutine.days[dayIndex].exercises[exIndex].setsData || !newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex]) return;

    const currentHistory = newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex].loadHistory || [];
    const updatedHistory = currentHistory.filter(h => h.id !== histId);
    
    newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex] = {
      ...newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex],
      load: updatedHistory.length > 0 ? updatedHistory[0].load : '',
      loadHistory: updatedHistory,
    };

    onUpdateRoutine(newRoutine);
    setSelectedExercise({ dayId: selectedExercise.dayId, ex: newRoutine.days[dayIndex].exercises[exIndex], setIndex });
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
          {routine.days.map((day, dayIndex) => (
            <div key={day.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-black text-lg text-slate-800 dark:text-white">{day.name}</h3>
                {onPlayDay && day.exercises.length > 0 && (
                  <button 
                    onClick={() => onPlayDay(dayIndex)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current" /> Começar
                  </button>
                )}
              </div>
              <div className="p-0">
                {day.exercises.length === 0 ? (
                  <p className="p-6 text-center text-slate-400">Nenhum exercício neste dia.</p>
                ) : (
                      <div className="flex flex-col">
                        {day.exercises.map((ex, exIndex) => (
                          <div 
                            key={ex.id} 
                            className={`flex flex-col lg:flex-row items-stretch lg:items-center p-5 lg:p-6 gap-4 lg:gap-8 ${
                              exIndex !== day.exercises.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''
                            } hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-colors`}
                          >
                            <div className="flex-[0_0_200px] min-w-0">
                              <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{ex.name}</h4>
                              {ex.setsData?.some(s => s.bisetExerciseName) && (
                                <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/20 inline-block px-2 py-0.5 rounded border border-amber-100 dark:border-amber-800/30 whitespace-nowrap">
                                  + Bi-sets: {Array.from(new Set(ex.setsData.map(s => s.bisetExerciseName).filter(Boolean))).join(', ')}
                                </div>
                              )}
                              {ex.progressionMethod && (
                                <span className="block text-[11px] text-indigo-500 font-bold mt-1.5 uppercase tracking-wide">{ex.progressionMethod}</span>
                              )}
                            </div>

                            <div className="flex-1 flex gap-2 lg:gap-3 overflow-x-auto pb-2 lg:pb-0 items-start lg:items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                              {ex.setsData ? ex.setsData.map((s, i) => (
                                <div key={i} className="group relative flex flex-col gap-1.5 items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-3 min-w-[5rem] lg:min-w-[6rem] shrink-0">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded w-full text-center">S{i+1}</div>
                                  <span className="font-black text-slate-700 dark:text-slate-200 text-lg sm:text-xl whitespace-nowrap">{s.reps || '-'}</span>
                                  {s.rest && <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded">{s.rest}</span>}
                                  
                                  {s.load && <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full mt-0.5 border border-indigo-100 dark:border-indigo-800/30 w-full text-center whitespace-nowrap truncate">{s.load}</span>}
                                  
                                  <button 
                                    onClick={() => setSelectedExercise({ dayId: day.id, ex, setIndex: i })} 
                                    className="absolute -top-2 -right-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 active:scale-95" 
                                    title="Progresso da Série"
                                  >
                                    <TrendingUp className="w-3.5 h-3.5" />
                                  </button>

                                  {s.technique && (
                                    <div className="flex flex-col items-center gap-0.5 mt-0.5 w-full">
                                      <span className="text-[9px] font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-800/30 uppercase w-full text-center truncate" title={s.technique}>
                                        {s.technique}
                                      </span>
                                      {s.technique.includes('Drop Set') && s.dropLoads && s.dropLoads.length > 0 && (
                                        <div className="flex flex-wrap items-center justify-center gap-0.5 mt-1">
                                          {s.dropLoads.filter(d => d).map((d, dI) => (
                                            <span key={dI} className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1 rounded">
                                              -{d}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {s.technique.includes('Bi-set') && s.bisetReps && (
                                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 w-full text-center px-1 py-0.5 rounded mt-0.5 border border-amber-100 dark:border-amber-800/30">
                                          +{s.bisetReps} {s.bisetLoad && `(${s.bisetLoad})`}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )) : (
                                <div className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl font-medium">
                                  {ex.sets} séries x {ex.reps} reps ({ex.rest})
                                </div>
                              )}
                            </div>

            <div className="flex-none flex items-center justify-end pl-2 gap-2">
                              {onEditExercise && (
                                <button 
                                  onClick={() => onEditExercise(dayIndex, exIndex)}
                                  className="p-3 text-slate-400 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-500 dark:hover:bg-slate-700/70 rounded-2xl transition-colors inline-flex items-center justify-center hover:scale-105 active:scale-95"
                                  title="Editar Exercício"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                              )}
                              <button 
                                onClick={() => setSelectedExercise({ dayId: day.id, ex, setIndex: 0 })}
                                className="p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-2xl transition-colors inline-flex items-center justify-center hover:scale-105 active:scale-95"
                                title="Histórico de Progressão (Visão Geral)"
                              >
                                <TrendingUp className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
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
      {selectedExercise && (() => {
        const setIndex = selectedExercise.setIndex;
        const setData = selectedExercise.ex.setsData?.[setIndex];
        const loadHistory = setData?.loadHistory || selectedExercise.ex.loadHistory || []; // Fallback para history na raiz 

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col md:max-h-[85vh] max-h-screen animate-scale-in">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">Histórico de Progressão</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedExercise.ex.name} - Série {setIndex + 1}</p>
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
                  Histórico ({loadHistory.length})
                </h4>
                
                <div className="space-y-3">
                  {loadHistory.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      Nenhum registro ainda.
                    </p>
                  ) : (
                    loadHistory.map((h, i) => (
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
        );
      })()}
    </div>
  );
};
