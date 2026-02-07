
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Badge, Budget } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, LineChart, Line, ReferenceLine } from 'recharts';
import { Wallet, TrendingUp, AlertCircle, Target, Download, Trophy, CheckCheck, Layers, Crown, TrendingDown, Calendar, BarChart3, ShieldAlert, BadgeAlert, Scale, ArrowRight, CalendarClock, DollarSign, PieChart as PieChartIcon, ChevronDown, Bell, X, Activity } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  privacyMode: boolean;
  onUnlockBadge: (id: string) => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

// Gamification Definitions with Progress Logic
const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'first_invest',
    name: 'Investidor Iniciante',
    description: 'Realizou o primeiro investimento.',
    icon: '🌱',
    condition: (d) => d.investments.length > 0,
    getProgress: (d) => d.investments.length > 0 ? 100 : 0
  },
  {
    id: 'controlled',
    name: 'No Controle',
    description: 'Tem mais receitas que despesas no mês.',
    icon: '⚖️',
    condition: (d) => {
      const inc = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = d.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return inc > exp && inc > 0;
    },
    getProgress: (d) => {
       const inc = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
       const exp = d.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
       if (inc === 0) return 0;
       if (inc > exp) return 100;
       return Math.min(99, (inc / exp) * 100); // Inverse logic purely for progress visual roughly
    }
  },
  {
    id: 'saver',
    name: 'Poupador',
    description: 'Acumulou mais de R$ 5.000 em investimentos.',
    icon: '💰',
    condition: (d) => d.investments.reduce((acc, i) => acc + i.amount, 0) >= 5000,
    getProgress: (d) => Math.min(100, (d.investments.reduce((acc, i) => acc + i.amount, 0) / 5000) * 100)
  },
  {
    id: 'diversified',
    name: 'Mente Diversificada',
    description: 'Investiu em 3 ou mais categorias diferentes.',
    icon: '🎨',
    condition: (d) => {
      const uniqueTypes = new Set(d.investments.map(i => i.type));
      return uniqueTypes.size >= 3;
    },
    getProgress: (d) => {
        const uniqueTypes = new Set(d.investments.map(i => i.type));
        return Math.min(100, (uniqueTypes.size / 3) * 100);
    }
  },
  {
    id: 'debt_free',
    name: 'Zero Pendências',
    description: 'Não possui nenhuma conta pendente.',
    icon: '✅',
    condition: (d) => {
      const hasExpenses = d.transactions.some(t => t.type === 'expense');
      const pending = d.transactions.filter(t => t.type === 'expense' && t.status === 'pending');
      return hasExpenses && pending.length === 0;
    },
    getProgress: (d) => {
        const expenses = d.transactions.filter(t => t.type === 'expense');
        if (expenses.length === 0) return 0;
        const paid = expenses.filter(t => t.status === 'paid').length;
        return Math.min(100, (paid / expenses.length) * 100);
    }
  },
  {
    id: 'goal_hitter',
    name: 'Na Mosca',
    description: 'Atingiu 100% da meta de um investimento.',
    icon: '🎯',
    condition: (d) => d.investments.some(i => i.targetAmount > 0 && i.amount >= i.targetAmount),
    getProgress: (d) => {
        const progresses = d.investments.map(i => i.targetAmount > 0 ? (i.amount / i.targetAmount) * 100 : 0);
        return Math.min(100, Math.max(0, ...progresses));
    }
  },
  {
    id: 'club_10k',
    name: 'Clube dos 10k',
    description: 'Patrimônio total superou R$ 10.000.',
    icon: '💎',
    condition: (d) => {
      const totalInvest = d.investments.reduce((acc, i) => acc + i.amount, 0);
      const totalBalance = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
                           d.transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
      return (totalInvest + totalBalance) >= 10000;
    },
    getProgress: (d) => {
      const totalInvest = d.investments.reduce((acc, i) => acc + i.amount, 0);
      const totalBalance = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
                           d.transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
      return Math.min(100, ((totalInvest + totalBalance) / 10000) * 100);
    }
  }
];

// Helper to get effective budget for current month
const getEffectiveBudget = (budgets: Budget[], category: string, date: Date) => {
  const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
  // 1. Specific monthly budget
  const specific = budgets.find(b => b.category === category && b.month === monthStr);
  if (specific) return specific;
  // 2. Recurring budget
  return budgets.find(b => b.category === category && b.isRecurring);
};

export const Dashboard: React.FC<DashboardProps> = ({ data, privacyMode, onUnlockBadge }) => {
  
  // History Chart State
  const [historyStartMonth, setHistoryStartMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5); // Default to last 6 months
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  });

  // Mobile Tabs State
  const [activeMobileTab, setActiveMobileTab] = useState<'flow' | 'allocation' | 'history'>('flow');

  // Greeting Logic
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Check Badges Effect
  useEffect(() => {
    AVAILABLE_BADGES.forEach(badge => {
      if (!data.unlockedBadges.includes(badge.id) && badge.condition(data)) {
        onUnlockBadge(badge.id);
      }
    });
  }, [data, onUnlockBadge]);

  // --- NUDGES LOGIC ---
  const nudges = useMemo(() => {
    const alerts: { title: string; message: string; type: 'warning' | 'info' }[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Unique categories present in budgets
    const budgetCategories = Array.from(new Set<string>(data.budgets.map((b: Budget) => b.category)));

    // Only check if before the 25th to be a useful "mid-month" warning
    if (today.getDate() <= 25) {
        budgetCategories.forEach(cat => {
            const budget = getEffectiveBudget(data.budgets, cat, today);
            if (!budget) return;

            const spent = data.transactions
                .filter(t => 
                    t.type === 'expense' && 
                    t.category === cat && 
                    new Date(t.date).getMonth() === currentMonth &&
                    new Date(t.date).getFullYear() === currentYear
                )
                .reduce((sum, t) => sum + t.amount, 0);
            
            if (spent >= budget.limit * 0.8 && spent < budget.limit) {
                alerts.push({
                    title: `Atenção: ${cat}`,
                    message: `Você já usou ${(spent/budget.limit*100).toFixed(0)}% do orçamento e ainda é dia ${today.getDate()}. Cuidado!`,
                    type: 'warning'
                });
            } else if (spent >= budget.limit) {
                 alerts.push({
                    title: `Limite Excedido: ${cat}`,
                    message: `Você estourou o teto definido para esta categoria.`,
                    type: 'warning'
                });
            }
        });
    }

    return alerts;
  }, [data.budgets, data.transactions]);

  // Helper to mask values
  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Calculations
  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = data.transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  
  // Use walletBalance from DB if available (Optimized), otherwise fallback to calculation (Legacy/Guest)
  const currentBalance = data.walletBalance !== undefined 
      ? data.walletBalance 
      : (totalIncome - data.transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0));
  
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
  const financialRunway = useMemo(() => {
     const monthlyBurn = totalExpense > 0 ? totalExpense : (totalIncome * 0.5) || 1000; 
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
  }, [data.debts, totalIncome, totalExpense, totalPending, currentBalance, totalInvested]);


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

  // --- CHART COMPONENTS (Reused for Mobile/Desktop) ---

  const renderFlowChart = (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full">
         <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Fluxo de Caixa (6 Meses)</h3>
         </div>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={comparativeData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
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
  );

  const renderAllocationChart = (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-500" />
            Distribuição de Patrimônio
        </h3>
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
  );

  const renderHistoryChart = (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
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
          {/* Adjusted height to 200px to make it even smaller as requested */}
          <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={expenseHistoryData} margin={{ top: 10, right: 10, bottom: 25, left: 10 }}>
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
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* NUDGES / ALERTS AREA */}
      {nudges.length > 0 && (
         <div className="space-y-2">
            {nudges.map((nudge, idx) => (
               <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3 animate-fade-in-down">
                  <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full flex-shrink-0">
                     <Bell className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                     <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">{nudge.title}</h4>
                     <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">{nudge.message}</p>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
         <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:flex-1 min-w-0">
             <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white whitespace-nowrap">{greeting}!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Visão geral das suas finanças.</p>
             </div>

             {/* Badge Strip (Header) */}
             <div className="flex-1 flex items-center gap-2 px-4 py-2 sm:border-l sm:border-slate-300 dark:sm:border-slate-600 overflow-x-auto no-scrollbar mask-gradient w-full">
                {AVAILABLE_BADGES.map(badge => {
                   const isUnlocked = data.unlockedBadges.includes(badge.id);
                   const progress = badge.getProgress(data);
                   return (
                      <div 
                        key={badge.id} 
                        className="group relative flex-shrink-0 cursor-help"
                      >
                         {/* Badge Icon */}
                         <div className="relative">
                            <span 
                                className={`text-xl md:text-2xl transition-all duration-300 block ${isUnlocked ? 'filter-none opacity-100 scale-100' : 'grayscale opacity-30 scale-90'}`}
                            >
                                {badge.icon}
                            </span>
                            
                            {/* Mini Progress Bar for Locked Badges */}
                            {!isUnlocked && progress > 0 && (
                                <div className="absolute -bottom-1 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            )}
                         </div>
                         
                         {/* Visual Tooltip */}
                         <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max max-w-[180px] hidden group-hover:block z-50 pointer-events-none animate-fade-in">
                            <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl text-center border border-slate-700">
                               <p className="font-bold mb-0.5">{badge.name}</p>
                               <p className="opacity-80 mb-2">{badge.description}</p>
                               
                               <div className="flex items-center justify-between text-[10px] uppercase font-semibold">
                                  <span className={isUnlocked ? 'text-emerald-400' : 'text-slate-400'}>
                                     {isUnlocked ? 'Desbloqueado' : `${progress.toFixed(0)}% Concluído`}
                                  </span>
                               </div>
                               {!isUnlocked && (
                                   <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                       <div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${progress}%`}}></div>
                                   </div>
                               )}
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
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Top Cards with Rich Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Health Score */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group flex flex-col justify-between hover:shadow-md transition-shadow">
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
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
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
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
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
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
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
      
      {/* --- DESKTOP VIEW (GRID) --- */}
      <div className="hidden lg:block space-y-6">
        <div className="grid grid-cols-2 gap-6 h-full">
           {renderFlowChart}
           {renderAllocationChart}
        </div>
        {renderHistoryChart}
      </div>

      {/* --- MOBILE VIEW (TABS) --- */}
      <div className="lg:hidden space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 border border-slate-200 dark:border-slate-700">
              <button 
                  onClick={() => setActiveMobileTab('flow')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5
                    ${activeMobileTab === 'flow' 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Fluxo
              </button>
              <button 
                  onClick={() => setActiveMobileTab('allocation')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5
                    ${activeMobileTab === 'allocation' 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                  <PieChartIcon className="w-3.5 h-3.5" />
                  Carteira
              </button>
              <button 
                  onClick={() => setActiveMobileTab('history')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5
                    ${activeMobileTab === 'history' 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Histórico
              </button>
          </div>

          <div className="min-h-[350px]">
             {activeMobileTab === 'flow' && renderFlowChart}
             {activeMobileTab === 'allocation' && renderAllocationChart}
             {activeMobileTab === 'history' && renderHistoryChart}
          </div>
      </div>
    </div>
  );
};
