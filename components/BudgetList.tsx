
import React, { useState, useEffect, useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { Plus, Trash2, Target, AlertTriangle, CheckCircle, Edit2, AlertCircle, ChevronLeft, Calendar, ChevronRight, Repeat, CalendarClock, Info, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface BudgetListProps {
  budgets: Budget[];
  transactions: Transaction[];
  onAdd: (budget: Omit<Budget, 'id'>) => void;
  onDelete: (id: string) => void;
  privacyMode: boolean;
  quickActionSignal?: number; // Prop to trigger form open
}

const CATEGORY_OPTIONS = ['Casa', 'Mobilidade', 'Alimentos', 'Lazer', 'Pets', 'Outros'];

export const BudgetList: React.FC<BudgetListProps> = ({ budgets, transactions, onAdd, onDelete, privacyMode, quickActionSignal }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Date Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());

  const [newBudget, setNewBudget] = useState({
    category: 'Lazer',
    limit: '',
    isRecurring: true,
    month: new Date().toISOString().slice(0, 7) // YYYY-MM
  });

  // Effect to listen for Quick Action triggers
  useEffect(() => {
    if (quickActionSignal && Date.now() - quickActionSignal < 2000) {
        setIsFormOpen(true);
        // Default to current month when opened via quick action
        setNewBudget({ 
            category: 'Lazer', 
            limit: '', 
            isRecurring: true, 
            month: new Date().toISOString().slice(0, 7) 
        });
    }
  }, [quickActionSignal]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Format month for display (e.g., "Janeiro 2024")
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  
  // Format month for key (e.g., "2024-01")
  const getCurrentMonthKey = () => {
     const y = currentDate.getFullYear();
     const m = String(currentDate.getMonth() + 1).padStart(2, '0');
     return `${y}-${m}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check conflicts
    // 1. If trying to add Recurring: check if Recurring exists
    if (newBudget.isRecurring) {
        if (budgets.some(b => b.category === newBudget.category && b.isRecurring)) {
            alert(`Já existe um orçamento recorrente para ${newBudget.category}. Exclua o anterior para criar um novo.`);
            return;
        }
    } else {
        // 2. If trying to add Specific: check if Specific exists for that month
        if (budgets.some(b => b.category === newBudget.category && b.month === newBudget.month)) {
            alert(`Já existe um orçamento de ${newBudget.category} para ${newBudget.month}.`);
            return;
        }
    }

    // Construct payload ensuring no undefined fields if strictness is an issue
    const payload: Omit<Budget, 'id'> = {
      category: newBudget.category,
      limit: parseFloat(newBudget.limit),
      isRecurring: newBudget.isRecurring,
    };

    if (!newBudget.isRecurring) {
        payload.month = newBudget.month;
    }

    onAdd(payload);
    
    setNewBudget({ category: 'Outros', limit: '', isRecurring: true, month: getCurrentMonthKey() });
    setIsFormOpen(false);
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Helper to calculate spent amount for the VIEWED month for a category
  const getSpentAmount = (category: string) => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return (
          t.type === 'expense' &&
          t.category === category &&
          tDate.getMonth() === m &&
          tDate.getFullYear() === y
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // LOGIC: Get effective budgets for the currently selected month
  // We want to show:
  // 1. Specific budgets defined for this month.
  // 2. Recurring budgets (if no specific budget overrides it).
  const effectiveBudgets = useMemo(() => {
     const monthKey = getCurrentMonthKey();
     
     // 1. Find specific budgets for this month
     const specific = budgets.filter(b => b.month === monthKey);
     const specificCategories = new Set(specific.map(b => b.category));

     // 2. Find recurring budgets that are NOT overridden by specific ones
     const recurring = budgets.filter(b => b.isRecurring && !specificCategories.has(b.category));

     return [...specific, ...recurring].sort((a, b) => a.category.localeCompare(b.category));
  }, [budgets, currentDate]);

  // --- ANALYTICS LOGIC ---
  const performanceData = useMemo(() => {
    // Look back 6 months
    const stats = new Map<string, { totalSpent: number, totalLimit: number, count: number }>();
    
    const today = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;

        // Get active categories in this month history
        const activeCategories = new Set<string>(transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && tDate.getFullYear() === y && tDate.getMonth() === m;
            })
            .map(t => t.category)
        );

        activeCategories.forEach((cat) => {
            // Find effective budget for that past month
            let budget = budgets.find(b => b.category === cat && b.month === monthKey);
            if (!budget) budget = budgets.find(b => b.category === cat && b.isRecurring);

            if (budget) {
                const spent = transactions
                    .filter(t => {
                        const tDate = new Date(t.date);
                        return t.type === 'expense' && t.category === cat && tDate.getFullYear() === y && tDate.getMonth() === m;
                    })
                    .reduce((s, t) => s + t.amount, 0);
                
                const current = stats.get(cat) || { totalSpent: 0, totalLimit: 0, count: 0 };
                stats.set(cat, {
                    totalSpent: current.totalSpent + spent,
                    totalLimit: current.totalLimit + budget.limit,
                    count: current.count + 1
                });
            }
        });
    }

    const chartData = Array.from(stats.entries()).map(([cat, data]) => {
        const avgAdherence = (data.totalSpent / data.totalLimit) * 100;
        return {
            name: cat,
            adherence: avgAdherence,
            spent: data.totalSpent / data.count, // Average per month
            limit: data.totalLimit / data.count
        };
    });

    // Sort: Most exceeded first
    return chartData.sort((a, b) => b.adherence - a.adherence);
  }, [budgets, transactions]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Planejamento & Metas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">Controle de gastos para {formatMonth(currentDate)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
             <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`p-2.5 rounded-lg transition-colors border ${showAnalytics ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                title="Ver Análise de Performance"
             >
                <BarChart3 className="w-5 h-5" />
             </button>

             {/* Month Selector */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
                <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 font-semibold text-slate-700 dark:text-slate-200 capitalize min-w-[140px] text-center flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-pink-500" />
                {formatMonth(currentDate)}
                </div>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <button
            onClick={() => {
                setNewBudget(prev => ({...prev, month: getCurrentMonthKey()}));
                setIsFormOpen(!isFormOpen);
            }}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2.5 rounded-lg hover:bg-pink-700 transition-colors shadow-sm text-sm font-medium"
            >
            <Plus className="w-4 h-4" />
            Definir Limite
            </button>
        </div>
      </div>

      {/* ANALYTICS PANEL */}
      {showAnalytics && performanceData.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 animate-fade-in-down mb-6">
              <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      Performance Histórica (Últimos 6 Meses)
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                      Veja quais categorias você costuma estourar (acima de 100%) e quais estão sob controle.
                  </p>
              </div>
              
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100} 
                            tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                            axisLine={false}
                            tickLine={false}
                          />
                          <RechartsTooltip 
                              cursor={{fill: 'transparent'}}
                              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              formatter={(val: number) => [`${val.toFixed(0)}%`, 'Média de Uso']}
                          />
                          <ReferenceLine x={100} stroke="#ef4444" strokeDasharray="3 3" />
                          <Bar dataKey="adherence" radius={[0, 4, 4, 0]} barSize={20}>
                              {performanceData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.adherence > 100 ? '#ef4444' : entry.adherence > 85 ? '#f59e0b' : '#10b981'} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

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

          <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-2 mb-3">
                 <input 
                    type="checkbox" 
                    id="isRecurringBudget"
                    checked={newBudget.isRecurring}
                    onChange={(e) => setNewBudget({...newBudget, isRecurring: e.target.checked})}
                    className="w-4 h-4 text-pink-600 rounded"
                 />
                 <label htmlFor="isRecurringBudget" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer">
                    <Repeat className="w-4 h-4" /> Orçamento Recorrente?
                 </label>
             </div>
             
             {newBudget.isRecurring ? (
                 <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Este limite será aplicado automaticamente em todos os meses futuros, a menos que você defina um específico.
                 </p>
             ) : (
                 <div className="animate-fade-in">
                     <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Mês de Referência</label>
                     <input 
                        type="month"
                        required={!newBudget.isRecurring}
                        value={newBudget.month}
                        onChange={(e) => setNewBudget({...newBudget, month: e.target.value})}
                        className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 outline-none w-full max-w-[200px]"
                     />
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" /> Este limite valerá APENAS para o mês selecionado.
                     </p>
                 </div>
             )}
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
        {effectiveBudgets.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
             <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum limite definido para {formatMonth(currentDate)}.</p>
             <p className="text-slate-400 text-sm">Crie metas recorrentes ou específicas para controlar seus gastos.</p>
          </div>
        ) : (
            effectiveBudgets.map(budget => {
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
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-white">{budget.category}</h3>
                        {/* Source Indicator */}
                        {budget.isRecurring ? (
                            <span title="Meta Recorrente (Padrão)" className="text-slate-400">
                                <Repeat className="w-3 h-3" />
                            </span>
                        ) : (
                            <span title={`Meta Específica para ${budget.month}`} className="text-pink-500">
                                <CalendarClock className="w-3 h-3" />
                            </span>
                        )}
                    </div>
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
