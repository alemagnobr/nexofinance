
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, Budget } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUp, ArrowDown, Clock, Filter, Plus, CalendarClock, Download, Layers, X, Check, CreditCard, Tag, AlignLeft, DollarSign, Bell, RefreshCw } from 'lucide-react';
import { syncTransactionsToCalendar } from '../services/calendarService';
import { updateTransactionFire } from '../services/storageService';
import { auth } from '../services/firebase';

interface FinancialCalendarProps {
  transactions: Transaction[];
  budgets: Budget[]; // Added budget prop
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  privacyMode: boolean;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CATEGORIES = ['Casa', 'Mobilidade', 'Alimentos', 'Lazer', 'Saúde', 'Educação', 'Pets', 'Salário', 'Renda Extra', 'Investimentos', 'Outros'];
const PAYMENT_METHODS = [
    { value: 'credit_card', label: 'Crédito' },
    { value: 'debit_card', label: 'Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'direct_debit', label: 'Débito Auto.' }
];

type ViewFilter = 'all' | 'income' | 'expense' | 'pending';

// Helper for exporting ICS
const exportToICS = (events: any[]) => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NEXO Finance//PT-BR\n";
    
    events.forEach(evt => {
        const dateStr = evt.date.replace(/-/g, '');
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
        icsContent += `DTEND;VALUE=DATE:${dateStr}\n`;
        icsContent += `SUMMARY:${evt.description} (${evt.type === 'income' ? '+' : '-'} R$ ${evt.amount})\n`;
        icsContent += `DESCRIPTION:Categoria: ${evt.category} | Status: ${evt.status} ${evt.observation ? '| Obs: ' + evt.observation : ''}\n`;
        icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'nexo_agenda.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const FinancialCalendar: React.FC<FinancialCalendarProps> = ({ transactions, budgets, onAddTransaction, privacyMode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [filterType, setFilterType] = useState<ViewFilter>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      description: '',
      amount: '',
      type: 'expense' as TransactionType,
      category: 'Outros',
      paymentMethod: 'credit_card' as PaymentMethod,
      status: 'pending' as TransactionStatus,
      observation: ''
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to get days in month
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // --- ALERTS LOGIC (Copied from Dashboard but focused on Exceeded) ---
  const budgetAlerts = useMemo(() => {
    const alerts: { title: string; message: string; type: 'warning' }[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthStr = today.toISOString().slice(0, 7);

    // Only process if we are viewing the current month to show relevant alerts
    // or always show alerts for current real time month regardless of calendar view?
    // Let's show alerts based on "Real Time" status like dashboard
    
    budgets.forEach(budget => {
        // Find if this budget applies to current real month
        const isRelevant = (budget.isRecurring && !budgets.some(b => b.category === budget.category && b.month === monthStr && !b.isRecurring)) || budget.month === monthStr;
        
        if (!isRelevant) return;

        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === budget.category &&
                new Date(t.date).getMonth() === currentMonth &&
                new Date(t.date).getFullYear() === currentYear
            )
            .reduce((sum, t) => sum + t.amount, 0);

        if (spent >= budget.limit) {
                alerts.push({
                title: `Limite Excedido: ${budget.category}`,
                message: `Você estourou o teto definido para esta categoria.`,
                type: 'warning'
            });
        }
    });
    return alerts;
  }, [budgets, transactions]);

  // --- GHOSTING LOGIC (Projection) ---
  const displayedTransactions = useMemo(() => {
    // 1. Real Transactions for this month
    const realTransactions = transactions.filter(t => {
       const [tYear, tMonth] = t.date.split('-').map(Number);
       return tYear === year && tMonth === month + 1;
    });

    // 2. Identify Recurring Templates from history
    const recurringTemplates = new Map<string, Transaction>();
    transactions.forEach(t => {
        if (t.isRecurring) {
             const existing = recurringTemplates.get(t.description);
             if (!existing || new Date(t.date) > new Date(existing.date)) {
                 recurringTemplates.set(t.description, t);
             }
        }
    });

    const ghostTransactions: any[] = [];
    const today = new Date();
    const viewDate = new Date(year, month, 1);

    if (viewDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
        recurringTemplates.forEach((template) => {
            const hasRealInstance = realTransactions.some(t => 
                t.description === template.description && 
                t.amount === template.amount
            );

            if (!hasRealInstance) {
                const originalDate = new Date(template.date);
                const day = originalDate.getDate();
                const validDay = Math.min(day, daysInMonth);
                
                if (originalDate < new Date(year, month + 1, 0)) {
                    ghostTransactions.push({
                        ...template,
                        id: `ghost-${template.id}-${year}-${month}`,
                        date: `${year}-${String(month+1).padStart(2,'0')}-${String(validDay).padStart(2,'0')}`,
                        status: 'pending',
                        isGhost: true
                    });
                }
            }
        });
    }

    return [...realTransactions, ...ghostTransactions].filter(t => {
        if (filterType === 'all') return true;
        if (filterType === 'pending') return t.status === 'pending';
        return t.type === filterType;
    });

  }, [transactions, year, month, daysInMonth, filterType]);


  // Selected Day Transactions
  const selectedTransactions = useMemo(() => {
    if (selectedDay === null) return [];
    return displayedTransactions.filter(t => {
       const day = parseInt(t.date.split('-')[2]);
       return day === selectedDay;
    });
  }, [displayedTransactions, selectedDay]);

  // Heatmap Calculation
  const maxDailyExpense = useMemo(() => {
      let max = 0;
      for (let d = 1; d <= daysInMonth; d++) {
          const dailySum = displayedTransactions
              .filter(t => parseInt(t.date.split('-')[2]) === d && t.type === 'expense')
              .reduce((acc, t) => acc + t.amount, 0);
          if (dailySum > max) max = dailySum;
      }
      return max || 1;
  }, [displayedTransactions, daysInMonth]);


  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleOpenModal = () => {
      if (!selectedDay) return;
      // Reset form
      setFormData({
          description: '',
          amount: '',
          type: 'expense',
          category: 'Outros',
          paymentMethod: 'credit_card',
          status: 'pending',
          observation: ''
      });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDay) return;

      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
      
      onAddTransaction({
          description: formData.description,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          date: dateStr,
          status: formData.status,
          paymentMethod: formData.paymentMethod,
          isRecurring: false, // Simple add via calendar is usually one-off
          observation: formData.observation
      });

      setIsModalOpen(false);
  };

  const handleSyncCalendar = async () => {
      if (!auth.currentUser) {
          alert('Você precisa estar logado para sincronizar.');
          return;
      }
      
      setIsSyncing(true);
      try {
          // Pass updater function. If offline (guest), this won't work as expected since service needs auth token.
          // But auth.currentUser check protects us.
          const count = await syncTransactionsToCalendar(transactions, (id, updates) => {
              updateTransactionFire(auth.currentUser!.uid, id, updates);
          });
          
          if (count > 0) alert(`${count} eventos criados na sua Google Agenda!`);
          else alert('Tudo sincronizado! Nenhuma nova conta pendente encontrada.');
      } catch (error: any) {
          console.error(error);
          alert('Erro ao sincronizar: ' + error.message);
      } finally {
          setIsSyncing(false);
      }
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '•••';
    if (val >= 1000) return (val/1000).toFixed(1) + 'k';
    return val.toFixed(0);
  };

  const formatFullValue = (val: number) => {
      if (privacyMode) return '••••';
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Generate Calendar Grid
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-28 bg-slate-50/30 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"></div>);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayTrans = displayedTransactions.filter(t => parseInt(t.date.split('-')[2]) === day);
    const incomeSum = dayTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenseSum = dayTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    const intensity = Math.min(1, expenseSum / maxDailyExpense);
    let bgClass = 'bg-white dark:bg-slate-800';
    
    if (expenseSum > 0) {
        if (intensity > 0.7) bgClass = 'bg-rose-100 dark:bg-rose-900/40';
        else if (intensity > 0.4) bgClass = 'bg-rose-50 dark:bg-rose-900/20';
        else bgClass = 'bg-slate-50 dark:bg-slate-800';
    }

    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
    const isSelected = selectedDay === day;

    calendarCells.push(
      <div 
        key={day} 
        onClick={() => setSelectedDay(day)}
        className={`h-28 p-1.5 border border-slate-100 dark:border-slate-700 relative cursor-pointer transition-all hover:brightness-95
          ${isSelected ? 'ring-2 ring-inset ring-indigo-500 z-10' : ''}
          ${bgClass}
        `}
      >
        <div className="flex justify-between items-start">
            <span className={`text-xs font-bold inline-flex w-6 h-6 items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}>
            {day}
            </span>
            {dayTrans.some(t => t.status === 'pending') && (
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" title="Pagamentos Pendentes"></div>
            )}
        </div>
        
        <div className="mt-2 flex flex-col gap-0.5">
           {incomeSum > 0 && (
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-1 rounded truncate">
                 +{formatValue(incomeSum)}
              </div>
           )}
           {expenseSum > 0 && (
              <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-1 rounded truncate">
                 -{formatValue(expenseSum)}
              </div>
           )}
           {dayTrans.some((t: any) => t.isGhost) && (
               <div className="absolute bottom-1 right-1 opacity-50">
                   <Layers className="w-3 h-3 text-slate-400" />
               </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 relative">
       
       {/* ALERTS SECTION */}
       {budgetAlerts.length > 0 && (
         <div className="space-y-2 mb-4">
            {budgetAlerts.map((alert, idx) => (
               <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3 animate-fade-in-down shadow-sm">
                  <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full flex-shrink-0">
                     <Bell className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                     <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">{alert.title}</h4>
                     <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">{alert.message}</p>
                  </div>
               </div>
            ))}
         </div>
       )}

       {/* ADD TRANSACTION MODAL */}
       {isModalOpen && (
           <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
               <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
                   <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                       <div>
                           <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nova Transação</h3>
                           <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                               <CalendarClock className="w-3 h-3" />
                               {selectedDay} de {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                           </p>
                       </div>
                       <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                           <X className="w-5 h-5" />
                       </button>
                   </div>
                   
                   <form onSubmit={handleSubmit} className="p-6 space-y-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">O que é?</label>
                           <div className="relative">
                               <AlignLeft className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                               <input 
                                   autoFocus
                                   required
                                   type="text" 
                                   placeholder="Ex: Mercado, Conta de Luz..."
                                   value={formData.description}
                                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                                   className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                               />
                           </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Valor (R$)</label>
                               <div className="relative">
                                   <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                   <input 
                                       required
                                       type="number"
                                       step="0.01"
                                       placeholder="0,00"
                                       value={formData.amount}
                                       onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                       className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo</label>
                               <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                                   <button 
                                      type="button"
                                      onClick={() => setFormData({...formData, type: 'expense'})}
                                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${formData.type === 'expense' ? 'bg-white dark:bg-slate-600 text-rose-600 shadow-sm' : 'text-slate-500'}`}
                                   >
                                       Saída
                                   </button>
                                   <button 
                                      type="button"
                                      onClick={() => setFormData({...formData, type: 'income'})}
                                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${formData.type === 'income' ? 'bg-white dark:bg-slate-600 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                   >
                                       Entrada
                                   </button>
                               </div>
                           </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Categoria</label>
                               <div className="relative">
                                   <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                   <select
                                       value={formData.category}
                                       onChange={(e) => setFormData({...formData, category: e.target.value})}
                                       className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                   >
                                       {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                   </select>
                               </div>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Pagamento</label>
                               <div className="relative">
                                   <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                   <select
                                       value={formData.paymentMethod}
                                       onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                                       className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                   >
                                       {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                   </select>
                               </div>
                           </div>
                       </div>

                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Status</label>
                           <div className="flex gap-3">
                               <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === 'paid' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                   <input type="radio" name="status" className="hidden" checked={formData.status === 'paid'} onChange={() => setFormData({...formData, status: 'paid'})} />
                                   <Check className="w-4 h-4" />
                                   <span className="text-sm font-semibold">Pago / Recebido</span>
                               </label>
                               <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === 'pending' ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                   <input type="radio" name="status" className="hidden" checked={formData.status === 'pending'} onChange={() => setFormData({...formData, status: 'pending'})} />
                                   <Clock className="w-4 h-4" />
                                   <span className="text-sm font-semibold">Pendente</span>
                               </label>
                           </div>
                       </div>

                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Observações (Opcional)</label>
                           <input 
                               type="text" 
                               placeholder="Detalhes adicionais..."
                               value={formData.observation}
                               onChange={(e) => setFormData({...formData, observation: e.target.value})}
                               className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                           />
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
       )}

       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Agenda Financeira
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Previsão de gastos e controle de vencimentos.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* GOOGLE CALENDAR SYNC BUTTON */}
            <button 
                onClick={handleSyncCalendar}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border ${
                    isSyncing 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-white hover:bg-slate-50 text-indigo-600 border-indigo-100 hover:border-indigo-300 dark:bg-slate-800 dark:text-indigo-400 dark:border-slate-700'
                }`}
                title="Sincronizar contas pendentes com Google Agenda"
            >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Agenda'}
            </button>

            <button 
                onClick={() => exportToICS(displayedTransactions)}
                className="p-2 text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                title="Exportar para Arquivo (.ics)"
            >
                <Download className="w-5 h-5" />
            </button>

            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex-1 md:flex-none justify-center">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
                <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 font-semibold text-slate-700 dark:text-slate-200 capitalize min-w-[140px] text-center">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 overflow-x-auto">
          {[
              { id: 'all', label: 'Tudo', icon: Filter },
              { id: 'expense', label: 'Saídas', icon: ArrowDown },
              { id: 'income', label: 'Entradas', icon: ArrowUp },
              { id: 'pending', label: 'Pendentes', icon: Clock },
          ].map(f => (
             <button
                key={f.id}
                onClick={() => setFilterType(f.id as ViewFilter)}
                className={`flex-1 min-w-[80px] py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2
                    ${filterType === f.id
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
             >
                <f.icon className="w-3 h-3" /> {f.label}
             </button>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Calendar Grid */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
               {DAYS_OF_WEEK.map(d => (
                 <div key={d} className="py-3 text-center text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                   {d}
                 </div>
               ))}
            </div>
            <div className="grid grid-cols-7">
               {calendarCells}
            </div>
         </div>

         {/* Details Sidebar */}
         <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-0 overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {selectedDay ? `${selectedDay} de ${currentDate.toLocaleDateString('pt-BR', { month: 'long' })}` : 'Resumo do Mês'}
                </h3>
                {selectedDay && (
                    <button 
                        onClick={handleOpenModal}
                        className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Adicionar neste dia
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {selectedDay && selectedTransactions.length === 0 && (
                  <div className="text-center py-10">
                      <CalendarClock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Nenhuma movimentação.</p>
                  </div>
               )}
               {!selectedDay && (
                  <div className="text-center py-10">
                      <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
                          <CalendarIcon className="w-8 h-8 text-indigo-500" />
                      </div>
                      <p className="text-slate-500 font-medium">Selecione um dia</p>
                      <p className="text-slate-400 text-xs mt-1">Clique no calendário para ver detalhes ou adicionar contas.</p>
                  </div>
               )}
               
               {selectedTransactions.map((t, idx) => (
                 <div key={t.id || idx} className={`flex items-center justify-between p-3 rounded-lg border ${
                     (t as any).isGhost 
                     ? 'bg-slate-50 dark:bg-slate-800 border-dashed border-indigo-300 dark:border-indigo-700' 
                     : 'bg-white dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
                 }`}>
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${
                           t.type === 'income' 
                           ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                           : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                       }`}>
                          {t.type === 'income' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <p className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">{t.description}</p>
                             {(t as any).isGhost && (
                                 <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 rounded uppercase font-bold">Previsto</span>
                             )}
                          </div>
                          <div className="flex flex-col">
                              <p className="text-xs text-slate-500 dark:text-slate-400">{t.category}</p>
                              {t.observation && <p className="text-[10px] text-slate-400 italic mt-0.5">{t.observation}</p>}
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {formatFullValue(t.amount)}
                       </p>
                       {t.type === 'expense' && (
                         <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                           {t.status === 'pending' ? 'Pendente' : 'Pago'}
                         </span>
                       )}
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
