import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Badge } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, LineChart, Line, ReferenceLine } from 'recharts';
import { Wallet, TrendingUp, AlertCircle, Target, Download, Trophy, CheckCheck, Layers, Crown, TrendingDown, Calendar, BarChart3, ShieldAlert, BadgeAlert, Scale, ArrowRight, CalendarClock, DollarSign, PieChart as PieChartIcon, ChevronDown } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  privacyMode: boolean;
  onUnlockBadge: (id: string) => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

// Gamification Definitions
const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'first_invest',
    name: 'Investidor Iniciante',
    description: 'Realizou o primeiro investimento.',
    icon: '🌱',
    unlocked: false,
    condition: (d) => d.investments.length > 0
  },
  {
    id: 'controlled',
    name: 'No Controle',
    description: 'Tem mais receitas que despesas no mês.',
    icon: '⚖️',
    unlocked: false,
    condition: (d) => {
      const inc = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = d.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return inc > exp && inc > 0;
    }
  },
  {
    id: 'saver',
    name: 'Poupador',
    description: 'Acumulou mais de R$ 5.000 em investimentos.',
    icon: '💰',
    unlocked: false,
    condition: (d) => d.investments.reduce((acc, i) => acc + i.amount, 0) >= 5000
  },
  {
    id: 'diversified',
    name: 'Mente Diversificada',
    description: 'Investiu em 3 ou mais categorias diferentes.',
    icon: '🎨',
    unlocked: false,
    condition: (d) => {
      const uniqueTypes = new Set(d.investments.map(i => i.type));
      return uniqueTypes.size >= 3;
    }
  },
  {
    id: 'debt_free',
    name: 'Zero Pendências',
    description: 'Não possui nenhuma conta pendente.',
    icon: '✅',
    unlocked: false,
    condition: (d) => {
      const hasExpenses = d.transactions.some(t => t.type === 'expense');
      const pending = d.transactions.filter(t => t.type === 'expense' && t.status === 'pending');
      return hasExpenses && pending.length === 0;
    }
  },
  {
    id: 'goal_hitter',
    name: 'Na Mosca',
    description: 'Atingiu 100% da meta de um investimento.',
    icon: '🎯',
    unlocked: false,
    condition: (d) => d.investments.some(i => i.targetAmount > 0 && i.amount >= i.targetAmount)
  },
  {
    id: 'club_10k',
    name: 'Clube dos 10k',
    description: 'Patrimônio total superou R$ 10.000.',
    icon: '💎',
    unlocked: false,
    condition: (d) => {
      const totalInvest = d.investments.reduce((acc, i) => acc + i.amount, 0);
      const totalBalance = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
                           d.transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
      return (totalInvest + totalBalance) >= 10000;
    }
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ data, privacyMode, onUnlockBadge }) => {
  
  // History Chart State
  const [historyStartMonth, setHistoryStartMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5); // Default to last 6 months
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  });

  // Check Badges Effect
  useEffect(() => {
    AVAILABLE_BADGES.forEach(badge => {
      if (!data.unlockedBadges.includes(badge.id) && badge.condition(data)) {
        onUnlockBadge(badge.id);
      }
    });
  }, [data, onUnlockBadge]);

  // Helper to mask values
  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Calculations
  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = data.transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalIncome - data.transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalInvested = data.investments.reduce((acc, curr) => acc + curr.amount, 0);

  // --- NEW: Detailed Metrics for Cards ---

  // 1. Upcoming Bills (Next 3)
  const upcomingBills = useMemo(() => {
    const pending = data.transactions.filter(t => t.type === 'expense' && t.status === 'pending');
    // Sort by date (asc)
    return pending.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);
  }, [data.transactions]);

  // 2. Top Investments (Top 3 by Amount)
  const topInvestments = useMemo(() => {
    return [...data.investments].sort((a, b) => b.amount - a.amount).slice(0, 3);
  }, [data.investments]);

  // 3. Runway (Months of Survival)
  // Logic: Current Balance / Average Monthly Expense (simplified as total expense of current view / 1, or just total expense if > 0)
  const financialRunway = useMemo(() => {
     const monthlyBurn = totalExpense > 0 ? totalExpense : (totalIncome * 0.5) || 1000; // Fallback estimate
     return currentBalance / monthlyBurn;
  }, [currentBalance, totalExpense, totalIncome]);


  // --- COMPLEX HEALTH SCORE ALGORITHM ---
  const { healthScore, scoreLabel, scoreColor, factors } = useMemo(() => {
    let score = 0;
    const factorsList: { text: string; type: 'good' | 'bad' | 'neutral' }[] = [];
    
    // 1. Debt Check
    const isPrescribed = (dueDateStr: string) => {
        const due = new Date(dueDateStr);
        const now = new Date();
        const diffYears = (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return diffYears >= 5;
    };
    const activeDebts = data.debts.filter(d => (d.status === 'open' || d.status === 'negotiating') && !isPrescribed(d.dueDate));
    const hasDirtyName = activeDebts.length > 0;
    
    if (hasDirtyName) {
        score += 200;
        factorsList.push({ text: `Negativado: ${activeDebts.length} dívidas`, type: 'bad' });
    } else {
        score += 350;
        factorsList.push({ text: "Nome Limpo", type: 'good' });
    }

    // 2. Liquidity
    const monthlyBurnRate = totalExpense > 0 ? totalExpense : 1000;
    const monthsCoverage = totalInvested / monthlyBurnRate;

    if (monthsCoverage >= 6) { score += 200; factorsList.push({ text: "Reserva Robusta", type: 'good' }); }
    else if (monthsCoverage >= 1) { score += 100; factorsList.push({ text: "Reserva Iniciada", type: 'neutral' }); }
    else { factorsList.push({ text: "Sem Reserva", type: 'bad' }); }

    // 3. Savings Rate
    const cashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? cashFlow / totalIncome : 0;
    if (savingsRate >= 0.20) { score += 150; factorsList.push({ text: "Poupador (20%+)", type: 'good' }); }
    else if (savingsRate < 0) { score -= 50; factorsList.push({ text: "Déficit Mensal", type: 'bad' }); }

    // 4. Solvency
    if (currentBalance >= totalPending) score += 150;
    else { score -= 100; factorsList.push({ text: "Risco de Calote", type: 'bad' }); }

    // Caps
    if (hasDirtyName) score = Math.min(score, 550);
    score = Math.max(0, Math.min(1000, Math.round(score)));

    let sLabel = '', sColor = '';
    if (score >= 850) { sLabel = 'Elite'; sColor = 'text-emerald-500'; }
    else if (score >= 700) { sLabel = 'Excelente'; sColor = 'text-emerald-600'; }
    else if (score >= 500) { sLabel = 'Regular'; sColor = 'text-amber-500'; }
    else if (score >= 300) { sLabel = 'Ruim'; sColor = 'text-orange-500'; }
    else { sLabel = 'Crítico'; sColor = 'text-rose-600'; }

    return { healthScore: score, scoreLabel: sLabel, scoreColor: sColor, factors: factorsList };
  }, [data, totalIncome, totalExpense, totalPending, currentBalance, totalInvested]);


  // Expense History
  const expenseHistoryData = useMemo(() => {
    const expenseMap = new Map<string, number>();
    const [startYear, startMonth] = historyStartMonth.split('-').map(Number);
    const currentDate = new Date(startYear, startMonth - 1, 1);
    const today = new Date();
    
    while (currentDate <= today || (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear())) {
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        expenseMap.set(`${y}-${m}`, 0);
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    data.transactions.forEach(t => {
        if (t.type === 'expense') {
            const m = t.date.slice(0, 7); 
            if (expenseMap.has(m)) expenseMap.set(m, (expenseMap.get(m) || 0) + t.amount);
        }
    });
    return Array.from(expenseMap.entries()).map(([key, value]) => {
        const [y, m] = key.split('-').map(Number);
        return {
            name: new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            amount: value,
            fullDate: key
        };
    });
  }, [data.transactions, historyStartMonth]);

  // Comparative Data
  const comparativeData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        map.set(d.toISOString().slice(0, 7), { income: 0, expense: 0 });
    }
    data.transactions.forEach(t => {
        const m = t.date.slice(0, 7);
        if (map.has(m)) {
            const current = map.get(m)!;
            if (t.type === 'income') current.income += t.amount;
            else current.expense += t.amount;
        }
    });
    return Array.from(map.entries()).map(([key, value]) => {
        const [y, m] = key.split('-');
        return {
            name: new Date(parseInt(y), parseInt(m) - 1, 2).toLocaleDateString('pt-BR', { month: 'short' }),
            Receitas: value.income,
            Despesas: value.expense
        };
    });
  }, [data.transactions]);

  // Pie Chart Data
  const pieChartData = [
    { name: 'Saldo Livre', value: Math.max(0, currentBalance), color: '#10b981' },
    { name: 'Contas Pendentes', value: totalPending, color: '#ef4444' },
    { name: 'Investido', value: totalInvested, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Descricao,Categoria,Tipo,Valor,Status\n"
      + data.transactions.map(e => `${e.date},${e.description},${e.category},${e.type},${e.amount},${e.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "finansmart_relatorio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
         <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:flex-1 min-w-0">
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white whitespace-nowrap flex-shrink-0">Visão Geral</h2>

             {/* Badge Strip (Header) */}
             <div className="flex-1 flex items-center gap-2 px-4 py-2 sm:border-l sm:border-slate-300 dark:sm:border-slate-600 overflow-x-auto no-scrollbar mask-gradient w-full">
                {AVAILABLE_BADGES.map(badge => {
                   const isUnlocked = data.unlockedBadges.includes(badge.id);
                   return (
                      <div 
                        key={badge.id} 
                        className="group relative flex-shrink-0 cursor-help"
                        title={`${badge.name} - ${badge.description} (${isUnlocked ? 'Desbloqueado' : 'Bloqueado'})`}
                      >
                         <span 
                            className={`text-xl md:text-2xl transition-all duration-300 block ${isUnlocked ? 'filter-none opacity-100 scale-100' : 'grayscale opacity-20 scale-90'}`}
                         >
                            {badge.icon}
                         </span>
                         
                         {/* Visual Tooltip (Extra fallback) */}
                         <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[150px] hidden group-hover:block z-50 pointer-events-none">
                            <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg text-center border border-slate-700">
                               <p className="font-bold mb-0.5">{badge.name}</p>
                               <p className={`text-[10px] uppercase font-semibold ${isUnlocked ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  {isUnlocked ? 'Desbloqueado' : 'Bloqueado'}
                               </p>
                            </div>
                            {/* Arrow */}
                            <div className="w-2 h-2 bg-slate-800 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2 border-t border-l border-slate-700"></div>
                         </div>
                      </div>
                   )
                })}
             </div>
         </div>

        <button 
          onClick={exportData}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors self-end md:self-auto flex-shrink-0"
        >
          <Download className="w-4 h-4" /> Exportar Relatório
        </button>
      </div>

      {/* Top Cards with Rich Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Health Score */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Scale className="w-20 h-20 text-slate-400" />
          </div>
          <div>
               <div className="flex items-center justify-between mb-2">
                 <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Score Financeiro</h3>
                 <BadgeAlert className={`w-4 h-4 ${scoreColor}`} />
               </div>
               <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-3xl font-black ${scoreColor} tracking-tighter`}>{healthScore}</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ 1000</span>
               </div>
               <p className={`text-xs font-bold uppercase tracking-wide ${scoreColor}`}>{scoreLabel}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-1">
                {factors.slice(0, 2).map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                        {factor.type === 'good' && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                        {factor.type === 'bad' && <ShieldAlert className="w-3 h-3 text-rose-500" />}
                        {factor.type === 'neutral' && <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>}
                        <span className="text-slate-600 dark:text-slate-400 truncate">{factor.text}</span>
                    </div>
                ))}
          </div>
        </div>

        {/* Card 2: Current Balance & Runway */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Saldo em Caixa</h3>
               <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white truncate">{formatValue(currentBalance)}</p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
             <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Sobrevivência</span>
                <span className={`text-xs font-bold ${financialRunway < 1 ? 'text-rose-500' : financialRunway < 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                   {financialRunway < 0.1 ? 'Crítico' : `${financialRunway.toFixed(1)} Meses`}
                </span>
             </div>
             <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${financialRunway < 1 ? 'bg-rose-500' : financialRunway < 3 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(100, (financialRunway / 6) * 100)}%` }}
                ></div>
             </div>
          </div>
        </div>

        {/* Card 3: Payables (Smart List) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">A Pagar (Mês)</h3>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatValue(totalPending)}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">
               <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end space-y-2">
            <p className="text-[10px] text-slate-400 font-semibold uppercase border-b border-slate-100 dark:border-slate-700/50 pb-1">
               Próximos Vencimentos
            </p>
            {upcomingBills.length === 0 ? (
               <div className="text-xs text-slate-400 italic">Nada pendente.</div>
            ) : (
               upcomingBills.map(bill => {
                 const isLate = new Date(bill.date) < new Date(new Date().setHours(0,0,0,0));
                 return (
                   <div key={bill.id} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                         <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLate ? 'bg-rose-500' : 'bg-amber-400'}`}></div>
                         <span className="truncate text-slate-600 dark:text-slate-300 max-w-[80px]">{bill.description}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                         <span className="text-slate-400 text-[10px]">{new Date(bill.date).toLocaleDateString('pt-BR', {day: '2-digit', month:'2-digit'})}</span>
                         <span className={`font-semibold ${isLate ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                           {formatValue(bill.amount).replace('R$', '')}
                         </span>
                      </div>
                   </div>
                 );
               })
            )}
          </div>
        </div>

        {/* Card 4: Investments (Top Assets) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
             <div>
               <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Investido</h3>
               <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatValue(totalInvested)}</p>
             </div>
             <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
             </div>
          </div>

          <div className="flex-1 flex flex-col justify-end space-y-2">
             <p className="text-[10px] text-slate-400 font-semibold uppercase border-b border-slate-100 dark:border-slate-700/50 pb-1 flex justify-between">
                <span>Maiores Posições</span>
                <PieChartIcon className="w-3 h-3" />
             </p>
             {topInvestments.length === 0 ? (
                <div className="text-xs text-slate-400 italic">Carteira vazia.</div>
             ) : (
                topInvestments.map((inv, idx) => (
                   <div key={inv.id} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                         <span className="text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                         <span className="truncate text-slate-600 dark:text-slate-300 max-w-[90px]" title={inv.name}>{inv.name}</span>
                      </div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                         {formatValue(inv.amount).replace('R$', '')}
                      </span>
                   </div>
                ))
             )}
          </div>
        </div>
      </div>
      
      {/* GRID CONTAINER FOR SIDE-BY-SIDE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparativo Mensal Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Fluxo de Caixa (Últimos 6 Meses)</h3>
             </div>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={comparativeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} width={60} />
                      <RechartsTooltip 
                         cursor={{ fill: 'transparent' }}
                         contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                         formatter={(value: number) => [privacyMode ? '••••' : `R$ ${value.toLocaleString('pt-BR')}`, '']}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Distribution Pie Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Distribuição de Patrimônio</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => privacyMode ? '••••' : `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* Expense History Chart (Full Width) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                  Tendência de Despesas
              </h3>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Início:</span>
                  <input 
                      type="month" 
                      value={historyStartMonth}
                      onChange={(e) => setHistoryStartMonth(e.target.value)}
                      className="bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none font-medium"
                  />
              </div>
          </div>
          <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={expenseHistoryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                       <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12}} 
                          dy={10} 
                          padding={{ left: 10, right: 10 }}
                       />
                       <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12}} 
                          tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                          width={60}
                       />
                       <RechartsTooltip 
                            cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '5 5' }}
                            contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                            }}
                            formatter={(value: number) => [privacyMode ? '••••' : `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Despesas']}
                            labelStyle={{ color: '#64748b', marginBottom: '0.25rem' }}
                       />
                       <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#f43f5e" 
                          strokeWidth={3} 
                          dot={{r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff'}} 
                          activeDot={{r: 6, stroke: '#f43f5e', strokeWidth: 2, fill: '#fff'}} 
                          isAnimationActive={false}
                       />
                  </LineChart>
              </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};