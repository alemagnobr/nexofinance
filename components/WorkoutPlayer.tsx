import React, { useState, useEffect, useRef } from 'react';
import { WorkoutRoutine, RoutineDay, RoutineExercise } from '../types';
import { ChevronLeft, Play, Pause, Square, Check, RotateCcw, FastForward, Edit2, TrendingUp, Plus, Minus, X } from 'lucide-react';
import { WorkoutRoutineEditor } from './WorkoutRoutineEditor';

interface WorkoutPlayerProps {
  routine: WorkoutRoutine;
  dayIndex: number;
  onBack: () => void;
  onUpdateRoutine: (routine: WorkoutRoutine) => void;
  onEditExercise: (dayIndex: number, exIndex: number) => void;
}

export const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ routine, dayIndex, onBack, onUpdateRoutine, onEditExercise }) => {
  const day = routine.days[dayIndex];
  
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  
  // Timer states
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [timerDuration, setTimerDuration] = useState(60); // default 60s
  const [isResting, setIsResting] = useState(false);

  // Quick edit state (similar to viewer)
  const [selectedExercise, setSelectedExercise] = useState<{ dayId: string; ex: RoutineExercise; setIndex: number } | null>(null);
  const [newLoad, setNewLoad] = useState('');
  const [newReps, setNewReps] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const currentExercise = day.exercises[currentExIndex];
  const totalSets = currentExercise?.setsData ? currentExercise.setsData.length : parseInt(currentExercise?.sets || '0', 10) || 0;
  const currentSetData = currentExercise?.setsData?.[currentSetIndex];

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      setIsResting(false);
      // Play a sound or notification here ideally
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Parse rest time string to seconds (e.g. "60s", "1m", "1m 30s")
  const parseRestTime = (restStr?: string): number => {
    if (!restStr) return 60;
    let totalSecs = 0;
    const minMatch = restStr.match(/(\d+)\s*m/i);
    const secMatch = restStr.match(/(\d+)\s*s/i);
    if (minMatch) totalSecs += parseInt(minMatch[1], 10) * 60;
    if (secMatch) totalSecs += parseInt(secMatch[1], 10);
    return totalSecs > 0 ? totalSecs : 60; // fallback
  };

  const startRestTimer = (durationOverride?: number) => {
    let duration = timerDuration;
    if (durationOverride) {
      duration = durationOverride;
    } else if (currentSetData?.rest) {
      duration = parseRestTime(currentSetData.rest);
    } else if (currentExercise?.rest) {
      duration = parseRestTime(currentExercise.rest);
    }
    setTimerDuration(duration);
    setTimeLeft(duration);
    setIsResting(true);
    setTimerActive(true);
  };

  const handleFinishSet = () => {
    setTimerActive(false);
    
    // Check if there are more sets in this exercise
    if (currentSetIndex < totalSets - 1) {
      setCurrentSetIndex(prev => prev + 1);
      startRestTimer();
    } else {
      // Move to next exercise if available
      if (currentExIndex < day.exercises.length - 1) {
        setCurrentExIndex(prev => prev + 1);
        setCurrentSetIndex(0);
        startRestTimer(120); // Longer rest between exercises usually (default 2 mins)
      } else {
        // Workout finished!
        setIsResting(false);
        onBack();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddProgression = () => {
    if (!newLoad.trim() || !selectedExercise || !onUpdateRoutine) return;

    const newRoutine = { ...routine };
    const exIdx = newRoutine.days[dayIndex].exercises.findIndex(ex => ex.id === selectedExercise.ex.id);
    if (exIdx === -1) return;

    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      load: newLoad,
      reps: newReps,
      notes: newNotes,
    };

    const sIndex = selectedExercise.setIndex;
    if (sIndex !== undefined && newRoutine.days[dayIndex].exercises[exIdx].setsData) {
      const setsData = newRoutine.days[dayIndex].exercises[exIdx].setsData;
      if (setsData && setsData[sIndex]) {
        const currentHistory = setsData[sIndex].loadHistory || [];
        setsData[sIndex] = {
          ...setsData[sIndex],
          load: newLoad,
          loadHistory: [newEntry, ...currentHistory],
        };
        if (sIndex === 0) {
          newRoutine.days[dayIndex].exercises[exIdx].currentLoad = newLoad;
        }
      }
    }
    
    onUpdateRoutine(newRoutine);
    setSelectedExercise({ ...selectedExercise, ex: newRoutine.days[dayIndex].exercises[exIdx] });
    setNewLoad('');
    setNewReps('');
    setNewNotes('');
  };

  const handleRemoveProgression = (entryId: string) => {
    if (!selectedExercise || !onUpdateRoutine) return;
    const newRoutine = { ...routine };
    const exIdx = newRoutine.days[dayIndex].exercises.findIndex(ex => ex.id === selectedExercise.ex.id);
    if (exIdx === -1) return;
    
    const setIndex = selectedExercise.setIndex;
    if (!newRoutine.days[dayIndex].exercises[exIdx].setsData || !newRoutine.days[dayIndex].exercises[exIdx].setsData[setIndex]) return;

    const currentHistory = newRoutine.days[dayIndex].exercises[exIdx].setsData[setIndex].loadHistory || [];
    newRoutine.days[dayIndex].exercises[exIdx].setsData[setIndex].loadHistory = currentHistory.filter((h: any) => h.id !== entryId);
    
    onUpdateRoutine(newRoutine);
    setSelectedExercise({ ...selectedExercise, ex: newRoutine.days[dayIndex].exercises[exIdx] });
  };

  if (!currentExercise) return null;

  return (
    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 z-40 flex flex-col pt-4 overflow-hidden animate-fade-in pb-safe">
      <div className="px-4 flex items-center justify-between mb-4 w-full max-w-3xl mx-auto">
        <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1 mx-4">
          <h2 className="font-black text-lg text-slate-800 dark:text-white line-clamp-1">{day.name}</h2>
          <p className="text-xs font-bold text-indigo-500 uppercase">Em execução</p>
        </div>
        <div className="w-9"></div> {/* spacer */}
      </div>

      {/* Progress Bar */}
      <div className="px-4 mb-6 w-full max-w-3xl mx-auto">
        <div className="flex gap-1 mb-2">
          {day.exercises.map((ex, idx) => (
            <div 
              key={ex.id} 
              className={`h-2 flex-1 rounded-full ${idx < currentExIndex ? 'bg-indigo-500' : idx === currentExIndex ? 'bg-indigo-300 dark:bg-indigo-600 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}
            />
          ))}
        </div>
        <div className="text-right text-xs font-bold text-slate-400">
          Exercício {currentExIndex + 1} de {day.exercises.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 w-full max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 relative mb-6 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight pr-8">{currentExercise.name}</h3>
          </div>

          {currentExercise.notes && (
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {currentExercise.notes}
            </p>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Séries</span>
              <span className="text-sm font-bold text-indigo-500">{currentSetIndex + 1} / {totalSets}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(currentExercise.setsData || []).map((set, idx) => {
                const isActive = idx === currentSetIndex && !isResting;
                const isCompleted = idx < currentSetIndex;
                const isNext = idx === currentSetIndex && isResting; // If resting before this set
                
                return (
                  <button 
                    key={set.id}
                    onClick={() => {
                      setCurrentSetIndex(idx);
                      setIsResting(false);
                      setTimerActive(false);
                    }}
                    className={`flex-1 min-w-[70px] max-w-[100px] flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      isActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 
                      isCompleted ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 
                      'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                    }`}
                  >
                    <span className={`text-xs font-black ${isActive ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : set.reps || '-'}
                    </span>
                    {(set.load || currentExercise.currentLoad) && (
                      <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-300 dark:text-slate-500'} truncate w-full text-center`}>
                        {set.load || currentExercise.currentLoad}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {currentSetData && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="text-3xl font-black text-slate-800 dark:text-white">
                  {currentSetData.reps || '-'}
                </span>
                <span className="text-slate-400 font-medium">REPS</span>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-center gap-4 w-full">
                  <div className="flex-1 max-w-[150px] relative group">
                     <button 
                        onClick={() => setSelectedExercise({ dayId: day.id, ex: currentExercise, setIndex: currentSetIndex })}
                        className="w-full flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors"
                      >
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Carga (kg)</span>
                       <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{currentSetData.load || currentExercise.currentLoad || '-'}</span>
                          <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                       </div>
                     </button>
                  </div>
                  
                  {currentSetData.rest && (
                    <div className="flex-1 max-w-[150px] p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Descanso</span>
                      <span className="text-xl font-black text-slate-600 dark:text-slate-300">{currentSetData.rest}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setSelectedExercise({ dayId: day.id, ex: currentExercise, setIndex: currentSetIndex })}
                  className="w-full max-w-[316px] py-3 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-2xl transition-colors border border-dashed border-indigo-200 dark:border-indigo-800/50 mb-2 mt-2"
                >
                  <TrendingUp className="w-4 h-4" /> Histórico e Progressão da Série
                </button>
              </div>
              
              {currentSetData.technique && (
                 <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-sm font-bold flex flex-wrap items-center justify-center gap-2 text-center">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>Técnicas: {currentSetData.technique}</span>
                 </div>
              )}

              {/* Bi-set Block */}
              {currentSetData.technique?.includes('Bi-set') && currentSetData.bisetExerciseName && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-800/40 animate-scale-in">
                   <div className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      Em Seguida (Bi-set)
                   </div>
                   <div className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                      {currentSetData.bisetExerciseName}
                   </div>
                   <div className="flex justify-center gap-6">
                     <div className="flex flex-col items-center">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reps</span>
                       <span className="text-lg font-black text-amber-600 dark:text-amber-400">{currentSetData.bisetReps || '-'}</span>
                     </div>
                     {currentSetData.bisetLoad && (
                       <div className="flex flex-col items-center">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Carga (kg)</span>
                         <span className="text-lg font-black text-amber-600 dark:text-amber-400">{currentSetData.bisetLoad}</span>
                       </div>
                     )}
                   </div>
                </div>
              )}

              {/* Drop Set Block */}
              {currentSetData.technique?.includes('Drop Set') && currentSetData.dropLoads && currentSetData.dropLoads.length > 0 && (
                <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border-2 border-rose-200 dark:border-rose-800/40 animate-scale-in">
                   <div className="text-xs font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      Reduções (Drop Set)
                   </div>
                   <div className="flex flex-wrap justify-center gap-3">
                     {currentSetData.dropLoads.map((load: string, idx: number) => (
                       <div key={idx} className="bg-white dark:bg-slate-800/50 min-w-[70px] p-2 rounded-xl border border-rose-100 dark:border-rose-800/30 flex flex-col items-center">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Drop {idx + 1}</span>
                         <span className="text-lg font-black text-rose-600 dark:text-rose-400">{load || '?'}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timer Panel */}
        {isResting && (
          <div className="bg-slate-800 dark:bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border-4 border-indigo-500 animate-scale-in text-center flex flex-col items-center relative overflow-hidden">
             
            <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl ${timerActive && 'animate-pulse'}`} />
            <div className={`absolute -left-10 -top-10 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl ${timerActive && 'animate-pulse'}`} />
             
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-4">Descanso</h4>
            <div className={`text-6xl font-black tabular-nums tracking-tighter mb-6 ${timeLeft <= 5 && timeLeft > 0 ? 'text-rose-500 animate-pulse' : ''}`}>
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex items-center gap-4 w-full">
               <button 
                 onClick={() => setTimeLeft(prev => Math.max(0, prev - 15))}
                 className="flex-shrink-0 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-2xl transition-colors"
               >
                 <Minus className="w-6 h-6 text-slate-400" />
               </button>
               
               {timerActive ? (
                 <button 
                    onClick={() => setTimerActive(false)}
                    className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Pause className="w-5 h-5 fill-current" /> Pausar
                  </button>
               ) : (
                  <button 
                    onClick={() => {
                        if(timeLeft === 0) {
                            setTimeLeft(timerDuration);
                        }
                        setTimerActive(true);
                    }}
                    className="flex-1 py-3 px-6 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/30"
                  >
                    <Play className="w-5 h-5 fill-current" /> {timeLeft === 0 ? 'Reiniciar' : 'Retomar'}
                  </button>
               )}
               
               <button 
                 onClick={() => setTimeLeft(prev => prev + 15)}
                 className="flex-shrink-0 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-2xl transition-colors"
               >
                 <Plus className="w-6 h-6 text-slate-400" />
               </button>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-4">
              {currentSetIndex > 0 && (
                <button
                  onClick={() => setSelectedExercise({ dayId: day.id, ex: currentExercise, setIndex: currentSetIndex - 1 })}
                  className="flex items-center gap-2 text-sm font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-xl transition-colors w-full justify-center max-w-[200px]"
                >
                  <Edit2 className="w-4 h-4" /> Registrar Carga Feita
                </button>
              )}
              <button 
                onClick={() => {
                  setTimerActive(false);
                  setIsResting(false);
                }}
                className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Pular descanso
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-900 dark:via-slate-900 pb-safe flex justify-center">
        <div className="w-full max-w-3xl">
          {!isResting && (
            <button 
              onClick={handleFinishSet}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3"
            >
              <Check className="w-6 h-6" />
              Concluir Série {currentSetIndex + 1}
            </button>
          )}
        </div>
      </div>

      {/* Edit Load Modal */}
      {selectedExercise && (() => {
         const setIndex = selectedExercise.setIndex;
         const setData = selectedExercise.ex.setsData?.[setIndex];
         const loadHistory = setData?.loadHistory || selectedExercise.ex.loadHistory || [];

         return (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col md:max-h-[85vh] max-h-[90vh] animate-scale-in">
             <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 sticky top-0 z-10 shrink-0">
               <div>
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">Histórico da Série</h3>
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
                   className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
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
                       Nenhum registro ainda para esta série.
                     </p>
                   ) : (
                     loadHistory.map((h: any) => (
                       <div key={h.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between group">
                         <div>
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-slate-800 dark:text-white">{h.load}</span>
                             {h.reps && <span className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">{h.reps} reps</span>}
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
