import React, { useState } from 'react';
import { Budget, Transaction } from '../types';
import { Plus, Trash2, Target, AlertTriangle, CheckCircle, Wallet, Edit2, X, AlertCircle } from 'lucide-react';

interface BudgetListProps {
  budgets: Budget[];
  transactions: Transaction[];
  onAdd: (budget: Omit<Budget, 'id'>) => void;
  onDelete: (id: string) => void;
  privacyMode: boolean;
}

const CATEGORY_OPTIONS = ['Casa', 'Mobilidade', 'Alimentos', 'Lazer', 'Pets', 'Outros'];

export const BudgetList: React.FC<BudgetListProps> = ({ budgets, transactions, onAdd, onDelete, privacyMode }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: 'Lazer',
    limit: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Check if budget already exists for this category
    if (budgets.some(b => b.category === newBudget.category)) {
      alert(`Já existe um orçamento para ${newBudget.category}. Exclua o anterior para criar um novo.`);
      return;
    }

    onAdd({
      category: newBudget.category,
      limit: parseFloat(newBudget.limit)
    });
    setNewBudget({ category: 'Outros', limit: '' });
    setIsFormOpen(false);
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Helper to calculate spent amount in current month for a category
  const getSpentAmount = (category: string) => {
    const now = new Date();
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return (
          t.type === 'expense' &&
          t.category === category &&
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Planejamento & Metas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">Controle de gastos para {currentMonthName}</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Definir Limite
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Novo Limite Mensal</h3>
          </div>
          
          <div className="flex flex-col gap-1">
             <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Categoria</label>
             <select
                value={newBudget.category}
                onChange={e => setNewBudget({ ...newBudget, category: e.target.value })}
                className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-pink-500"
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
          </div>

          <div className="flex flex-col gap-1">
             <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Valor Limite (R$)</label>
             <input
                required
                type="number"
                placeholder="Ex: 1000.00"
                value={newBudget.limit}
                onChange={e => setNewBudget({ ...newBudget, limit: e.target.value })}
                className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-pink-500"
              />
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
            >
              Salvar Meta
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
             <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum limite definido.</p>
             <p className="text-slate-400 text-sm">Crie metas para suas categorias e controle seus gastos.</p>
          </div>
        ) : (
          budgets.map(budget => {
            const spent = getSpentAmount(budget.category);
            const percentage = Math.min(100, (spent / budget.limit) * 100);
            const isOverLimit = spent > budget.limit;
            
            // Color Logic
            let progressColor = 'bg-emerald-500';
            let statusColor = 'text-emerald-600 dark:text-emerald-400';
            let icon = <CheckCircle className="w-5 h-5" />;
            
            if (percentage > 100) {
              progressColor = 'bg-rose-500';
              statusColor = 'text-rose-600 dark:text-rose-400';
              icon = <AlertCircle className="w-5 h-5" />;
            } else if (percentage > 75) {
              progressColor = 'bg-amber-500';
              statusColor = 'text-amber-600 dark:text-amber-400';
              icon = <AlertTriangle className="w-5 h-5" />;
            }

            const remaining = Math.max(0, budget.limit - spent);

            return (
              <div key={budget.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all relative overflow-hidden group">
                
                {/* Delete Button (Visible on Hover) */}
                <button 
                  onClick={() => onDelete(budget.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-lg bg-slate-100 dark:bg-slate-700 ${statusColor}`}>
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{budget.category}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Meta: {formatValue(budget.limit)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Gasto: <span className={isOverLimit ? 'text-rose-500 font-bold' : ''}>{formatValue(spent)}</span>
                    </span>
                    <span className="text-slate-400 text-xs">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <p className="text-xs text-right mt-2 font-medium">
                    {isOverLimit ? (
                      <span className="text-rose-500">Excedido em {formatValue(spent - budget.limit)}</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">Resta {formatValue(remaining)}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};