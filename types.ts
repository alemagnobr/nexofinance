
export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'direct_debit' | 'bank_transfer' | 'deposit';

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
}

export interface Investment {
  id: string;
  name: string;
  amount: number;
  targetAmount: number;
  type: string;
  date: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
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
  notes?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (data: AppData) => boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AppData {
  transactions: Transaction[];
  investments: Investment[];
  budgets: Budget[];
  debts: Debt[];
  unlockedBadges: string[];
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  INVESTMENTS = 'INVESTMENTS',
  BUDGETS = 'BUDGETS',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS',
  CALENDAR = 'CALENDAR',
  AI_ASSISTANT = 'AI_ASSISTANT',
  DEBTS = 'DEBTS'
}
