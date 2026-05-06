import React, { useState, useMemo, useEffect } from "react";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  Budget,
  AgendaEvent,
  TaskList,
  Task,
  View,
  } from "../types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowUp,
  ArrowDown,
  Clock,
  Filter,
  Plus,
  CalendarClock,
  Download,
  Layers,
  X,
  Check,
  CreditCard,
  Tag,
  AlignLeft,
  DollarSign,
  Bell,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  ListTodo,
  ChevronUp,
  ChevronDown,
  Grid,
  Repeat,
  CheckSquare,
  Moon,
  Banknote,
} from "lucide-react";
import { updateTransactionFire } from "../services/storageService";
import { auth } from "../services/firebase";
import { AIAgendaAssistant } from "./AIAgendaAssistant";
import { CurrencyInput } from "./CurrencyInput";

import { AddTransactionModal } from "./calendar/AddTransactionModal";
import { AddAgendaEventModal } from "./calendar/AddAgendaEventModal";
import { AddTaskModal } from "./calendar/AddTaskModal";
import { ListManagerModal } from "./calendar/ListManagerModal";
import { DetailsSidebar } from "./calendar/DetailsSidebar";

interface FinancialCalendarProps {
  transactions: Transaction[];
  budgets: Budget[]; // Added budget prop
  agendaEvents?: AgendaEvent[];
  taskLists?: TaskList[];
  tasks?: Task[];
  onAddTransaction: (t: Omit<Transaction, "id">) => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onAddAgendaEvent?: (e: Omit<AgendaEvent, "id" | "updatedAt">) => void;
  onUpdateAgendaEvent?: (id: string, updates: Partial<AgendaEvent>) => void;
  onDeleteAgendaEvent?: (id: string) => void;
  onAddTaskList?: (
    list: Omit<TaskList, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => void;
  onUpdateTaskList?: (id: string, updates: Partial<TaskList>) => void;
  onDeleteTaskList?: (id: string) => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDeleteTask?: (id: string) => void;
  privacyMode: boolean;
  onNavigate?: (view: any) => void;
  currentView?: View;
}

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const CATEGORIES = [
  "Casa",
  "Mobilidade",
  "Alimentos",
  "Lazer",
  "Saúde",
  "Educação",
  "Pets",
  "Salário",
  "Renda Extra",
  "Investimentos",
  "Outros",
];
const PAYMENT_METHODS = [
  { value: "credit_card", label: "Crédito" },
  { value: "debit_card", label: "Débito" },
  { value: "pix", label: "PIX" },
  { value: "cash", label: "Dinheiro" },
  { value: "direct_debit", label: "Débito Auto." },
  { value: "boleto", label: "Boleto" },
];

type ViewFilter = "all" | "income" | "expense" | "pending";

// Helper for exporting ICS
const exportToICS = (events: any[]) => {
  let icsContent =
    "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NEXO Finance//PT-BR\n";

  events.forEach((evt) => {
    const dateStr = evt.date.replace(/-/g, "");
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
    icsContent += `DTEND;VALUE=DATE:${dateStr}\n`;
    icsContent += `SUMMARY:${evt.description} (${evt.type === "income" ? "+" : "-"} R$ ${evt.amount})\n`;
    icsContent += `DESCRIPTION:Categoria: ${evt.category} | Status: ${evt.status} ${evt.observation ? "| Obs: " + evt.observation : ""}\n`;
    icsContent += "END:VEVENT\n";
  });

  icsContent += "END:VCALENDAR";

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", "nexo_agenda.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const calculateEventLayout = (events: AgendaEvent[]) => {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  const layout = sorted.map((e) => ({
    e,
    start: new Date(e.startDate).getTime(),
    end: new Date(e.endDate).getTime(),
    colIndex: 0,
    clusterSize: 1,
  }));

  let columns: (typeof layout[0])[][] = [];
  let lastEventEnding: number | null = null;
  let activeCluster: typeof layout = [];

  for (const ev of layout) {
    if (lastEventEnding !== null && ev.start >= lastEventEnding) {
      activeCluster.forEach((c) => (c.clusterSize = columns.length || 1));
      columns = [];
      lastEventEnding = null;
      activeCluster = [];
    }

    let placed = false;
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col[col.length - 1].end <= ev.start) {
            col.push(ev);
            ev.colIndex = i;
            placed = true;
            break;
        }
    }
    if (!placed) {
        ev.colIndex = columns.length;
        columns.push([ev]);
    }

    if (lastEventEnding === null || ev.end > lastEventEnding) {
      lastEventEnding = ev.end;
    }
    activeCluster.push(ev);
  }

  activeCluster.forEach((c) => (c.clusterSize = columns.length || 1));
  return layout;
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
  onNavigate,
  currentView,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    new Date().getDate(),
  );
  const [filterType, setFilterType] = useState<ViewFilter>("all");
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("week");
  const [collapseEarlyHours, setCollapseEarlyHours] = useState(true);
  
  const hourOffset = collapseEarlyHours ? 6 : 0;
  const hoursToRender = useMemo(() => {
    return collapseEarlyHours 
      ? Array.from({ length: 18 }).map((_, i) => i + 6)
      : Array.from({ length: 24 }).map((_, i) => i);
  }, [collapseEarlyHours]);
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isListManagerOpen, setIsListManagerOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState("");
  const [agendaFormData, setAgendaFormData] = useState({
    id: "",
    title: "",
    description: "",
    color: "#3b82f6", // default blue
    checklist: [] as { id: string; text: string; isCompleted: boolean }[],
    startTime: "",
    endTime: "",
    allDay: true,
    isRecurring: false,
    recurrencePeriod: "daily" as
      | "daily"
      | "every_other_day"
      | "weekly"
      | "monthly"
      | "yearly"
      | "custom_days",
    recurrenceDays: [] as number[],
    recurrenceEndDate: "",
    isRoutine: false,
  });
  const [taskFormData, setTaskFormData] = useState({
    id: "",
    title: "",
    description: "",
    listId: "",
    dueDate: "",
  });
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense" as TransactionType,
    category: "Outros",
    paymentMethod: "credit_card" as PaymentMethod,
    status: "pending" as TransactionStatus,
    observation: "",
    time: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to get days in month
  const getDaysInMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) =>
    new Date(y, m, 1).getDay();

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
    const alerts: { title: string; message: string; type: "warning" }[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthStr = today.toISOString().slice(0, 7);

    // Only process if we are viewing the current month to show relevant alerts
    // or always show alerts for current real time month regardless of calendar view?
    // Let's show alerts based on "Real Time" status like dashboard

    budgets.forEach((budget) => {
      // Find if this budget applies to current real month
      const isRelevant =
        (budget.isRecurring &&
          !budgets.some(
            (b) =>
              b.category === budget.category &&
              b.month === monthStr &&
              !b.isRecurring,
          )) ||
        budget.month === monthStr;

      if (!isRelevant) return;

      const spent = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.category === budget.category &&
            new Date(t.date).getMonth() === currentMonth &&
            new Date(t.date).getFullYear() === currentYear,
        )
        .reduce((sum, t) => sum + t.amount, 0);

      if (spent >= budget.limit) {
        alerts.push({
          title: `Limite Excedido: ${budget.category}`,
          message: `Você estourou o teto definido para esta categoria.`,
          type: "warning",
        });
      }
    });
    return alerts;
  }, [budgets, transactions]);

  // --- GHOSTING LOGIC (Projection) ---
  const displayedTransactions = useMemo(() => {
    // 1. Real Transactions for this month
    const realTransactions = transactions.filter((t) => {
      const [tYear, tMonth] = t.date.split("-").map(Number);
      return tYear === year && tMonth === month + 1;
    });

    // 2. Identify Recurring Templates from history
    const recurringTemplates = new Map<string, Transaction>();
    transactions.forEach((t) => {
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
        const hasRealInstance = realTransactions.some(
          (t) =>
            t.description === template.description &&
            t.amount === template.amount,
        );

        if (!hasRealInstance) {
          const originalDate = new Date(template.date);
          const day = originalDate.getDate();
          const validDay = Math.min(day, daysInMonth);

          if (originalDate < new Date(year, month + 1, 0)) {
            ghostTransactions.push({
              ...template,
              id: `ghost-${template.id}-${year}-${month}`,
              date: `${year}-${String(month + 1).padStart(2, "0")}-${String(validDay).padStart(2, "0")}`,
              status: "pending",
              isGhost: true,
            });
          }
        }
      });
    }

    return [...realTransactions, ...ghostTransactions].filter((t) => {
      if (filterType === "all") return true;
      if (filterType === "pending") return t.status === "pending";
      return t.type === filterType;
    });
  }, [transactions, year, month, daysInMonth, filterType]);

  // Agenda Events for this month
  const displayedAgendaEvents = useMemo(() => {
    const allEvents: AgendaEvent[] = [];
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    agendaEvents.forEach((e) => {
      const eStart = new Date(e.startDate);
      const eEnd = new Date(e.endDate);
      const duration = eEnd.getTime() - eStart.getTime();

      if (!e.isRecurring) {
        if (eStart <= monthEnd && eEnd >= monthStart) {
          allEvents.push(e);
        }
        return;
      }

      // Handle recurrence
      const recEnd = e.recurrenceEndDate
        ? new Date(`${e.recurrenceEndDate}T23:59:59`)
        : new Date(monthEnd.getFullYear() + 5, 11, 31);

      let currentInstanceStart = new Date(eStart);
      while (
        currentInstanceStart <= monthEnd &&
        currentInstanceStart <= recEnd
      ) {
        const currentInstanceEnd = new Date(
          currentInstanceStart.getTime() + duration,
        );

        if (currentInstanceEnd >= monthStart) {
          if (
            e.recurrencePeriod === "custom_days" &&
            e.recurrenceDays &&
            e.recurrenceDays.length > 0
          ) {
            if (e.recurrenceDays.includes(currentInstanceStart.getDay())) {
              allEvents.push({
                ...e,
                startDate: currentInstanceStart.toISOString(),
                endDate: currentInstanceEnd.toISOString(),
                isGhost: currentInstanceStart.getTime() !== eStart.getTime(),
              });
            }
          } else {
            allEvents.push({
              ...e,
              startDate: currentInstanceStart.toISOString(),
              endDate: currentInstanceEnd.toISOString(),
              isGhost: currentInstanceStart.getTime() !== eStart.getTime(),
            });
          }
        }

        // Advance to next instance
        if (
          e.recurrencePeriod === "daily" ||
          e.recurrencePeriod === "custom_days"
        ) {
          currentInstanceStart.setDate(currentInstanceStart.getDate() + 1);
        } else if (e.recurrencePeriod === "every_other_day") {
          currentInstanceStart.setDate(currentInstanceStart.getDate() + 2);
        } else if (e.recurrencePeriod === "weekly") {
          currentInstanceStart.setDate(currentInstanceStart.getDate() + 7);
        } else if (e.recurrencePeriod === "monthly") {
          currentInstanceStart.setMonth(currentInstanceStart.getMonth() + 1);
        } else if (e.recurrencePeriod === "yearly") {
          currentInstanceStart.setFullYear(
            currentInstanceStart.getFullYear() + 1,
          );
        } else {
          break; // failsafe
        }
      }
    });

    return allEvents;
  }, [agendaEvents, year, month]);

  // Selected Day Transactions and Events
  const selectedTransactions = useMemo(() => {
    if (selectedDay === null) return [];
    return displayedTransactions
      .filter((t) => {
        const day = parseInt(t.date.split("-")[2]);
        return day === selectedDay;
      })
      .sort((a, b) => {
        // 1. Paid first, Pending last
        if (a.status === "paid" && b.status === "pending") return -1;
        if (a.status === "pending" && b.status === "paid") return 1;

        // 2. Custom order
        if (a.order !== undefined || b.order !== undefined) {
          const orderA = a.order || 0;
          const orderB = b.order || 0;
          return orderA - orderB;
        }

        // 3. Time
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time && !b.time) return -1; // timed before all-day
        if (!a.time && b.time) return 1;

        return 0;
      });
  }, [displayedTransactions, selectedDay]);

  const selectedAgendaEvents = useMemo(() => {
    if (selectedDay === null) return [];
    const targetDate = new Date(year, month, selectedDay);
    targetDate.setHours(0, 0, 0, 0);

    return displayedAgendaEvents.filter((e) => {
      const eStart = new Date(e.startDate);
      eStart.setHours(0, 0, 0, 0);
      const eEnd = new Date(e.endDate);
      eEnd.setHours(23, 59, 59, 999);

      return targetDate >= eStart && targetDate <= eEnd;
    });
  }, [displayedAgendaEvents, selectedDay, year, month]);

  const timelessTasks = useMemo(() => {
    return tasks?.filter(t => !t.dueDate && !t.completed) || [];
  }, [tasks]);


  const todayTasks = useMemo(() => {
    if (selectedDay === null) return [];
    return tasks?.filter((t) => {
      if (!t.dueDate) return false;
      const [tYear, tMonth, tDay] = t.dueDate.split("-").map(Number);
      return tDay === selectedDay && tMonth === month + 1 && tYear === year;
    }) || [];
  }, [tasks, selectedDay, month, year]);


  const handleMoveTransaction = (index: number, direction: "up" | "down") => {
    if (!onUpdateTransaction) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedTransactions.length) return;

    const currentTx = selectedTransactions[index];
    const targetTx = selectedTransactions[newIndex];

    // Only allow moving within the same status group
    if (currentTx.status !== targetTx.status) return;

    // Get all transactions in the same status group
    const groupTxs = selectedTransactions.filter(
      (t) => t.status === currentTx.status,
    );

    // Create a new array with the swapped items
    const newGroupTxs = [...groupTxs];
    const currentIndexInGroup = newGroupTxs.findIndex(
      (t) => t.id === currentTx.id,
    );
    const targetIndexInGroup = newGroupTxs.findIndex(
      (t) => t.id === targetTx.id,
    );

    // Swap
    [newGroupTxs[currentIndexInGroup], newGroupTxs[targetIndexInGroup]] = [
      newGroupTxs[targetIndexInGroup],
      newGroupTxs[currentIndexInGroup],
    ];

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
        .filter(
          (t) => parseInt(t.date.split("-")[2]) === d && t.type === "expense",
        )
        .reduce((acc, t) => acc + t.amount, 0);
      if (dailySum > max) max = dailySum;
    }
    return max || 1;
  }, [displayedTransactions, daysInMonth]);

  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
      setSelectedDay(null);
    } else if (viewMode === "week") {
      const d = new Date(year, month, (selectedDay || 1) - 7);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
      setSelectedDay(d.getDate());
    } else if (viewMode === "day") {
      const d = new Date(year, month, (selectedDay || 1) - 1);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
      setSelectedDay(d.getDate());
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
      setSelectedDay(null);
    } else if (viewMode === "week") {
      const d = new Date(year, month, (selectedDay || 1) + 7);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
      setSelectedDay(d.getDate());
    } else if (viewMode === "day") {
      const d = new Date(year, month, (selectedDay || 1) + 1);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
      setSelectedDay(d.getDate());
    }
  };

  const handleOpenModal = () => {
    if (!selectedDay) {
      setSelectedDay(new Date().getDate());
    }
    // Reset form
    setFormData({
      description: "",
      amount: "",
      type: "expense",
      category: "Outros",
      paymentMethod: "credit_card",
      status: "pending",
      observation: "",
      time: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenAgendaModal = () => {
    if (!selectedDay) {
      setSelectedDay(new Date().getDate());
    }
    setAgendaFormData({
      id: "",
      title: "",
      description: "",
      color: "#3b82f6",
      checklist: [],
      startTime: "09:00",
      endTime: "10:00",
      allDay: true,
      isRecurring: false,
      recurrencePeriod: "daily",
      recurrenceDays: [],
      recurrenceEndDate: "",
      isRoutine: false,
    });
    setIsAgendaModalOpen(true);
  };

  const handleEditAgendaEvent = (event: AgendaEvent) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    setAgendaFormData({
      id: event.id,
      title: event.title,
      description: event.description || "",
      color: event.color || "#3b82f6",
      checklist: event.checklist || [],
      startTime: start.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      endTime: end.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      allDay: event.allDay,
      isRecurring: event.isRecurring || false,
      recurrencePeriod: event.recurrencePeriod || "daily",
      recurrenceDays: event.recurrenceDays || [],
      recurrenceEndDate: event.recurrenceEndDate || "",
      isRoutine: event.isRoutine || false,
    });
    setIsAgendaModalOpen(true);
  };

  const handleDeleteAgendaEvent = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este evento?")) {
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
      const [startHour, startMin] = agendaFormData.startTime
        .split(":")
        .map(Number);
      const [endHour, endMin] = agendaFormData.endTime.split(":").map(Number);
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
        color: agendaFormData.color,
        checklist: agendaFormData.checklist,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        allDay: agendaFormData.allDay,
        isRecurring: agendaFormData.isRecurring,
        recurrencePeriod: agendaFormData.recurrencePeriod,
        recurrenceDays: agendaFormData.recurrenceDays,
        recurrenceEndDate: agendaFormData.recurrenceEndDate,
        isRoutine: agendaFormData.isRoutine,
      });
    } else {
      await onAddAgendaEvent({
        title: agendaFormData.title,
        description: agendaFormData.description,
        color: agendaFormData.color,
        checklist: agendaFormData.checklist,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        allDay: agendaFormData.allDay,
        isRecurring: agendaFormData.isRecurring,
        recurrencePeriod: agendaFormData.recurrencePeriod,
        recurrenceDays: agendaFormData.recurrenceDays,
        recurrenceEndDate: agendaFormData.recurrenceEndDate,
        isRoutine: agendaFormData.isRoutine,
      });
    }

    setIsAgendaModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

    onAddTransaction({
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: dateStr,
      time: formData.time || undefined,
      status: formData.status,
      paymentMethod: formData.paymentMethod,
      isRecurring: false, // Simple add via calendar is usually one-off
      observation: formData.observation,
    });

    setIsModalOpen(false);
  };

  const handleOpenTaskModal = () => {
    let day = selectedDay;
    if (!day) {
      day = new Date().getDate();
      setSelectedDay(day);
    }
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setTaskFormData({
      id: "",
      title: "",
      description: "",
      listId: taskLists && taskLists.length > 0 ? taskLists[0].id : "",
      dueDate: dateStr,
    });
    setIsTaskModalOpen(true);
  };

  const handleRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    


  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;

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
          title: "Minhas Tarefas",
        });
        targetListId = newListId;
      } else {
        alert("Por favor, crie uma lista de tarefas primeiro.");
        return;
      }
    }

    if (taskFormData.id) {
      if (onUpdateTask) {
        await onUpdateTask(taskFormData.id, {
          title: taskFormData.title,
          description: taskFormData.description,
          listId: targetListId,
          dueDate: taskFormData.dueDate,
        });
      }
    } else {
      if (onAddTask) {
        await onAddTask({
          title: taskFormData.title,
          description: taskFormData.description,
          listId: targetListId,
          completed: false,
          dueDate: taskFormData.dueDate,
        });
      }
    }

    setIsTaskModalOpen(false);
  };

  const formatValue = (val: number) => {
    if (privacyMode) return "•••";
    if (val >= 1000) return (val / 1000).toFixed(1) + "k";
    return val.toFixed(0);
  };

  const formatFullValue = (val: number) => {
    if (privacyMode) return "••••";
    return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  // Generate Calendar Grid
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(
      <div
        key={`empty-${i}`}
        className="h-28 bg-slate-50/30 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
      ></div>,
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayTrans = displayedTransactions.filter(
      (t) => parseInt(t.date.split("-")[2]) === day,
    );

    // Find agenda events for this day
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);
    const dayAgendaEvents = displayedAgendaEvents.filter((e) => {
      const eStart = new Date(e.startDate);
      eStart.setHours(0, 0, 0, 0);
      const eEnd = new Date(e.endDate);
      eEnd.setHours(23, 59, 59, 999);
      return targetDate >= eStart && targetDate <= eEnd;
    });

    const dayTasks =
      tasks?.filter((t) => {
        if (!t.dueDate) return false;
        const [tYear, tMonth, tDay] = t.dueDate.split("-").map(Number);
        return tDay === day && tMonth === month + 1 && tYear === year;
      }) || [];

    const incomeSum = dayTrans
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
    const expenseSum = dayTrans
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    const intensity = Math.min(1, expenseSum / maxDailyExpense);
    let bgClass = "bg-white dark:bg-slate-800";

    if (expenseSum > 0) {
      if (intensity > 0.7) bgClass = "bg-rose-100 dark:bg-rose-900/40";
      else if (intensity > 0.4) bgClass = "bg-rose-50 dark:bg-rose-900/20";
      else bgClass = "bg-slate-50 dark:bg-slate-800";
    }

    const isToday =
      new Date().getDate() === day &&
      new Date().getMonth() === month &&
      new Date().getFullYear() === year;
    const isSelected = selectedDay === day;

    calendarCells.push(
      <div
        key={day}
        onClick={() => setSelectedDay(day)}
        className={`h-28 p-1.5 border border-slate-100 dark:border-slate-700 relative cursor-pointer transition-all hover:brightness-95
          ${isSelected ? "ring-2 ring-inset ring-indigo-500 z-10" : ""}
          ${bgClass}
        `}
      >
        <div className="flex justify-between items-start">
          <span
            className={`text-xs font-bold inline-flex w-6 h-6 items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 dark:text-slate-400"}`}
          >
            {day}
          </span>
          <div className="flex gap-1">
            {dayAgendaEvents.length > 0 && (
              <div
                className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                title={`${dayAgendaEvents.length} Eventos`}
              ></div>
            )}
            {dayTasks.length > 0 && (
              <div
                className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                title={`${dayTasks.length} Tarefas`}
              ></div>
            )}
            {dayTrans.some((t) => t.status === "pending") && (
              <div
                className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"
                title="Pagamentos Pendentes"
              ></div>
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
              {dayAgendaEvents.length} Evento
              {dayAgendaEvents.length > 1 ? "s" : ""}
            </div>
          )}
          {dayTasks.length > 0 && (
            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-900/30 px-1 rounded truncate">
              {dayTasks.length} Tarefa{dayTasks.length > 1 ? "s" : ""}
            </div>
          )}
          {dayTrans.some((t: any) => t.isGhost) && (
            <div className="absolute bottom-1 right-1 opacity-50">
              <Layers className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </div>
      </div>,
    );
  }

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData("eventId", eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropEvent = async (e: React.DragEvent, targetDate: Date, targetHour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    if (!eventId || !onUpdateAgendaEvent) return;

    const eventToMove = displayedAgendaEvents.find((evt) => evt.id === eventId);
    if (!eventToMove) return;

    const currentStart = new Date(eventToMove.startDate);
    const currentEnd = new Date(eventToMove.endDate);
    const durationMs = currentEnd.getTime() - currentStart.getTime();

    const newStart = new Date(targetDate);
    newStart.setHours(targetHour, currentStart.getMinutes(), 0, 0);

    const newEnd = new Date(newStart.getTime() + durationMs);

    await onUpdateAgendaEvent(eventId, {
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString(),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 relative">
      <AIAgendaAssistant
        onAddEvent={(event) => {
          if (onAddAgendaEvent) {
            onAddAgendaEvent({
              ...event,
              id: Date.now().toString(),
              userId: auth.currentUser?.uid || "",
            });
          }
        }}
        onAddTask={(task) => {
          if (onAddTask) {
            // Get or create a default list
            let defaultListId =
              taskLists.length > 0 ? taskLists[0].id : "default";
            if (taskLists.length === 0 && onAddTaskList) {
              onAddTaskList({ id: "default", title: "Tarefas Gerais" });
            }
            onAddTask({
              ...task,
              id: Date.now().toString(),
              listId: defaultListId,
              userId: auth.currentUser?.uid || "",
            });
          }
        }}
      />

      {/* ALERTS SECTION */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {budgetAlerts.map((alert, idx) => (
            <div
              key={idx}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3 animate-fade-in-down shadow-sm"
            >
              <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full flex-shrink-0">
                <Bell className="w-5 h-5 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                  {alert.title}
                </h4>
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD TRANSACTION MODAL */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        selectedDay={selectedDay}
        currentDate={currentDate}
        categories={CATEGORIES}
        paymentMethods={PAYMENT_METHODS}
      />

      {/* ADD AGENDA EVENT MODAL */}
      <AddAgendaEventModal
        isOpen={isAgendaModalOpen}
        onClose={() => setIsAgendaModalOpen(false)}
        formData={agendaFormData}
        setFormData={setAgendaFormData}
        onSubmit={handleAgendaSubmit}
        selectedDay={selectedDay}
        currentDate={currentDate}
      />

      

      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        formData={taskFormData}
        setFormData={setTaskFormData}
        onSubmit={handleTaskSubmit}
        selectedDay={selectedDay}
        currentDate={currentDate}
        taskLists={taskLists}
        onOpenListManager={() => setIsListManagerOpen(true)}
      />

      {/* LIST MANAGER MODAL */}
      <ListManagerModal
        isOpen={isListManagerOpen}
        onClose={() => setIsListManagerOpen(false)}
        taskLists={taskLists}
        newListName={newListName}
        setNewListName={setNewListName}
        editingListId={editingListId}
        setEditingListId={setEditingListId}
        editingListName={editingListName}
        setEditingListName={setEditingListName}
        onAddTaskList={onAddTaskList}
        onUpdateTaskList={onUpdateTaskList}
        onDeleteTaskList={onDeleteTaskList}
        setTaskFormData={setTaskFormData}
        taskFormData={taskFormData}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Agenda
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Rotinas diárias, eventos e controle de vencimentos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "month" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "week" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "day" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
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

          {viewMode !== "month" && (
            <button
              onClick={() => setCollapseEarlyHours(!collapseEarlyHours)}
              className={`p-2 border rounded-lg flex items-center justify-center transition-all ${collapseEarlyHours ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              title={collapseEarlyHours ? "Mostrar Madrugada (00h-05h)" : "Ocultar Madrugada (00h-05h)"}
            >
              <Moon className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/30 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-800 p-1 flex-1 md:flex-none justify-center">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors rounded-lg text-indigo-700 dark:text-indigo-400"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 text-sm md:text-base font-black text-indigo-800 dark:text-indigo-300 min-w-[140px] text-center capitalize">
              {viewMode === "day"
                ? new Date(year, month, selectedDay || 1).toLocaleDateString(
                    "pt-BR",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )
                : `${currentDate.toLocaleDateString("pt-BR", { month: "long" }).charAt(0).toUpperCase() + currentDate.toLocaleDateString("pt-BR", { month: "long" }).slice(1)}/${currentDate.getFullYear().toString().slice(-2)}`}
            </div>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors rounded-lg text-indigo-700 dark:text-indigo-400"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 overflow-x-auto">
        {[
          { id: "all", label: "Tudo", icon: Filter },
          { id: "expense", label: "Saídas", icon: ArrowDown },
          { id: "income", label: "Entradas", icon: ArrowUp },
          { id: "pending", label: "Pendentes", icon: Clock },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id as ViewFilter)}
            className={`flex-1 min-w-[80px] py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2
                    ${
                      filterType === f.id
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
          >
            <f.icon className="w-3 h-3" /> {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        {viewMode === "month" ? (
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              {DAYS_OF_WEEK.map((d) => (
                <div
                  key={d}
                  className="py-3 text-center text-xs font-bold uppercase text-slate-500 dark:text-slate-400"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">{calendarCells}</div>
          </div>
        ) : viewMode === "week" ? (
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[800px]">
            {/* Week Header */}
            <div className="grid grid-cols-8 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <div className="py-3 border-r border-slate-200 dark:border-slate-600"></div>
              {weekDays.map((d, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedDay(d.getDate());
                    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                  }}
                  className={`py-2 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 ${d.getDate() === selectedDay && d.getMonth() === month ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}
                >
                  <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    {DAYS_OF_WEEK[i]}
                  </div>
                  <div
                    className={`text-lg font-bold ${d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear() ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"}`}
                  >
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
                const dayTrans = displayedTransactions.filter((t) => {
                  const [tYear, tMonth, tDay] = t.date.split("-").map(Number);
                  return (
                    tDay === d.getDate() &&
                    tMonth === d.getMonth() + 1 &&
                    tYear === d.getFullYear()
                  );
                });
                const dayTasks =
                  tasks?.filter((t) => {
                    if (!t.dueDate) return false;
                    const [tYear, tMonth, tDay] = t.dueDate
                      .split("-")
                      .map(Number);
                    return (
                      tDay === d.getDate() &&
                      tMonth === d.getMonth() + 1 &&
                      tYear === d.getFullYear()
                    );
                  }) || [];
                const dayAgendaEvents = displayedAgendaEvents.filter((e) => {
                  const eStart = new Date(e.startDate);
                  eStart.setHours(0, 0, 0, 0);
                  const eEnd = new Date(e.endDate);
                  eEnd.setHours(23, 59, 59, 999);
                  const targetDate = new Date(
                    d.getFullYear(),
                    d.getMonth(),
                    d.getDate(),
                  );
                  return targetDate >= eStart && targetDate <= eEnd && e.allDay;
                });

                return (
                  <div
                    key={i}
                    className="p-1 border-r border-slate-200 dark:border-slate-600 min-h-[40px]"
                  >
                    {dayTrans.map((t) => (
                      <div
                        key={t.id}
                        className={`text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate ${t.type === "income" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatValue(t.amount)} {t.description}
                      </div>
                    ))}
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayAgendaEvents.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => handleEditAgendaEvent(e)}
                        className="cursor-pointer text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate"
                        style={{
                          backgroundColor: e.color ? `${e.color}33` : `var(--tw-colors-blue-100, #dbeafe)`,
                          color: e.color || `var(--tw-colors-blue-700, #1d4ed8)`
                        }}
                      >
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
                  {hoursToRender.map((hour) => (
                    <div
                      key={hour}
                      className="h-12 border-b border-slate-100 dark:border-slate-700/50 text-right pr-2 py-1"
                    >
                      <span className="text-[10px] text-slate-400 font-medium">{`${hour.toString().padStart(2, "0")}:00`}</span>
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {weekDays.map((d, dayIdx) => {
                  const dayAgendaEvents = displayedAgendaEvents.filter((e) => {
                    const eStart = new Date(e.startDate);
                    const targetDate = new Date(
                      d.getFullYear(),
                      d.getMonth(),
                      d.getDate(),
                    );
                    return (
                      eStart.getDate() === targetDate.getDate() &&
                      eStart.getMonth() === targetDate.getMonth() &&
                      eStart.getFullYear() === targetDate.getFullYear() &&
                      !e.allDay
                    );
                  });

                  return (
                    <div
                      key={dayIdx}
                      className="border-r border-slate-200 dark:border-slate-600 relative"
                    >
                      {hoursToRender.map((hour) => (
                        <div
                          key={hour}
                          onDragOver={handleDragOver}
                          onDrop={(ev) => handleDropEvent(ev, d, hour)}
                          className="h-12 border-b border-slate-100 dark:border-slate-700/50"
                        ></div>
                      ))}

                      {/* Render Events */}
                      {calculateEventLayout(dayAgendaEvents).map(({ e, colIndex, clusterSize }) => {
                        const start = new Date(e.startDate);
                        const end = new Date(e.endDate);
                        const startHour =
                          start.getHours() + start.getMinutes() / 60;
                        const endHour = end.getHours() + end.getMinutes() / 60;
                        
                        if (collapseEarlyHours && endHour <= 6) return null;
                        const adjustedStartHour = Math.max(startHour - hourOffset, 0);
                        const adjustedEndHour = endHour - hourOffset;
                        
                        const top = adjustedStartHour * 48; // 48px per hour (h-12)
                        const height = Math.max((adjustedEndHour - adjustedStartHour) * 48, 20); // Min height 20px

                        const width = `calc(${100 / clusterSize}% - 4px)`;
                        const left = `calc(${(100 / clusterSize) * colIndex}% + 2px)`;

                        return (
                          <div
                            key={e.id}
                            draggable
                            onDragStart={(ev) => handleDragStart(ev, e.id)}
                            onClick={() => handleEditAgendaEvent(e)}
                            className="absolute rounded-md text-white p-1 overflow-hidden cursor-pointer shadow-sm transition-opacity hover:opacity-90 z-10"
                            style={{
                              backgroundColor: e.color ? `${e.color}E6` : `rgba(59, 130, 246, 0.9)`,
                              top: `${top}px`,
                              height: `${height}px`,
                              width,
                              left,
                            }}
                          >
                            <div className="text-[10px] font-bold leading-tight truncate">
                              {e.title}
                            </div>
                            {height >= 40 && (
                              <div className="text-[9px] opacity-80 leading-tight truncate">
                                {start.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {end.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
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
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[800px]">
            {/* Day Header */}
            <div className="grid grid-cols-[60px_1fr] bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <div className="py-3 border-r border-slate-200 dark:border-slate-600"></div>
              <div className="py-2 text-center bg-indigo-50 dark:bg-indigo-900/20">
                <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  {
                    DAYS_OF_WEEK[
                      new Date(year, month, selectedDay || 1).getDay()
                    ]
                  }
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
                  const dayTrans = displayedTransactions.filter((t) => {
                    const [tYear, tMonth, tDay] = t.date.split("-").map(Number);
                    return (
                      tDay === d.getDate() &&
                      tMonth === d.getMonth() + 1 &&
                      tYear === d.getFullYear()
                    );
                  });
                  const dayTasks =
                    tasks?.filter((t) => {
                      if (!t.dueDate) return false;
                      const [tYear, tMonth, tDay] = t.dueDate
                        .split("-")
                        .map(Number);
                      return (
                        tDay === d.getDate() &&
                        tMonth === d.getMonth() + 1 &&
                        tYear === d.getFullYear()
                      );
                    }) || [];
                  const dayAgendaEvents = displayedAgendaEvents.filter((e) => {
                    const eStart = new Date(e.startDate);
                    eStart.setHours(0, 0, 0, 0);
                    const eEnd = new Date(e.endDate);
                    eEnd.setHours(23, 59, 59, 999);
                    const targetDate = new Date(
                      d.getFullYear(),
                      d.getMonth(),
                      d.getDate(),
                    );
                    return (
                      targetDate >= eStart && targetDate <= eEnd && e.allDay
                    );
                  });

                  return (
                    <>
                      {dayTrans.map((t) => (
                        <div
                          key={t.id}
                          className={`text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate ${t.type === "income" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}
                        >
                          {t.type === "income" ? "+" : "-"}
                          {formatValue(t.amount)} {t.description}
                        </div>
                      ))}
                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          className="text-[9px] font-bold px-1 py-0.5 rounded mb-0.5 truncate bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayAgendaEvents.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => handleEditAgendaEvent(e)}
                          className="cursor-pointer text-[9px] font-bold px-1.5 py-1 rounded mb-0.5"
                          style={{
                            backgroundColor: e.color ? `${e.color}33` : `var(--tw-colors-blue-100, #dbeafe)`,
                            color: e.color || `var(--tw-colors-blue-700, #1d4ed8)`
                          }}
                        >
                          <div className="truncate">{e.title}</div>
                          {e.checklist && e.checklist.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {e.checklist.map((item, idx) => (
                                <div
                                  key={item.id}
                                  className="flex items-start gap-1"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    if (!onUpdateAgendaEvent) return;
                                    const newChecklist = [...e.checklist!];
                                    newChecklist[idx] = { ...item, isCompleted: !item.isCompleted };
                                    onUpdateAgendaEvent(e.id, { checklist: newChecklist });
                                  }}
                                >
                                  <div className={`mt-0.5 shrink-0 w-2.5 h-2.5 flex items-center justify-center rounded border transition-colors ${item.isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'border-blue-400 text-transparent hover:border-blue-500'}`}>
                                    <Check className="w-2 h-2" />
                                  </div>
                                  <span className={`flex-1 leading-tight ${item.isCompleted ? 'line-through opacity-60' : ''}`}>{item.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
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
                  {hoursToRender.map((hour) => (
                    <div
                      key={hour}
                      className="h-12 border-b border-slate-100 dark:border-slate-700/50 text-right pr-2 py-1"
                    >
                      <span className="text-[10px] text-slate-400 font-medium">{`${hour.toString().padStart(2, "0")}:00`}</span>
                    </div>
                  ))}
                </div>

                {/* Day Column */}
                <div className="relative">
                  {hoursToRender.map((hour) => (
                    <div
                      key={hour}
                      onDragOver={handleDragOver}
                      onDrop={(ev) => {
                        const d = new Date(year, month, selectedDay || 1);
                        handleDropEvent(ev, d, hour);
                      }}
                      className="h-12 border-b border-slate-100 dark:border-slate-700/50"
                    ></div>
                  ))}

                  {/* Render Events */}
                  {(() => {
                    const d = new Date(year, month, selectedDay || 1);
                    const dayAgendaEvents = displayedAgendaEvents.filter(
                      (e) => {
                        const eStart = new Date(e.startDate);
                        const targetDate = new Date(
                          d.getFullYear(),
                          d.getMonth(),
                          d.getDate(),
                        );
                        return (
                          eStart.getDate() === targetDate.getDate() &&
                          eStart.getMonth() === targetDate.getMonth() &&
                          eStart.getFullYear() === targetDate.getFullYear() &&
                          !e.allDay
                        );
                      },
                    );

                    return calculateEventLayout(dayAgendaEvents).map(({ e, colIndex, clusterSize }) => {
                      const start = new Date(e.startDate);
                      const end = new Date(e.endDate);
                      const startHour =
                        start.getHours() + start.getMinutes() / 60;
                      const endHour = end.getHours() + end.getMinutes() / 60;
                      
                      if (collapseEarlyHours && endHour <= 6) return null;
                      const adjustedStartHour = Math.max(startHour - hourOffset, 0);
                      const adjustedEndHour = endHour - hourOffset;
                        
                      const top = adjustedStartHour * 48; // 48px per hour (h-12)
                      const height = Math.max((adjustedEndHour - adjustedStartHour) * 48, 20); // Min height 20px

                      const width = `calc(${100 / clusterSize}% - 4px)`;
                      const left = `calc(${(100 / clusterSize) * colIndex}% + 2px)`;

                      return (
                        <div
                          key={e.id}
                          draggable
                          onDragStart={(ev) => handleDragStart(ev, e.id)}
                          onClick={() => handleEditAgendaEvent(e)}
                          className="absolute rounded-md text-white p-1 overflow-x-hidden overflow-y-auto cursor-pointer shadow-sm transition-opacity hover:opacity-90 z-10 custom-scrollbar"
                          style={{
                            backgroundColor: e.color ? `${e.color}E6` : `rgba(59, 130, 246, 0.9)`,
                            top: `${top}px`,
                            height: `${height}px`,
                            width,
                            left,
                          }}
                        >
                          <div className="flex flex-col h-full">
                            <div className="text-[10px] font-bold leading-tight truncate shrink-0">
                              {e.title}
                            </div>
                            {height >= 40 && (
                              <div className="text-[9px] opacity-80 leading-tight truncate shrink-0 mb-1">
                                {start.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" - "}
                                {end.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                            {e.checklist && e.checklist.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {e.checklist.map((item, idx) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start gap-1 text-[9px]"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      if (!onUpdateAgendaEvent) return;
                                      const newChecklist = [...e.checklist!];
                                      newChecklist[idx] = { ...item, isCompleted: !item.isCompleted };
                                      onUpdateAgendaEvent(e.id, { checklist: newChecklist });
                                    }}
                                  >
                                    <div className={`mt-0.5 shrink-0 w-2.5 h-2.5 flex items-center justify-center rounded border transition-colors ${item.isCompleted ? 'bg-white text-blue-500' : 'border-white/50 text-transparent hover:border-white'}`}>
                                      <Check className="w-2 h-2" />
                                    </div>
                                    <span className={`flex-1 leading-tight ${item.isCompleted ? 'line-through opacity-70' : 'opacity-90'}`}>{item.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
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
        <DetailsSidebar
          selectedDay={selectedDay}
          currentDate={currentDate}
          handleOpenModal={handleOpenModal}
          handleOpenAgendaModal={handleOpenAgendaModal}
          handleOpenTaskModal={handleOpenTaskModal}
          selectedTransactions={selectedTransactions}
          selectedAgendaEvents={selectedAgendaEvents}
          todayTasks={todayTasks}
          timelessTasks={timelessTasks}
          onUpdateTask={onUpdateTask}
          setTaskFormData={setTaskFormData}
          setIsTaskModalOpen={setIsTaskModalOpen}
          onDeleteTask={onDeleteTask}
          onUpdateTransaction={onUpdateTransaction}
          handleMoveTransaction={handleMoveTransaction}
          onUpdateAgendaEvent={onUpdateAgendaEvent}
          handleEditAgendaEvent={handleEditAgendaEvent}
          onDeleteAgendaEvent={onDeleteAgendaEvent}
          year={year}
          month={month}
        />
      </div>
      {/* Floating Add Menu */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end gap-3">
        {/* Menu Items */}
        <div className={`flex flex-col items-end gap-3 transition-all duration-200 origin-bottom ${isFabOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          <button 
            onClick={() => { setIsFabOpen(false); handleOpenTaskModal(); }}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg shadow-blue-500/10 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
          >
            <span className="font-medium text-sm">Nova Tarefa</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </button>
          
          <button 
            onClick={() => { setIsFabOpen(false); handleOpenAgendaModal(); }}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg shadow-purple-500/10 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
          >
            <span className="font-medium text-sm">Novo Evento</span>
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </button>

          <button 
            onClick={() => { setIsFabOpen(false); handleOpenModal(); }}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
          >
            <span className="font-medium text-sm">Nova Transação</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Main FAB Button */}
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 text-white rounded-full flex items-center justify-center transition-all shadow-lg ${isFabOpen ? 'rotate-45 bg-rose-500 hover:bg-rose-600 shadow-rose-500/40' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-110 active:scale-95 shadow-indigo-600/40'}`}
          title="Adicionar"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
