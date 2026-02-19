
export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'direct_debit' | 'bank_transfer' | 'deposit';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string; // 'blue', 'red', 'green', etc.
  icon?: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  status: TransactionStatus;
  isRecurring?: boolean;
  paymentMethod?: PaymentMethod;
  debtId?: string; // ID da dívida vinculada (se houver)
  observation?: string; // Notas opcionais do usuário
  googleEventId?: string; // ID do evento no Google Calendar
  autoPay?: boolean; // Lançamento automático na data
}

export interface Investment {
  id: string;
  name: string;
  amount: number; // Valor Atual (Mercado)
  investedAmount?: number; // Custo de Aquisição (Para cálculo de ROI)
  targetAmount: number;
  type: string;
  date: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month?: string; // Formato "YYYY-MM" (opcional se for recorrente)
  isRecurring: boolean; // Se true, aplica-se a qualquer mês que não tenha um budget específico
}

export interface Debt {
  id: string;
  creditor: string; // Nome do banco/loja
  originalAmount: number; // Valor original da dívida
  currentAmount: number; // Valor atual com juros abusivos
  targetAmount: number; // Quanto você quer pagar (acordo)
  agreedAmount?: number; // Valor final fechado no acordo
  dueDate: string; // Data original do vencimento (para prescrição)
  status: 'open' | 'negotiating' | 'agreement' | 'paid';
  platform?: string; // Onde está sendo negociado (Serasa, Desenrola, etc)
  notes?: string;
}

export type ShoppingCategory = 'Hortifruti' | 'Carnes' | 'Laticínios' | 'Mercearia' | 'Bebidas' | 'Limpeza' | 'Higiene' | 'Padaria' | 'Outros';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  actualPrice: number; // O valor que o usuário digita no mercado (calculadora)
  isChecked: boolean; // Se já pegou o item
  category?: ShoppingCategory; // Novo campo
}

// --- KANBAN TYPES ---
export interface KanbanTag {
  id: string;
  name: string;
  color: string; // 'blue' | 'green' | 'yellow' | 'purple' | 'rose' | 'slate'
}

export interface KanbanComment {
  id: string;
  text: string;
  createdAt: string; // ISO Date
}

export interface KanbanAttachment {
  id: string;
  name: string;
  url: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  amount: number;
  color: string; // Main card color (border)
  tags?: KanbanTag[]; // New field for labels
  dueDate?: string; // ISO Date
  comments?: KanbanComment[];
  attachments?: KanbanAttachment[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  isConclusion?: boolean; // Se true, soltar um card aqui dispara a criação de transação
  order: number;
}

export interface KanbanBoard {
  id: string;
  title: string;
  columns: KanbanColumn[];
}

// --- NOTES TYPES ---
export interface Note {
  id: string;
  title: string;
  content: string;
  date: string; // ISO Date
  color: 'slate' | 'yellow' | 'green' | 'blue' | 'rose' | 'purple';
  isPinned: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (data: AppData) => boolean;
  getProgress: (data: AppData) => number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// --- WEALTH PLANNER TYPES ---
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export interface WealthProfile {
  age: number;
  retirementAge: number;
  riskProfile: RiskProfile;
  monthlyContributionOverride?: number; // Se o usuário quiser simular aportar diferente do real
}

export interface AppData {
  transactions: Transaction[];
  categories: Category[]; // New field
  investments: Investment[];
  budgets: Budget[];
  debts: Debt[];
  shoppingList: ShoppingItem[];
  shoppingBudget?: number; // Novo campo: Teto de gastos da ida ao mercado
  kanbanColumns: KanbanColumn[]; // Legacy: Mantido para migração se necessário
  kanbanBoards: KanbanBoard[]; // Novo campo: Múltiplos Quadros
  notes: Note[]; // Novo campo: Notas
  unlockedBadges: string[];
  wealthProfile?: WealthProfile;
  walletBalance?: number; // Saldo calculado e persistido para performance
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  INVESTMENTS = 'INVESTMENTS',
  BUDGETS = 'BUDGETS',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS',
  CALENDAR = 'CALENDAR',
  AI_ASSISTANT = 'AI_ASSISTANT',
  DEBTS = 'DEBTS',
  SHOPPING_LIST = 'SHOPPING_LIST',
  WEALTH_PLANNER = 'WEALTH_PLANNER',
  KANBAN = 'KANBAN',
  NOTES = 'NOTES',
  SETTINGS = 'SETTINGS'
}
