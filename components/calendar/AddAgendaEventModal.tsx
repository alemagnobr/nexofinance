import React from "react";
import { X, CalendarClock, Check, Plus, Repeat } from "lucide-react";

export const AddAgendaEventModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  selectedDay,
  currentDate,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {formData.id ? "Editar Evento" : "Novo Evento"}
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
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
              placeholder="Ex: Reunião, Consulta..."
              value={formData.title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    allDay: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Dia inteiro
              </span>
            </label>
          </div>

          <div className="mt-2 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRoutine}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isRoutine: e.target.checked,
                  })
                }
                className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                É uma Rotina
              </span>
            </label>
          </div>

          {!formData.allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Início
                </label>
                <input
                  required
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Fim
                </label>
                <input
                  required
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isRecurring: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Repeat className="w-4 h-4" /> Repetir evento
              </span>
            </label>

            {formData.isRecurring && (
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 mb-4 text-left">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                    Frequência
                  </label>
                  <select
                    value={formData.recurrencePeriod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrencePeriod: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="daily">Todos os dias</option>
                    <option value="every_other_day">
                      Dia sim, dia não (A cada 2 dias)
                    </option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                    <option value="yearly">Anualmente</option>
                    <option value="custom_days">
                      Dias Específicos da Semana
                    </option>
                  </select>
                </div>

                {formData.recurrencePeriod === "custom_days" && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                      Dias da Semana
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Dom",
                        "Seg",
                        "Ter",
                        "Qua",
                        "Qui",
                        "Sex",
                        "Sáb",
                      ].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const currentlySelected = (
                              formData.recurrenceDays || []
                            ).includes(index);
                            const newDays = currentlySelected
                              ? (formData.recurrenceDays || []).filter(
                                  (d: number) => d !== index,
                                )
                              : [
                                  ...(formData.recurrenceDays || []),
                                  index,
                                ];
                            setFormData({
                              ...formData,
                              recurrenceDays: newDays,
                            });
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold border transition-colors ${
                            (formData.recurrenceDays || []).includes(
                              index,
                            )
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-slate-300 text-slate-500 hover:border-blue-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                    Término em (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.recurrenceEndDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrenceEndDate: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {formData.id ? (
              <Check className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {formData.id ? "Atualizar Evento" : "Salvar Evento"}
          </button>
        </form>
      </div>
    </div>
  );
};
