import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { Target, Plus, Trash2, Edit2, CheckCircle2, Circle, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface HabitTrackerProps {
  habits: Habit[];
  onAdd: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates'>) => void;
  onUpdate: (id: string, updates: Partial<Habit>) => void;
  onDelete: (id: string) => void;
  onToggleDate: (id: string, dateStr: string) => void;
  privacyMode: boolean;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'
];

const ICONS = ['🎯', '💧', '🏃', '📚', '🧘', '🥗', '💻', '🎸', '🎨', '✍️', '💸', '🧹'];

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits, onAdd, onUpdate, onDelete, onToggleDate, privacyMode
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '🎯', color: '#3b82f6' });
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toISOString().split('T')[0];
    });
  }, [currentDate]);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', icon: '🎯', color: '#3b82f6' });
  };

  const startEdit = (habit: Habit) => {
    setFormData({ name: habit.name, icon: habit.icon, color: habit.color });
    setEditingId(habit.id);
    setIsAdding(true);
  };

  const calculateStreak = (habit: Habit) => {
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      if (habit.completedDates.includes(dateStr)) {
        streak++;
      } else if (i === 0) {
        // If today is missed, check yesterday to keep streak alive
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-500" />
            Rastreador de Hábitos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Construa rotinas e acompanhe seu progresso diário.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', icon: '🎯', color: '#3b82f6' });
            setIsAdding(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Novo Hábito
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">
              {editingId ? 'Editar Hábito' : 'Criar Novo Hábito'}
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Hábito</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: Ler 10 páginas, Beber água..."
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${formData.color === color ? 'scale-110 ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-indigo-500' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${formData.icon === icon ? 'bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-500' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              Salvar Hábito
            </button>
          </div>
        </div>
      )}

      {habits.length === 0 && !isAdding ? (
        <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Nenhum hábito rastreado</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Comece a construir rotinas positivas. Adicione seu primeiro hábito para acompanhar seu progresso diário.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            Criar Primeiro Hábito
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                Hoje
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Days Header */}
              <div className="flex border-b border-slate-100 dark:border-slate-700/50">
                <div className="w-64 flex-shrink-0 p-4 bg-slate-50/50 dark:bg-slate-800/50">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hábitos</span>
                </div>
                <div className="flex-1 flex">
                  {daysInMonth.map(dateStr => {
                    const d = new Date(dateStr + 'T12:00:00');
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    
                    return (
                      <div 
                        key={dateStr} 
                        className={`flex-1 flex flex-col items-center justify-center py-2 border-l border-slate-100 dark:border-slate-700/50 ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
                      >
                        <span className={`text-[10px] font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                          {d.toLocaleDateString('pt-BR', { weekday: 'short' }).charAt(0)}
                        </span>
                        <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {d.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Habits Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {habits.map(habit => {
                  const streak = calculateStreak(habit);
                  
                  return (
                    <div key={habit.id} className="flex hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      {/* Habit Info */}
                      <div className="w-64 flex-shrink-0 p-3 flex items-center justify-between border-r border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                            style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                          >
                            {habit.icon}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{habit.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              🔥 {streak} dias seguidos
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(habit)} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDelete(habit.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Habit Days */}
                      <div className="flex-1 flex">
                        {daysInMonth.map(dateStr => {
                          const isCompleted = habit.completedDates.includes(dateStr);
                          const isFuture = dateStr > new Date().toISOString().split('T')[0];
                          
                          return (
                            <div 
                              key={dateStr}
                              onClick={() => !isFuture && onToggleDate(habit.id, dateStr)}
                              className={`flex-1 flex items-center justify-center border-l border-slate-100 dark:border-slate-700/50 ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                              {isCompleted ? (
                                <div 
                                  className="w-5 h-5 rounded-md flex items-center justify-center shadow-sm"
                                  style={{ backgroundColor: habit.color }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-md border-2 border-slate-200 dark:border-slate-700" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
