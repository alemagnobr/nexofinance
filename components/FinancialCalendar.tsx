
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, Budget, AgendaEvent, TaskList, Task } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUp, ArrowDown, Clock, Filter, Plus, CalendarClock, Download, Layers, X, Check, CreditCard, Tag, AlignLeft, DollarSign, Bell, RefreshCw, ExternalLink, Edit2, Trash2, ListTodo, ChevronUp, ChevronDown, Grid } from 'lucide-react';
import { updateTransactionFire } from '../services/storageService';
import { auth } from '../services/firebase';
import { AIAgendaAssistant } from './AIAgendaAssistant';

interface FinancialCalendarProps {
  transactions: Transaction[];
  budgets: Budget[]; // Added budget prop
  agendaEvents?: AgendaEvent[];
  taskLists?: TaskList[];
  tasks?: Task[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onAddAgendaEvent?: (e: Omit<AgendaEvent, 'id' | 'updatedAt'>) => void;
  onUpdateAgendaEvent?: (id: string, updates: Partial<AgendaEvent>) => void;
  onDeleteAgendaEvent?: (id: string) => void;
  onAddTaskList?: (list: Omit<TaskList, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onUpdateTaskList?: (id: string, updates: Partial<TaskList>) => void;
  onDeleteTaskList?: (id: string) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDeleteTask?: (id: string) => void;
  privacyMode: boolean;
  onNavigate?: (view: any) => void;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CATEGORIES = ['Casa', 'Mobilidade', 'Alimentos', 'Lazer', 'Saúde', 'Educação', 'Pets', 'Salário', 'Renda Extra', 'Investimentos', 'Outros'];
const PAYMENT_METHODS = [
    { value: 'credit_card', label: 'Crédito' },
    { value: 'debit_card', label: 'Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'direct_debit', label: 'Débito Auto.' },
    { value: 'boleto', label: 'Boleto' }
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

export const FinancialCalendar: React.FC<FinancialCalendarProps> = ({ 
  transactions, 
  budgets, 
  agendaEvents = [],
  taskLists = [],
  tasks = [],
  onAddTransaction, 
  onUpdateTransaction,
  onAddAgendaEvent,
  onUpdateAgendaEvent,
  onDeleteAgendaEvent,
  onAddTaskList,
  onUpdateTaskList,
  onDeleteTaskList,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  privacyMode,
  onNavigate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [filterType, setFilterType] = useState<ViewFilter>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isListManagerOpen, setIsListManagerOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const [agendaFormData, setAgendaFormData] = useState({
      id: '',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      allDay: true
  });
  const [taskFormData, setTaskFormData] = useState({
      id: '',
      title: '',
      description: '',
      listId: '',
      dueDate: ''
  });

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

  // Week view calculations
  const currentWeekStart = useMemo(() => {
      const d = new Date(year, month, selectedDay || 1);
      const dayOfWeek = d.getDay(); // 0 (Sun) to 6 (Sat)
      const diff = d.getDate() - dayOfWeek;
      return new Date(d.setDate(diff));
  }, [year, month, selectedDay]);

  const weekDays = useMemo(() => {
      const days = [];
      for (let i = 0; i < 7; i++) {
          const d = new Date(currentWeekStart);
          d.setDate(d.getDate() + i);
          days.push(d);
      }
      return days;
  }, [currentWeekStart]);

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

  // Agenda Events for this month
  const displayedAgendaEvents = useMemo(() => {
      return agendaEvents.filter(e => {
          const eStart = new Date(e.startDate);
          const eEnd = new Date(e.endDate);
          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
          
          return eStart <= monthEnd && eEnd >= monthStart;
      });
  }, [agendaEvents, year, month]);

  // Selected Day Transactions and Events
  const selectedTransactions = useMemo(() => {
    if (selectedDay === null) return [];
    return displayedTransactions.filter(t => {
       const day = parseInt(t.date.split('-')[2]);
       return day === selectedDay;
    }).sort((a, b) => {
        // 1. Paid first, Pending last
        if (a.status === 'paid' && b.status === 'pending') return -1;
        if (a.status === 'pending' && b.status === 'paid') return 1;
        
        // 2. Custom order
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        return orderA - orderB;
    });
  }, [displayedTransactions, selectedDay]);

  const selectedAgendaEvents = useMemo(() => {
      if (selectedDay === null) return [];
      const targetDate = new Date(year, month, selectedDay);
      targetDate.setHours(0, 0, 0, 0);
      
      return displayedAgendaEvents.filter(e => {
          const eStart = new Date(e.startDate);
          eStart.setHours(0, 0, 0, 0);
          const eEnd = new Date(e.endDate);
          eEnd.setHours(23, 59, 59, 999);
          
          return targetDate >= eStart && targetDate <= eEnd;
      });
  }, [displayedAgendaEvents, selectedDay, year, month]);

  const handleMoveTransaction = (index: number, direction: 'up' | 'down') => {
      if (!onUpdateTransaction) return;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= selectedTransactions.length) return;
      
      const currentTx = selectedTransactions[index];
      const targetTx = selectedTransactions[newIndex];
      
      // Only allow moving within the same status group
      if (currentTx.status !== targetTx.status) return;
      
      // Get all transactions in the same status group
      const groupTxs = selectedTransactions.filter(t => t.status === currentTx.status);
      
      // Create a new array with the swapped items
      const newGroupTxs = [...groupTxs];
      const currentIndexInGroup = newGroupTxs.findIndex(t => t.id === currentTx.id);
      const targetIndexInGroup = newGroupTxs.findIndex(t => t.id === targetTx.id);
      
      // Swap
      [newGroupTxs[currentIndexInGroup], newGroupTxs[targetIndexInGroup]] = [newGroupTxs[targetIndexInGroup], newGroupTxs[currentIndexInGroup]];
      
      // Update order for all items in the group to ensure consistency
      newGroupTxs.forEach((t, i) => {
          if (t.order !== i) {
              onUpdateTransaction(t.id, { order: i });
          }
      });
  };

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


  const handlePrev = () => {
    if (viewMode === 'month') {
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDay(null);
    } else if (viewMode === 'week') {
        const d = new Date(year, month, (selectedDay || 1) - 7);
        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
        setSelectedDay(d.getDate());
    } else if (viewMode === 'day') {
        const d = new Date(year, month, (selectedDay || 1) - 1);
        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
        setSelectedDay(d.getDate());
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDay(null);
    } else if (viewMode === 'week') {
        const d = new Date(year, month, (selectedDay || 1) + 7);
        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
        setSelectedDay(d.getDate());
    } else if (viewMode === 'day') {
        const d = new Date(year, month, (selectedDay || 1) + 1);
        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
        setSelectedDay(d.getDate());
    }
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

  const handleOpenAgendaModal = () => {
      if (!selectedDay) return;
      setAgendaFormData({
          id: '',
          title: '',
          description: '',
          startTime: '09:00',
          endTime: '10:00',
          allDay: true
      });
      setIsAgendaModalOpen(true);
  };

  const handleEditAgendaEvent = (event: AgendaEvent) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      setAgendaFormData({
          id: event.id,
          title: event.title,
          description: event.description || '',
          startTime: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          endTime: end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          allDay: event.allDay
      });
      setIsAgendaModalOpen(true);
  };

  const handleDeleteAgendaEvent = async (id: string) => {
      if (window.confirm('Tem certeza que deseja excluir este evento?')) {
          if (onDeleteAgendaEvent) {
              await onDeleteAgendaEvent(id);
          }
      }
  };

  const handleAgendaSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDay || !onAddAgendaEvent || !onUpdateAgendaEvent) return;

      const baseDate = new Date(year, month, selectedDay);
      let startDate = new Date(baseDate);
      let endDate = new Date(baseDate);

      if (!agendaFormData.allDay) {
          const [startHour, startMin] = agendaFormData.startTime.split(':').map(Number);
          const [endHour, endMin] = agendaFormData.endTime.split(':').map(Number);
          startDate.setHours(startHour, startMin, 0, 0);
          endDate.setHours(endHour, endMin, 0, 0);
      } else {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
      }

      if (agendaFormData.id) {
          await onUpdateAgendaEvent(agendaFormData.id, {
              title: agendaFormData.title,
              description: agendaFormData.description,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              allDay: agendaFormData.allDay
          });
      } else {
          await onAddAgendaEvent({
              title: agendaFormData.title,
              description: agendaFormData.description,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              allDay: agendaFormData.allDay
          });
      }

      setIsAgendaModalOpen(false);
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

  const handleOpenTaskModal = () => {
      if (!selectedDay) return;
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
      setTaskFormData({
          id: '',
          title: '',
          description: '',
          listId: taskLists && taskLists.length > 0 ? taskLists[0].id : '',
          dueDate: dateStr
      });
      setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDay || !onAddTask || !onUpdateTask) return;

      // Ensure we have a list to add to, if not create a default one
      let targetListId = taskFormData.listId;
      if (!targetListId) {
          if (taskLists && taskLists.length > 0) {
              targetListId = taskLists[0].id;
          } else if (onAddTaskList) {
              // Create a default list if none exists
              const newListId = crypto.randomUUID();
              await onAddTaskList({
                  id: newListId,
                  title: 'Minhas Tarefas'
              });
              targetListId = newListId;
          } else {
              alert("Por favor, crie uma lista de tarefas primeiro.");
              return;
          }
      }

      if (taskFormData.id) {
          await onUpdateTask(taskFormData.id, {
              title: taskFormData.title,
              description: taskFormData.description,
              listId: targetListId,
              dueDate: taskFormData.dueDate
          });
      } else {
          await onAddTask({
              title: taskFormData.title,
              description: taskFormData.description,
              listId: targetListId,
              completed: false,
              dueDate: taskFormData.dueDate
          });
      }

      setIsTaskModalOpen(false);
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
    
    // Find agenda events for this day
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);
    const dayAgendaEvents = displayedAgendaEvents.filter(e => {
        const eStart = new Date(e.startDate);
        eStart.setHours(0, 0, 0, 0);
        const eEnd = new Date(e.endDate);
        eEnd.setHours(23, 59, 59, 999);
        return targetDate >= eStart && targetDate <= eEnd;
    });

    const dayTasks = tasks?.filter(t => {
        if (!t.dueDate) return false;
        const [tYear, tMonth, tDay] = t.dueDate.split('-').map(Number);
        return tDay === day && tMonth === month + 1 && tYear === year;
    }) || [];

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
            <div className="flex gap-1">
                {dayAgendaEvents.length > 0 && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title={`${dayAgendaEvents.length} Eventos`}></div>
                )}
                {dayTasks.length > 0 && (
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" title={`${dayTasks.length} Tarefas`}></div>
                )}
                {dayTrans.some(t => t.status === 'pending') && (
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" title="Pagamentos Pendentes"></div>
                )}
            </div>
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
           {dayAgendaEvents.length > 0 && (
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-1 rounded truncate">
                 {dayAgendaEvents.length} Evento{dayAgendaEvents.length > 1 ? 's' : ''}
              </div>
           )}
           {dayTasks.length > 0 && (
              <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-900/30 px-1 rounded truncate">
                 {dayTasks.length} Tarefa{dayTasks.length > 1 ? 's' : ''}
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
       
       {/* EISENHOWER MATRIX SHORTCUT */}
       {onNavigate && (
         <div 
           onClick={() => onNavigate('EISENHOWER')}
           className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-between group"
         >
           <div className="flex items-center gap-4">
             <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
               <Grid className="w-6 h-6 text-white" />
             </div>
             <div>
               <h3 className="text-white font-bold text-lg">Matriz de Eisenhower</h3>
               <p className="text-indigo-100 text-sm opacity-90">Priorize suas tarefas e foque no que importa</p>
             </div>
           </div>
           <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
             <ChevronRight className="w-5 h-5 text-white" />
           </div>
         </div>
       )}

       <AIAgendaAssistant 
          onAddEvent={(event) => {
            if (onAddAgendaEvent) {
              onAddAgendaEvent({
                ...event,
                id: Date.now().toString(),
                userId: auth.currentUser?.uid || ''
              });
            }
          }}
          onAddTask={(task) => {
            if (onAddTask) {
              // Get or create a default list
              let defaultListId = taskLists.length > 0 ? taskLists[0].id : 'default';
              if (taskLists.length === 0 && onAddTaskList) {
                onAddTaskList({ id: 'default', title: 'Tarefas Gerais' });
              }
              onAddTask({
                ...task,
                id: Date.now().toString(),
                listId: defaultListId,
                userId: auth.currentUser?.uid || ''
              });
            }
          }}
        />

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

       {/* ADD AGENDA EVENT MODAL */}
       {isAgendaModalOpen && (
           <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
               <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
                   <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                       <div>
                           <h3 className="text-lg font-bold text-slate-800 dark:text-white">{agendaFormData.id ? 'Editar Evento' : 'Novo Evento'}</h3>
                           <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                               <CalendarClock className="w-3 h-3" />
                               {selectedDay} de {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                           </p>
                       </div>
                       <button onClick={() => setIsAgendaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                           <X className="w-5 h-5" />
                       </button>
                   </div>
                   
                   <form onSubmit={handleAgendaSubmit} className="p-6 space-y-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Título</label>
                           <input 
                               autoFocus
                               required
                               type="text" 
                               placeholder="Ex: Reunião, Consulta..."
                               value={agendaFormData.title}
                               onChange={(e) => setAgendaFormData({...agendaFormData, title: e.target.value})}
                               className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                           />
                       </div>

                       <div>
                           <label className="flex items-center gap-2 cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   checked={agendaFormData.allDay}
                                   onChange={(e) => setAgendaFormData({...agendaFormData, allDay: e.target.checked})}
                                   className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                               />
                               <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dia inteiro</span>
                           </label>
                       </div>

                       {!agendaFormData.allDay && (
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Início</label>
                                   <input 
                                       required
                                       type="time"
                                       value={agendaFormData.startTime}
                                       onChange={(e) => setAgendaFormData({...agendaFormData, startTime: e.target.value})}
                                       className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                   />
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Fim</label>
                                   <input 
                                       required
                                       type="time"
                                       value={agendaFormData.endTime}
                                       onChange={(e) => setAgendaFormData({...agendaFormData, endTime: e.target.value})}
                                       className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                   />
                               </div>
                           </div>
                       )}

                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição (Opcional)</label>
                           <textarea 
                               placeholder="Detalhes adicionais..."
                               value={agendaFormData.description}
                               onChange={(e) => setAgendaFormData({...agendaFormData, description: e.target.value})}
                               className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                           />
                       </div>

                       <button 
                           type="submit"
                           className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                       >
                           {agendaFormData.id ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />} 
                           {agendaFormData.id ? 'Atualizar Evento' : 'Salvar Evento'}
                       </button>
                   </form>
               </div>
           </div>
       )}

       {/* ADD TASK MODAL */}
       {isTaskModalOpen && (
           <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
               <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
                   <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                       <div>
                           <h3 className="text-lg font-bold text-slate-800 dark:text-white">{taskFormData.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                           <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                               <ListTodo className="w-3 h-3" />
                               {selectedDay} de {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                           </p>
                       </div>
                       <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                           <X className="w-5 h-5" />
                       </button>
                   </div>
                   
                   <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Título</label>
                           <input 
                               autoFocus
                               required
                               type="text" 
                               placeholder="Ex: Pagar conta de luz, Comprar leite..."
                               value={taskFormData.title}
                               onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})}
                               className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                           />
                       </div>

                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Data de Vencimento</label>
                           <input 
                               required
                               type="date" 
                               value={taskFormData.dueDate}
                               onChange={(e) => setTaskFormData({...taskFormData, dueDate: e.target.value})}
                               className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                           />
                       </div>

                       {taskLists && taskLists.length > 0 && (
                           <div className="flex items-end gap-2">
                               <div className="flex-1">
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Lista</label>
                                   <select
                                       value={taskFormData.listId}
                                       onChange={(e) => setTaskFormData({...taskFormData, listId: e.target.value})}
                                       className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                   >
                                       {taskLists.map(list => (
                                           <option key={list.id} value={list.id}>{list.title}</option>
                                       ))}
                                   </select>
                               </div>
                               <button 
                                   type="button" 
                                   onClick={() => setIsListManagerOpen(true)} 
                                   className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors border border-slate-200 dark:border-slate-600" 
                                   title="Gerenciar Listas"
                               >
                                   <Layers className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                               </button>
                           </div>
                       )}

                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição (Opcional)</label>
                           <textarea 
                               placeholder="Detalhes adicionais..."
                               value={taskFormData.description}
                               onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})}
                               className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] resize-none"
                           />
                       </div>

                       <button 
                           type="submit"
                           className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                       >
                           {taskFormData.id ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />} 
                           {taskFormData.id ? 'Atualizar Tarefa' : 'Salvar Tarefa'}
                       </button>
                   </form>
               </div>
           </div>
       )}

       {/* LIST MANAGER MODAL */}
       {isListManagerOpen && (
           <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
               <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
                   <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                       <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <Layers className="w-5 h-5 text-indigo-500" />
                           Gerenciar Listas
                       </h3>
                       <button onClick={() => setIsListManagerOpen(false)} className="text-slate-400 hover:text-slate-600">
                           <X className="w-5 h-5" />
                       </button>
                   </div>
                   <div className="p-6 space-y-4">
                       <div className="flex gap-2">
                           <input
                               type="text"
                               placeholder="Nome da nova lista..."
                               value={newListName}
                               onChange={(e) => setNewListName(e.target.value)}
                               onKeyDown={async (e) => {
                                   if (e.key === 'Enter') {
                                       e.preventDefault();
                                       if (!newListName.trim() || !onAddTaskList) return;
                                       const newListId = crypto.randomUUID();
                                       await onAddTaskList({ id: newListId, title: newListName.trim() });
                                       setNewListName('');
                                       setTaskFormData(prev => ({ ...prev, listId: newListId }));
                                   }
                               }}
                               className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <button
                               type="button"
                               onClick={async () => {
                                   if (!newListName.trim() || !onAddTaskList) return;
                                   const newListId = crypto.randomUUID();
                                   await onAddTaskList({ id: newListId, title: newListName.trim() });
                                   setNewListName('');
                                   setTaskFormData(prev => ({ ...prev, listId: newListId }));
                               }}
                               className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
                           >
                               <Plus className="w-5 h-5" />
                           </button>
                       </div>
                       
                       <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                           {taskLists?.map(list => (
                               <div key={list.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                   {editingListId === list.id ? (
                                       <input
                                           autoFocus
                                           type="text"
                                           value={editingListName}
                                           onChange={(e) => setEditingListName(e.target.value)}
                                           onBlur={async () => {
                                               if (editingListName.trim() && editingListName !== list.title && onUpdateTaskList) {
                                                   await onUpdateTaskList(list.id, { title: editingListName.trim() });
                                               }
                                               setEditingListId(null);
                                           }}
                                           onKeyDown={async (e) => {
                                               if (e.key === 'Enter') {
                                                   if (editingListName.trim() && editingListName !== list.title && onUpdateTaskList) {
                                                       await onUpdateTaskList(list.id, { title: editingListName.trim() });
                                                   }
                                                   setEditingListId(null);
                                               }
                                           }}
                                           className="flex-1 px-2 py-1 rounded border border-indigo-500 dark:bg-slate-700 dark:text-white outline-none"
                                       />
                                   ) : (
                                       <span className="font-medium text-slate-700 dark:text-slate-200">{list.title}</span>
                                   )}
                                   <div className="flex items-center gap-1">
                                       <button
                                           type="button"
                                           onClick={() => {
                                               setEditingListId(list.id);
                                               setEditingListName(list.title);
                                           }}
                                           className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                       >
                                           <Edit2 className="w-4 h-4" />
                                       </button>
                                       <button
                                           type="button"
                                           onClick={async () => {
                                               if (window.confirm('Excluir esta lista apagará todas as tarefas nela. Continuar?')) {
                                                   if (onDeleteTaskList) await onDeleteTaskList(list.id);
                                                   if (taskFormData.listId === list.id) {
                                                       setTaskFormData(prev => ({ ...prev, listId: taskLists.find(l => l.id !== list.id)?.id || '' }));
                                                   }
                                               }
                                           }}
                                           className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                       >
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
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
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
                <button 
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Mês
                </button>
                <button 
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Semana
                </button>
                <button 
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Dia
                </button>
            </div>

            <button 
                onClick={() => exportToICS(displayedTransactions)}
                className="p-2 text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                title="Exportar para Arquivo (.ics)"
            >
                <Download className="w-5 h-5" />
            </button>

            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex-1 md:flex-none justify-center">
                <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
                <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 font-semibold text-slate-700 dark:text-slate-200 capitalize min-w-[140px] text-center">
                {viewMode === 'day' 
                    ? new Date(year, month, selectedDay || 1).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
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
         {viewMode === 'month' ? (
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
         ) : viewMode === 'week' ? (
             <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
                 {/* Week Header */}
                 <div className="grid grid-cols-8 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                     <div className="py-3 border-r border-slate-200 dark:border-slate-600"></div>
                     {weekDays.map((d, i) => (
                         <div key={i} onClick={() => { setSelectedDay(d.getDate()); setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1)); }} className={`py-2 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 ${d.getDate() === selectedDay && d.getMonth() === month ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                             <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">{DAYS_OF_WEEK[i]}</div>
                             <div className={`text-lg font-bold ${d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear() ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                 {d.getDate()}
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 {/* All Day Section */}
                 <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-600 max-h-32 overflow-y-auto">
                     <div className="py-2 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-600 flex items-center justify-center">
                         O Dia Todo
                     </div>
                     {weekDays.map((d, i) => {
                         const dayTrans = displayedTransactions.filter(t => {
                             const [tYear, tMonth, tDay] = t.date.split('-').map(Number);
                             return tDay === d.getDate() && tMonth === d.getMonth() + 1 && tYear === d.getFullYear();
                         });
                         const dayTasks = tasks?.filter(t => {
                             if (!t.dueDate) return false;
                             const [tYear, tMonth, tDay] = t.dueDate.split('-').map(Number);
                             return tDay === d.getDate() && tMonth === d.getMonth() + 1 && tYear === d.getFullYear();
                         }) || [];
                         const dayAgendaEvents = displayedAgendaEvents.filter(e => {
                             const eStart = new Date(e.startDate);
                             eStart.setHours(0, 0, 0, 0);
                             const eEnd = new Date(e.endDate);
                             eEnd.setHours(23, 59, 59, 999);
                             const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                             return targetDate >= eStart && targetDate <= eEnd && e.allDay;
                         });

                         return (
                             <div key={i} className="p-1 border-r border-slate-200 dark:border-slate-600 min-h-[40px]">
                                 {dayTrans.map(t => (
                                     <div key={t.id} className={`text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                         {t.type === 'income' ? '+' : '-'}{formatValue(t.amount)} {t.description}
                                     </div>
                                 ))}
                                 {dayTasks.map(t => (
                                     <div key={t.id} className="text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                         {t.title}
                                     </div>
                                 ))}
                                 {dayAgendaEvents.map(e => (
                                     <div key={e.id} onClick={() => handleEditAgendaEvent(e)} className="cursor-pointer text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                         {e.title}
                                     </div>
                                 ))}
                             </div>
                         );
                     })}
                 </div>

                 {/* Time Grid */}
                 <div className="flex-1 overflow-y-auto relative">
                     <div className="grid grid-cols-8">
                         {/* Time Labels */}
                         <div className="border-r border-slate-200 dark:border-slate-600">
                             {Array.from({ length: 24 }).map((_, i) => (
                                 <div key={i} className="h-12 border-b border-slate-100 dark:border-slate-700/50 text-right pr-2 py-1">
                                     <span className="text-[10px] text-slate-400 font-medium">{`${i.toString().padStart(2, '0')}:00`}</span>
                                 </div>
                             ))}
                         </div>
                         
                         {/* Day Columns */}
                         {weekDays.map((d, dayIdx) => {
                             const dayAgendaEvents = displayedAgendaEvents.filter(e => {
                                 const eStart = new Date(e.startDate);
                                 const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                                 return eStart.getDate() === targetDate.getDate() && eStart.getMonth() === targetDate.getMonth() && eStart.getFullYear() === targetDate.getFullYear() && !e.allDay;
                             });

                             return (
                                 <div key={dayIdx} className="border-r border-slate-200 dark:border-slate-600 relative">
                                     {Array.from({ length: 24 }).map((_, i) => (
                                         <div key={i} className="h-12 border-b border-slate-100 dark:border-slate-700/50"></div>
                                     ))}
                                     
                                     {/* Render Events */}
                                     {dayAgendaEvents.map(e => {
                                         const start = new Date(e.startDate);
                                         const end = new Date(e.endDate);
                                         const startHour = start.getHours() + start.getMinutes() / 60;
                                         const endHour = end.getHours() + end.getMinutes() / 60;
                                         const top = startHour * 48; // 48px per hour (h-12)
                                         const height = Math.max((endHour - startHour) * 48, 20); // Min height 20px

                                         return (
                                             <div 
                                                 key={e.id}
                                                 onClick={() => handleEditAgendaEvent(e)}
                                                 className="absolute left-1 right-1 rounded-md bg-blue-500/90 hover:bg-blue-600 text-white p-1 overflow-hidden cursor-pointer shadow-sm transition-colors z-10"
                                                 style={{ top: `${top}px`, height: `${height}px` }}
                                             >
                                                 <div className="text-[10px] font-bold leading-tight truncate">{e.title}</div>
                                                 {height >= 40 && (
                                                     <div className="text-[9px] opacity-80 leading-tight truncate">
                                                         {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                     </div>
                                                 )}
                                             </div>
                                         );
                                     })}
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             </div>
         ) : (
             <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
                 {/* Day Header */}
                 <div className="grid grid-cols-[60px_1fr] bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                     <div className="py-3 border-r border-slate-200 dark:border-slate-600"></div>
                     <div className="py-2 text-center bg-indigo-50 dark:bg-indigo-900/20">
                         <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                             {DAYS_OF_WEEK[new Date(year, month, selectedDay || 1).getDay()]}
                         </div>
                         <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                             {selectedDay || 1}
                         </div>
                     </div>
                 </div>
                 
                 {/* All Day Section */}
                 <div className="grid grid-cols-[60px_1fr] border-b border-slate-200 dark:border-slate-600 max-h-32 overflow-y-auto">
                     <div className="py-2 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-600 flex items-center justify-center">
                         O Dia Todo
                     </div>
                     <div className="p-1 min-h-[40px]">
                         {(() => {
                             const d = new Date(year, month, selectedDay || 1);
                             const dayTrans = displayedTransactions.filter(t => {
                                 const [tYear, tMonth, tDay] = t.date.split('-').map(Number);
                                 return tDay === d.getDate() && tMonth === d.getMonth() + 1 && tYear === d.getFullYear();
                             });
                             const dayTasks = tasks?.filter(t => {
                                 if (!t.dueDate) return false;
                                 const [tYear, tMonth, tDay] = t.dueDate.split('-').map(Number);
                                 return tDay === d.getDate() && tMonth === d.getMonth() + 1 && tYear === d.getFullYear();
                             }) || [];
                             const dayAgendaEvents = displayedAgendaEvents.filter(e => {
                                 const eStart = new Date(e.startDate);
                                 eStart.setHours(0, 0, 0, 0);
                                 const eEnd = new Date(e.endDate);
                                 eEnd.setHours(23, 59, 59, 999);
                                 const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                                 return targetDate >= eStart && targetDate <= eEnd && e.allDay;
                             });

                             return (
                                 <>
                                     {dayTrans.map(t => (
                                         <div key={t.id} className={`text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                             {t.type === 'income' ? '+' : '-'}{formatValue(t.amount)} {t.description}
                                         </div>
                                     ))}
                                     {dayTasks.map(t => (
                                         <div key={t.id} className="text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                             {t.title}
                                         </div>
                                     ))}
                                     {dayAgendaEvents.map(e => (
                                         <div key={e.id} onClick={() => handleEditAgendaEvent(e)} className="cursor-pointer text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                             {e.title}
                                         </div>
                                     ))}
                                 </>
                             );
                         })()}
                     </div>
                 </div>

                 {/* Time Grid */}
                 <div className="flex-1 overflow-y-auto relative">
                     <div className="grid grid-cols-[60px_1fr]">
                         {/* Time Labels */}
                         <div className="border-r border-slate-200 dark:border-slate-600">
                             {Array.from({ length: 24 }).map((_, i) => (
                                 <div key={i} className="h-12 border-b border-slate-100 dark:border-slate-700/50 text-right pr-2 py-1">
                                     <span className="text-[10px] text-slate-400 font-medium">{`${i.toString().padStart(2, '0')}:00`}</span>
                                 </div>
                             ))}
                         </div>
                         
                         {/* Day Column */}
                         <div className="relative">
                             {Array.from({ length: 24 }).map((_, i) => (
                                 <div key={i} className="h-12 border-b border-slate-100 dark:border-slate-700/50"></div>
                             ))}
                             
                             {/* Render Events */}
                             {(() => {
                                 const d = new Date(year, month, selectedDay || 1);
                                 const dayAgendaEvents = displayedAgendaEvents.filter(e => {
                                     const eStart = new Date(e.startDate);
                                     const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                                     return eStart.getDate() === targetDate.getDate() && eStart.getMonth() === targetDate.getMonth() && eStart.getFullYear() === targetDate.getFullYear() && !e.allDay;
                                 });

                                 return dayAgendaEvents.map(e => {
                                     const start = new Date(e.startDate);
                                     const end = new Date(e.endDate);
                                     const startHour = start.getHours() + start.getMinutes() / 60;
                                     const endHour = end.getHours() + end.getMinutes() / 60;
                                     const top = startHour * 48; // 48px per hour (h-12)
                                     const height = Math.max((endHour - startHour) * 48, 20); // Min height 20px

                                     return (
                                         <div 
                                             key={e.id}
                                             onClick={() => handleEditAgendaEvent(e)}
                                             className="absolute left-1 right-1 rounded-md bg-blue-500/90 hover:bg-blue-600 text-white p-1 overflow-hidden cursor-pointer shadow-sm transition-colors z-10"
                                             style={{ top: `${top}px`, height: `${height}px` }}
                                         >
                                             <div className="text-[10px] font-bold leading-tight truncate">{e.title}</div>
                                             {height >= 40 && (
                                                 <div className="text-[9px] opacity-80 leading-tight truncate">
                                                     {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 });
                             })()}
                         </div>
                     </div>
                 </div>
             </div>
         )}

         {/* Details Sidebar */}
         <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-0 overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {selectedDay ? `${selectedDay} de ${currentDate.toLocaleDateString('pt-BR', { month: 'long' })}` : 'Resumo do Mês'}
                </h3>
                {selectedDay && (
                    <div className="flex gap-2 mt-3">
                        <button 
                            onClick={handleOpenModal}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Transação
                        </button>
                        <button 
                            onClick={handleOpenAgendaModal}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                            <CalendarClock className="w-3 h-3" /> Evento
                        </button>
                        <button 
                            onClick={handleOpenTaskModal}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                            <ListTodo className="w-3 h-3" /> Tarefa
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {selectedDay && selectedTransactions.length === 0 && selectedAgendaEvents.length === 0 && (!tasks || tasks.filter(t => {
                   if (!t.dueDate) return false;
                   const [tYear, tMonth, tDay] = t.dueDate.split('-').map(Number);
                   return tDay === selectedDay && tMonth === month + 1 && tYear === year;
               }).length === 0) && (
                  <div className="text-center py-10">
                      <CalendarClock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Nenhuma movimentação, evento ou tarefa.</p>
                  </div>
               )}
               {!selectedDay && (
                  <div className="text-center py-10">
                      <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
                          <CalendarIcon className="w-8 h-8 text-indigo-500" />
                      </div>
                      <p className="text-slate-500 font-medium">Selecione um dia</p>
                      <p className="text-slate-400 text-xs mt-1">Clique no calendário para ver detalhes ou adicionar contas e eventos.</p>
                  </div>
               )}
               
               {/* Render Agenda Events */}
               {selectedAgendaEvents.map((event) => (
                 <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                       <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mt-0.5">
                          <CalendarIcon className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-sm">{event.title}</p>
                          {event.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{event.description}</p>}
                          <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.allDay ? 'Dia Inteiro' : `${new Date(event.startDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - ${new Date(event.endDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`}
                              </span>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <button 
                            onClick={() => handleEditAgendaEvent(event)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                            title="Editar Evento"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDeleteAgendaEvent(event.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                            title="Excluir Evento"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
               ))}

               {/* Render Tasks */}
               {tasks && tasks.filter(t => {
                   if (!t.dueDate) return false;
                   const [tYear, tMonth, tDay] = t.dueDate.split('-').map(Number);
                   return tDay === selectedDay && tMonth === month + 1 && tYear === year;
               }).map(task => (
                   <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${task.completed ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60' : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}>
                       <div className="flex items-start gap-3">
                           <button 
                               onClick={() => onUpdateTask && onUpdateTask(task.id, { completed: !task.completed })}
                               className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-indigo-500'}`}
                           >
                               {task.completed && <Check className="w-3 h-3" />}
                           </button>
                           <div>
                               <p className={`font-semibold text-sm ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>{task.title}</p>
                               {task.description && <p className={`text-xs mt-0.5 line-clamp-2 ${task.completed ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{task.description}</p>}
                               <div className="flex items-center gap-2 mt-1">
                                   <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                       <ListTodo className="w-3 h-3" />
                                       {taskLists?.find(l => l.id === task.listId)?.title || 'Tarefa'}
                                   </span>
                               </div>
                           </div>
                       </div>
                       <div className="flex flex-col gap-1">
                           <button 
                               onClick={() => {
                                   setTaskFormData({
                                       id: task.id,
                                       title: task.title,
                                       description: task.description || '',
                                       listId: task.listId,
                                       dueDate: task.dueDate || ''
                                   });
                                   setIsTaskModalOpen(true);
                               }}
                               className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                               title="Editar Tarefa"
                           >
                               <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                               onClick={() => onDeleteTask && onDeleteTask(task.id)}
                               className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                               title="Excluir Tarefa"
                           >
                               <Trash2 className="w-4 h-4" />
                           </button>
                       </div>
                   </div>
               ))}

               {/* Render Transactions */}
               {selectedTransactions.map((t, idx) => {
                 const showPendingSeparator = (idx === 0 && t.status === 'pending') || (idx > 0 && selectedTransactions[idx - 1].status === 'paid' && t.status === 'pending');
                 const showPaidSeparator = idx === 0 && t.status === 'paid';
                 const canMoveUp = idx > 0 && selectedTransactions[idx - 1].status === t.status;
                 const canMoveDown = idx < selectedTransactions.length - 1 && selectedTransactions[idx + 1].status === t.status;
                 
                 return (
                   <React.Fragment key={t.id || idx}>
                     {showPaidSeparator && (
                         <div className="flex items-center gap-2 py-2">
                             <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pagos</span>
                             <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                         </div>
                     )}
                     {showPendingSeparator && (
                         <div className="flex items-center gap-2 py-2">
                             <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pendentes</span>
                             <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                         </div>
                     )}
                     <div className={`flex items-center justify-between p-3 rounded-lg border ${
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
                        <div className="flex items-center gap-3">
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
                            {onUpdateTransaction && !(t as any).isGhost && (
                                <div className="flex flex-col gap-0.5 border-l border-slate-100 dark:border-slate-700 pl-2 ml-1">
                                    <button 
                                        onClick={() => handleMoveTransaction(idx, 'up')}
                                        disabled={!canMoveUp}
                                        className={`p-0.5 rounded ${canMoveUp ? 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600' : 'text-slate-200 dark:text-slate-600 cursor-not-allowed'}`}
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleMoveTransaction(idx, 'down')}
                                        disabled={!canMoveDown}
                                        className={`p-0.5 rounded ${canMoveDown ? 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600' : 'text-slate-200 dark:text-slate-600 cursor-not-allowed'}`}
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                     </div>
                   </React.Fragment>
                 );
               })}
            </div>
         </div>
      </div>
    </div>
  );
};
