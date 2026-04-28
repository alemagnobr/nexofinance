import React from "react";
import { X, CalendarClock, AlignLeft, DollarSign, Tag, CreditCard, Check, Clock, Plus } from "lucide-react";
import { CurrencyInput } from "../CurrencyInput";

export const AddTransactionModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  selectedDay,
  currentDate,
  categories,
  paymentMethods,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Nova Transação
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
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
              O que é?
            </label>
            <div className="relative">
              <AlignLeft className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                autoFocus
                required
                type="text"
                placeholder="Ex: Mercado, Conta de Luz..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                Valor (R$)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <CurrencyInput
                  required
                  placeholder="0,00"
                  value={formData.amount}
                  onChangeValue={(val) =>
                    setFormData({ ...formData, amount: val })
                  }
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                Tipo
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: "expense" })
                  }
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${formData.type === "expense" ? "bg-white dark:bg-slate-600 text-rose-600 shadow-sm" : "text-slate-500"}`}
                >
                  Saída
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: "income" })
                  }
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${formData.type === "income" ? "bg-white dark:bg-slate-600 text-emerald-600 shadow-sm" : "text-slate-500"}`}
                >
                  Entrada
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                Categoria
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                    })
                  }
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  {categories.map((c: string) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                Pagamento
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  {paymentMethods.map((m: any) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
              Status
            </label>
            <div className="flex gap-3">
              <label
                className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === "paid" ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700"}`}
              >
                <input
                  type="radio"
                  name="status"
                  className="hidden"
                  checked={formData.status === "paid"}
                  onChange={() =>
                    setFormData({ ...formData, status: "paid" })
                  }
                />
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  Pago / Recebido
                </span>
              </label>
              <label
                className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === "pending" ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20" : "border-slate-200 dark:border-slate-700"}`}
              >
                <input
                  type="radio"
                  name="status"
                  className="hidden"
                  checked={formData.status === "pending"}
                  onChange={() =>
                    setFormData({ ...formData, status: "pending" })
                  }
                />
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">Pendente</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                Horário (Opcional)
              </label>
              <input
                type="time"
                value={formData.time || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    time: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                Observações (Opcional)
              </label>
              <input
                type="text"
                placeholder="Detalhes adicionais..."
                value={formData.observation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    observation: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Plus className="w-5 h-5" /> Adicionar Transação
          </button>
        </form>
      </div>
    </div>
  );
};
