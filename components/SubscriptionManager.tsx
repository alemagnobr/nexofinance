
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Repeat, X, AlertOctagon, TrendingUp, CalendarClock, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface SubscriptionManagerProps {
  transactions: Transaction[];
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  privacyMode: boolean;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
  transactions, 
  onUpdateTransaction, 
  onDeleteTransaction, 
  privacyMode 
}) => {
  // Filter for recurring expenses
  const subscriptions = transactions.filter(t => t.type === 'expense' && t.isRecurring);

  // Calculate totals
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const totalYearly = totalMonthly * 12;

  // Sorting for Chart (Highest Cost First)
  const chartData = useMemo(() => {
      return [...subscriptions]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10) // Top 10 expensive subs
        .map(sub => ({
            name: sub.description,
            amount: sub.amount,
            annual: sub.amount * 12,
            color: sub.amount > 200 ? '#ef4444' : sub.amount > 50 ? '#f59e0b' : '#3b82f6'
        }));
  }, [subscriptions]);

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const handleCancelRecurrence = (id: string) => {
    if (confirm('Deseja parar de considerar este item como recorrente? Ele continuará como uma transação comum.')) {
      onUpdateTransaction(id, { isRecurring: false });
    }
  };

  // Custom Tooltip to show Annual Cost
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-800/95 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
          <p className="font-bold text-slate-800 dark:text-white mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">
            {data.name}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
              <span>Mensalidade:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {privacyMode ? '••••' : `R$ ${data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </span>
            </div>
            <div className="flex justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
              <span>Custo Anual:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {privacyMode ? '••••' : `R$ ${data.annual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Repeat className="w-7 h-7 text-indigo-600" />
          Gestão de Assinaturas
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Gerencie seus gastos recorrentes e descubra o impacto anual das pequenas mensalidades.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-200 text-sm font-medium mb-1 uppercase tracking-wider">Custo Mensal</p>
            <h3 className="text-3xl font-bold">{formatValue(totalMonthly)}</h3>
            <p className="text-indigo-200 text-xs mt-2 opacity-80">Gasto fixo todo mês</p>
          </div>
          <CalendarClock className="absolute right-4 bottom-4 w-24 h-24 text-indigo-500 opacity-20" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm relative overflow-hidden">
           <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Impacto Anual</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{formatValue(totalYearly)}</h3>
            <p className="text-emerald-500 text-xs mt-2 font-medium flex items-center gap-1">
               <TrendingUp className="w-3 h-3" />
               Projeção de 12 meses
            </p>
          </div>
          <DollarSign className="absolute right-4 bottom-4 w-24 h-24 text-slate-100 dark:text-slate-700" />
        </div>
      </div>

      {/* COST RANKING CHART */}
      {chartData.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Ranking de Custos (Top 10)
              </h3>
              <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={120} 
                            tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}} 
                            axisLine={false}
                            tickLine={false}
                          />
                          <RechartsTooltip 
                              content={<CustomTooltip />}
                              cursor={{fill: 'transparent'}}
                          />
                          <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                              {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptions.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
             <Repeat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma assinatura encontrada.</p>
             <p className="text-slate-400 text-sm">Marque a opção "Recorrente" ao adicionar uma despesa.</p>
          </div>
        ) : (
          subscriptions.map(sub => (
            <div key={sub.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
               <div className="flex justify-between items-start mb-4">
                  <div className="overflow-hidden mr-2">
                     <h4 className="font-bold text-slate-800 dark:text-white text-lg truncate mb-1">{sub.description}</h4>
                     <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{sub.category}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                      <button 
                         onClick={() => handleCancelRecurrence(sub.id)}
                         className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                         title="Remover recorrência"
                      >
                         <AlertOctagon className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => onDeleteTransaction(sub.id)}
                         className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                         title="Excluir assinatura"
                      >
                         <X className="w-4 h-4" />
                      </button>
                  </div>
               </div>
               
               <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block">Mensal</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatValue(sub.amount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Anual</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatValue(sub.amount * 12)}</span>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
