import React, { useState } from "react";
import { Plus, Trash2, Edit2, TrendingUp, Clock, CalendarDays } from "lucide-react";
import { WorkGoal } from "../types";

interface WorkGoalsViewProps {
  goals: WorkGoal[];
  onAddGoal: (goal: WorkGoal) => void;
  onUpdateGoal: (id: string, partial: Partial<WorkGoal>) => void;
  onDeleteGoal: (id: string) => void;
}

export const WorkGoalsView: React.FC<WorkGoalsViewProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddHoursModalOpen, setIsAddHoursModalOpen] = useState<{ isOpen: boolean; goalId: string | null; hours: string }>({ isOpen: false, goalId: null, hours: "" });
  
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    targetHours: "",
    deadline: "",
  });

  const handleOpenModal = (goal?: WorkGoal) => {
    if (goal) {
      setFormData({
        id: goal.id,
        title: goal.title,
        targetHours: goal.targetHours.toString(),
        deadline: goal.deadline || "",
      });
    } else {
      setFormData({
        id: "",
        title: "",
        targetHours: "",
        deadline: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.targetHours) return;

    if (formData.id) {
      onUpdateGoal(formData.id, {
        title: formData.title,
        targetHours: parseFloat(formData.targetHours),
        deadline: formData.deadline || undefined,
      });
    } else {
      onAddGoal({
        id: crypto.randomUUID(),
        title: formData.title,
        targetHours: parseFloat(formData.targetHours),
        completedHours: 0,
        deadline: formData.deadline || undefined,
        createdAt: new Date().toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  const handleAddHours = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddHoursModalOpen.goalId || !isAddHoursModalOpen.hours) return;
    const hours = parseFloat(isAddHoursModalOpen.hours);
    if (isNaN(hours) || hours <= 0) return;

    const goal = goals.find(g => g.id === isAddHoursModalOpen.goalId);
    if (goal) {
      onUpdateGoal(goal.id, {
        completedHours: goal.completedHours + hours
      });
    }
    setIsAddHoursModalOpen({ isOpen: false, goalId: null, hours: "" });
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            Metas de Trabalho
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Cadastre trabalhos, projetos e acompanhe as horas dedicadas.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-5 h-5" /> Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals?.map((goal) => {
          const progress = Math.min((goal.completedHours / goal.targetHours) * 100, 100);
          return (
            <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-2 leading-tight">
                  {goal.title}
                </h3>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => handleOpenModal(goal)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteGoal(goal.id)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    {goal.completedHours}h / {goal.targetHours}h
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-600">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {goal.deadline && (
                  <div className="mt-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                      <CalendarDays className="w-4 h-4 text-emerald-500" /> 
                      Prazo: {new Date(goal.deadline + "T12:00:00").toLocaleDateString('pt-BR')}
                    </p>
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dl = new Date(goal.deadline + "T12:00:00");
                      dl.setHours(0, 0, 0, 0);
                      const diffMs = dl.getTime() - today.getTime();
                      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                      const remainingHours = Math.max(0, goal.targetHours - goal.completedHours);
                      
                      const hoursPerDay = daysRemaining > 0 ? (remainingHours / daysRemaining) : remainingHours;
                      const hoursPerWeek = daysRemaining >= 7 ? hoursPerDay * 7 : remainingHours;
                      
                      return (
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                           <div className="flex flex-col items-center p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Faltam</span>
                              <span className={`text-sm font-black ${daysRemaining <= 3 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {daysRemaining}d
                              </span>
                           </div>
                           <div className="flex flex-col items-center p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Por Dia</span>
                              <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                                {hoursPerDay.toFixed(1)}h
                              </span>
                           </div>
                           <div className="flex flex-col items-center p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Por Sem.</span>
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                {hoursPerWeek.toFixed(1)}h
                              </span>
                           </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setIsAddHoursModalOpen({ isOpen: true, goalId: goal.id, hours: "" })}
                  className="w-full py-2.5 bg-slate-100 hover:bg-emerald-50 text-emerald-700 dark:bg-slate-700 dark:text-emerald-400 dark:hover:bg-slate-600 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors border border-slate-200 dark:border-slate-600 dark:hover:border-emerald-500/50 hover:border-emerald-300"
                >
                  <Plus className="w-4 h-4" /> Registrar Horas
                </button>
              </div>
            </div>
          );
        })}
        {(!goals || goals.length === 0) && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
             <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhuma meta cadastrada</h3>
             <p className="text-slate-500 mt-1">Crie sua primeira meta de projeto ou estudo.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
              {formData.id ? "Editar Meta" : "Nova Meta"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Título</label>
                <input
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome do projeto..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Meta em Horas</label>
                <input
                  required
                  type="number"
                  step="0.5"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.targetHours}
                  onChange={(e) => setFormData({ ...formData, targetHours: e.target.value })}
                  placeholder="Ex: 40"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Prazo (Opcional)</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddHoursModalOpen.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
              Registrar Horas
            </h3>
            <form onSubmit={handleAddHours} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Horas Trabalhadas</label>
                <input
                  required
                  autoFocus
                  type="number"
                  step="0.5"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-center text-xl font-black"
                  value={isAddHoursModalOpen.hours}
                  onChange={(e) => setIsAddHoursModalOpen(prev => ({ ...prev, hours: e.target.value }))}
                  placeholder="Ex: 2 ou 1.5"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddHoursModalOpen({ isOpen: false, goalId: null, hours: "" })}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
