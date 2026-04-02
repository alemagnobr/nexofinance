import React, { useState } from 'react';
import { X, Play, Square, Timer, Coffee, BrainCircuit } from 'lucide-react';
import { useFocus } from '../contexts/FocusContext';

export const FocusTimerModal: React.FC = () => {
  const { isModalOpen, closeModal, isActive, timeLeft, totalTime, focusReason, startFocus, stopFocus } = useFocus();
  const [customMinutes, setCustomMinutes] = useState('25');
  const [reasonInput, setReasonInput] = useState('');

  if (!isModalOpen) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <BrainCircuit className="w-5 h-5" />
            <h3 className="font-bold">Modo Foco</h3>
          </div>
          <button 
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          
          {/* Timer Display */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            {/* Circular Progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                className="text-slate-100 dark:text-slate-800"
              />
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
                className="text-indigo-500 transition-all duration-1000 ease-linear"
              />
            </svg>
            
            <div className="text-center z-10">
              <span className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter tabular-nums">
                {isActive ? formatTime(timeLeft) : formatTime(parseInt(customMinutes) * 60 || 0)}
              </span>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
                {isActive ? 'Focando...' : 'Pronto'}
              </p>
            </div>
          </div>

          {/* Controls */}
          {!isActive ? (
            <div className="w-full space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setCustomMinutes('15')}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${customMinutes === '15' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                >
                  15 min
                </button>
                <button 
                  onClick={() => setCustomMinutes('25')}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${customMinutes === '25' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                >
                  25 min
                </button>
                <button 
                  onClick={() => setCustomMinutes('50')}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${customMinutes === '50' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                >
                  50 min
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <input 
                  type="number" 
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-center text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Minutos customizados"
                  min="1"
                  max="120"
                />
                <input 
                  type="text" 
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-center text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Motivo do foco (opcional)"
                  maxLength={50}
                />
              </div>

              <button 
                onClick={() => startFocus(parseInt(customMinutes) || 25, reasonInput)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/30"
              >
                <Play className="w-5 h-5 fill-current" /> Iniciar Foco
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {focusReason && (
                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">Focando em</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{focusReason}</p>
                </div>
              )}
              <button 
                onClick={stopFocus}
                className="w-full py-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Square className="w-5 h-5 fill-current" /> Parar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
