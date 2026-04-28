import React from "react";
import { X, Check, Plus, ListTodo, Layers } from "lucide-react";

export const AddTaskModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  selectedDay,
  currentDate,
  taskLists,
  onOpenListManager,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {formData.id ? "Editar Tarefa" : "Nova Tarefa"}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ListTodo className="w-3 h-3" />
              {selectedDay} de{" "}
              {currentDate.toLocaleDateString("pt-BR", {
                month: "long",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
              Título
            </label>
            <input
              autoFocus
              required
              type="text"
              placeholder="Ex: Pagar conta de luz, Comprar leite..."
              value={formData.title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
              Data de Vencimento
            </label>
            <input
              required
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dueDate: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {taskLists && taskLists.length > 0 && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Lista
                </label>
                <select
                  value={formData.listId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      listId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {taskLists.map((list: any) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={onOpenListManager}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors border border-slate-200 dark:border-slate-600"
                title="Gerenciar Listas"
              >
                <Layers className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
              Descrição (Opcional)
            </label>
            <textarea
              placeholder="Detalhes adicionais..."
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {formData.id ? (
              <Check className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {formData.id ? "Atualizar Tarefa" : "Salvar Tarefa"}
          </button>
        </form>
      </div>
    </div>
  );
};
