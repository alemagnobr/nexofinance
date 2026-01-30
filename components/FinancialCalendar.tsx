import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUp, ArrowDown } from 'lucide-react';

interface FinancialCalendarProps {
  transactions: Transaction[];
  privacyMode: boolean;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const FinancialCalendar: React.FC<FinancialCalendarProps> = ({ transactions, privacyMode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to get days in month
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Filter transactions for this month
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear === year && tMonth === month + 1;
    });
  }, [transactions, year, month]);

  // Selected Day Transactions
  const selectedTransactions = useMemo(() => {
    if (selectedDay === null) return [];
    return monthTransactions.filter(t => {
       const day = parseInt(t.date.split('-')[2]);
       return day === selectedDay;
    });
  }, [monthTransactions, selectedDay]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Generate Calendar Grid
  const calendarCells = [];
  // Empty slots for previous month days
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"></div>);
  }
  
  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    // Find transactions for this day
    const dayTrans = monthTransactions.filter(t => parseInt(t.date.split('-')[2]) === day);
    const incomeCount = dayTrans.filter(t => t.type === 'income').length;
    const expenseCount = dayTrans.filter(t => t.type === 'expense').length;
    const hasPending = dayTrans.some(t => t.type === 'expense' && t.status === 'pending');
    
    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
    const isSelected = selectedDay === day;

    calendarCells.push(
      <div 
        key={day} 
        onClick={() => setSelectedDay(day)}
        className={`h-24 p-2 border border-slate-100 dark:border-slate-700 relative cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50
          ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800'}
        `}
      >
        <span className={`text-sm font-semibold inline-flex w-6 h-6 items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
          {day}
        </span>
        
        <div className="mt-2 flex flex-wrap gap-1 content-start">
           {incomeCount > 0 && (
              <div className="w-2 h-2 rounded-full bg-emerald-500" title={`${incomeCount} Receitas`}></div>
           )}
           {expenseCount > 0 && (
              <div className={`w-2 h-2 rounded-full ${hasPending ? 'bg-rose-500 animate-pulse' : 'bg-rose-400'}`} title={`${expenseCount} Despesas`}></div>
           )}
           {/* If many transactions, show a plus */}
           {dayTrans.length > 5 && <span className="text-[8px] text-slate-400 leading-none">+</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Calendário Financeiro
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Visualize vencimentos e fluxo de caixa diário.
          </p>
        </div>
        
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Calendar Grid */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
               {DAYS_OF_WEEK.map(d => (
                 <div key={d} className="py-2 text-center text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                   {d}
                 </div>
               ))}
            </div>
            <div className="grid grid-cols-7">
               {calendarCells}
            </div>
         </div>

         {/* Details Sidebar */}
         <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
               {selectedDay ? `${selectedDay} de ${currentDate.toLocaleDateString('pt-BR', { month: 'long' })}` : 'Selecione um dia'}
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3">
               {selectedDay && selectedTransactions.length === 0 && (
                  <p className="text-slate-400 text-center py-10 italic">Nenhuma movimentação neste dia.</p>
               )}
               {!selectedDay && (
                  <p className="text-slate-400 text-center py-10">Clique em um dia no calendário para ver os detalhes.</p>
               )}
               
               {selectedTransactions.map(t => (
                 <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {t.type === 'income' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                       </div>
                       <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">{t.description}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t.category}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {formatValue(t.amount)}
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