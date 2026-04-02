import React, { useState, useMemo } from 'react';
import { Habit, HabitEntry } from '../types';
import { Target, Plus, Trash2, Edit2, CheckCircle2, Circle, X, Calendar as CalendarIcon, Check, XCircle } from 'lucide-react';

interface HabitTrackerProps {
  habits: Habit[];
  onAdd: (habit: Omit<Habit, 'id' | 'createdAt' | 'entries'>) => void;
  onUpdate: (id: string, updates: Partial<Habit>) => void;
  onDelete: (id: string) => void;
  onToggleEntry: (id: string, dayIndex: number, status: 'done' | 'missed', dateStr: string) => void;
  privacyMode: boolean;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'
];

const ICONS = ['🎯', '💧', '🏃', '📚', '🧘', '🥗', '💻', '🎸', '🎨', '✍️', '💸', '🧹'];

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits, onAdd, onUpdate, onDelete, onToggleEntry, privacyMode
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '🎯', color: '#3b82f6', targetDays: 21 });
  
  // Entry Modal State
  const [entryModal, setEntryModal] = useState<{ habitId: string, dayIndex: number, status: 'done' | 'missed', date: string } | null>(null);

  const handleSave = () => {
    if (!formData.name.trim() || formData.targetDays < 1) return;
    
    if (editingId) {
      onUpdate(editingId, { name: formData.name, icon: formData.icon, color: formData.color, targetDays: formData.targetDays });
    } else {
      onAdd({ name: formData.name, icon: formData.icon, color: formData.color, targetDays: formData.targetDays });
    }
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', icon: '🎯', color: '#3b82f6', targetDays: 21 });
  };

  const startEdit = (habit: Habit) => {
    setFormData({ name: habit.name, icon: habit.icon, color: habit.color, targetDays: habit.targetDays || 21 });
    setEditingId(habit.id);
    setIsAdding(true);
  };

  const handleSaveEntry = () => {
      if (!entryModal) return;
      onToggleEntry(entryModal.habitId, entryModal.dayIndex, entryModal.status, entryModal.date);
      setEntryModal(null);
  };

  const formatDateShort = (dateStr: string) => {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${parseInt(d)}/${parseInt(m)}`;
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
            setFormData({ name: '', icon: '🎯', color: '#3b82f6', targetDays: 21 });
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dias (Meta)</label>
              <input
                type="number"
                value={formData.targetDays}
                onChange={(e) => setFormData({ ...formData, targetDays: parseInt(e.target.value) || 1 })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                min="1"
                max="365"
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
        <div className="space-y-6">
          {habits.map(habit => {
            const targetDays = habit.targetDays || 21;
            const entries = habit.entries || {};
            const completedCount = Object.values(entries).filter(e => e.status === 'done').length;
            const progress = (completedCount / targetDays) * 100;

            return (
              <div key={habit.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                    >
                      {habit.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white break-words">{habit.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Meta: {targetDays} dias</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{completedCount} concluídos</span>
                      </div>
                    </div>
                  </div>
                  
                  {!privacyMode && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => startEdit(habit)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(habit.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: targetDays }).map((_, i) => {
                      const entry = entries[i];
                      const isDone = entry?.status === 'done';
                      const isMissed = entry?.status === 'missed';
                      
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          {entry?.date ? (
                            <span className="text-[9px] font-medium text-slate-400">{formatDateShort(entry.date)}</span>
                          ) : (
                            <span className="text-[9px] font-medium text-transparent">--/--</span>
                          )}
                          <button
                            onClick={() => setEntryModal({ habitId: habit.id, dayIndex: i, status: entry?.status || 'done', date: entry?.date || new Date().toISOString().split('T')[0] })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all border ${
                              isDone 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' 
                                : isMissed
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                            }`}
                          >
                            {isDone ? <Check className="w-5 h-5" /> : isMissed ? <X className="w-5 h-5" /> : i + 1}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Entry Modal */}
      {entryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white">Registrar Dia {entryModal.dayIndex + 1}</h3>
              <button onClick={() => setEntryModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEntryModal({ ...entryModal, status: 'done' })}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${entryModal.status === 'done' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Feito
                  </button>
                  <button
                    onClick={() => setEntryModal({ ...entryModal, status: 'missed' })}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${entryModal.status === 'missed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                  >
                    <XCircle className="w-4 h-4" /> Não Feito
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                <input
                  type="date"
                  value={entryModal.date}
                  onChange={(e) => setEntryModal({ ...entryModal, date: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setEntryModal(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEntry}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
