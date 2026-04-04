
export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'direct_debit' | 'bank_transfer' | 'deposit' | 'boleto';

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
  autoPay?: boolean; // Lançamento automático na data
  order?: number; // Ordem de exibição no dia
  googleEventId?: string; // ID do evento no Google Calendar
}

export interface InvestmentHistory {
  id: string;
  date: string;
  amount: number;
  type: 'contribution' | 'withdrawal' | 'yield';
}

export interface Investment {
  id: string;
  name: string;
  amount: number; // Valor Atual (Mercado)
  investedAmount?: number; // Custo de Aquisição (Para cálculo de ROI)
  targetAmount: number;
  type: string;
  date: string;
  assetCategory?: 'market' | 'fund';
  institution?: string; // Banco ou Instituição Financeira
  fundProduct?: string; // Fundo de Investimento ou Produto
  lastContribution?: number; // Valor do último aporte/investimento (adicionado para caixinhas)
  lastContributionDate?: string; // Data do último aporte
  history?: InvestmentHistory[];
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
  observation?: string; // Observação opcional
  month?: string; // Formato "YYYY-MM" para histórico mensal
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
  category?: string; // Faixa/Categoria da nota
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

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  encryptedPassword: string;
  url?: string;
  notes?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO datetime or YYYY-MM-DD
  endDate: string; // ISO datetime or YYYY-MM-DD
  allDay: boolean;
  updatedAt?: string;
}

// --- TASKS TYPES ---
export interface TaskList {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  completed: boolean;
  urgent?: boolean;
  important?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PixKeyType = 'cpf' | 'email' | 'phone' | 'random' | 'other';

export interface PixKey {
  id: string;
  bank: string;
  type: PixKeyType;
  key: string;
  label?: string;
  createdAt: string;
}

export interface HabitEntry {
  status: 'done' | 'missed';
  date: string; // YYYY-MM-DD
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  targetDays: number; // Quantidade de dias escolhida
  entries: Record<number, HabitEntry>; // dayIndex (0 to targetDays-1) -> entry
  completedDates?: string[]; // Legacy
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
  passwords: PasswordEntry[]; // Novo campo: Senhas
  agendaEvents: AgendaEvent[]; // Novo campo: Agenda Geral
  taskLists: TaskList[]; // Novo campo: Listas de Tarefas
  tasks: Task[]; // Novo campo: Tarefas
  pixKeys: PixKey[]; // Novo campo: Chaves Pix
  habits: Habit[]; // Novo campo: Hábitos
  unlockedBadges: string[];
  wealthProfile?: WealthProfile;
  walletBalance?: number; // Saldo calculado e persistido para performance
  scoreSerasa?: number;
  scoreSerasaUpdatedAt?: string;
  scoreSerasaHistory?: { score: number, date: string }[];
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
  PASSWORDS = 'PASSWORDS',
  PIX_KEYS = 'PIX_KEYS',
  PRODUCTIVITY = 'PRODUCTIVITY',
  EISENHOWER = 'EISENHOWER', // Matriz de Eisenhower
  SETTINGS = 'SETTINGS'
}
