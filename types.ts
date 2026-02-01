
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
  notes?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  actualPrice: number; // O valor que o usuário digita no mercado (calculadora)
  isChecked: boolean; // Se já pegou o item
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
  investments: Investment[];
  budgets: Budget[];
  debts: Debt[];
  shoppingList: ShoppingItem[];
  unlockedBadges: string[];
  wealthProfile?: WealthProfile; // Novo campo opcional
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
  WEALTH_PLANNER = 'WEALTH_PLANNER' // Nova View
}
