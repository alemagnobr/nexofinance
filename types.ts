
export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'direct_debit' | 'bank_transfer' | 'deposit' | 'boleto';

export enum WalletType {
  BANK = 'BANK',
  CREDIT_CARD = 'CREDIT_CARD',
  MEAL_TICKET = 'MEAL_TICKET', // Vale Refeição/Alimentação
  OTHER = 'OTHER'
}

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  color?: string;
  icon?: string;
  observation?: string; // Observação opcional para a carteira
}

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
  time?: string;
  status: TransactionStatus;
  isRecurring?: boolean;
  paymentMethod?: PaymentMethod;
  debtId?: string; // ID da dívida vinculada (se houver)
  observation?: string; // Notas opcionais do usuário
  autoPay?: boolean; // Lançamento automático na data
  order?: number; // Ordem de exibição no dia
  googleEventId?: string; // ID do evento no Google Calendar
  walletId?: string; // ID da carteira/banco onde foi pago/recebido
  isGhost?: boolean; // Transação futura projetada (não salva no banco)
  groupId?: string; // ID de agrupamento para transações parceladas/recorrentes
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
  targetAmount: number; // Quanto você quer pagar (acordo) ou dívida negociada
  agreedAmount?: number; // Valor final fechado no acordo
  hasDownPayment?: boolean; // Se teve entrada na negociação
  downPaymentAmount?: number; // Valor da entrada
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
  unit?: string; // e.g., 'un', 'kg', 'g', 'cx', 'pct', 'L'
  actualPrice: number; // O valor que o usuário digita no mercado (calculadora)
  referencePrice?: number; // Previsão de custo
  isChecked: boolean; // Se já pegou o item
  category?: ShoppingCategory; // Novo campo
  observation?: string; // Observação opcional
  month?: string; // Formato "YYYY-MM" para histórico mensal
  purchaseDate?: string; // Data da compra (YYYY-MM-DD)
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

export interface KanbanSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface KanbanCard {
  id: string;
  title: string;
  amount: number;
  color: string; // Main card color (border)
  description?: string;
  tags?: KanbanTag[]; // New field for labels
  dueDate?: string; // ISO Date
  comments?: KanbanComment[];
  attachments?: KanbanAttachment[];
  subtasks?: KanbanSubtask[];
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
  color?: string;
  startDate: string; // ISO datetime or YYYY-MM-DD
  endDate: string; // ISO datetime or YYYY-MM-DD
  allDay: boolean;
  isRecurring?: boolean;
  recurrencePeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom_days' | 'every_other_day';
  recurrenceDays?: number[]; // 0=Sunday, 1=Monday... used for custom_days
  recurrenceEndDate?: string;
  isRoutine?: boolean; // Se é uma rotina
  completedDates?: string[]; // Datas (YYYY-MM-DD) em que foi concluído
  checklist?: { id: string; text: string; isCompleted: boolean }[];
  isGhost?: boolean;
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
  startDate?: string;
  description?: string;
  punishment?: number; // Punição em dias (1 a 5)
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
  workGoals?: WorkGoal[]; // Metas de Trabalho
  dailyRoutines?: DailyRoutine[]; // Checklists diárias que resetam
  unlockedBadges: string[];
  wallets?: Wallet[]; // Novo campo: Carteiras/Bancos
  driveLink?: string; // Novo campo: Link do Drive
  wealthProfile?: WealthProfile;
  walletBalance?: number; // Saldo calculado e persistido para performance
  scoreSerasa?: number;
  scoreSerasaUpdatedAt?: string;
  scoreSerasaHistory?: { score: number, date: string }[];
  workoutProjects?: WorkoutProject[];
  workoutProjectPhases?: WorkoutProjectPhase[];
  workoutSteps?: WorkoutStep[];
  workoutCheckins?: WorkoutCheckin[];
  workoutRoutines?: WorkoutRoutine[];
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  FINANCEIRO_DASHBOARD = 'FINANCEIRO_DASHBOARD',
  PLANEJAMENTO_DASHBOARD = 'PLANEJAMENTO_DASHBOARD',
  UTILIDADES_DASHBOARD = 'UTILIDADES_DASHBOARD',
  SAUDE_DASHBOARD = 'SAUDE_DASHBOARD',
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
  DAILY_ROUTINES = 'DAILY_ROUTINES',
  WORK_GOALS = 'WORK_GOALS',
  TREINO = 'TREINO',
  DIETA = 'DIETA',
  WALLETS = 'WALLETS', // Gerenciamento de Carteiras
  SETTINGS = 'SETTINGS'
}

export interface DailyRoutine {
  id: string;
  title: string;
  lastCompletedDate?: string; // YYYY-MM-DD
  completedDates?: string[]; // Arrays de datas em que a rotina foi marcada
  order?: number;
  time?: string; // HH:mm
  eventId?: string; // Links to agenda event
}

export interface WorkoutProject {
  id: string;
  name: string; // Ex: Bulk Base 2026
  objective: string; // Ex: Ganho de massa com mínimo acúmulo de gordura
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status: 'Planejado' | 'Em andamento' | 'Pausado' | 'Finalizado';
  priority: 'Alta' | 'Média' | 'Baixa';
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutProjectPhase {
  id: string;
  projectId: string;
  name: string; // Ex: Adaptação
  period: string; // Ex: Semana 1 a 2
  objective: string; // Ex: Voltar ritmo, controlar dores
  order: number;
}

export interface WorkoutStep {
  id: string;
  projectId: string;
  name: string; // Ex: Etapa 1: Retorno
  duration: string; // Ex: 2 semanas
  intensity: string; // Ex: leve/moderada
  focus: string; // Ex: técnica, mobilidade
  strategy?: string; 
  techniques?: string;
  volume?: string;
  order: number;
}

export interface WorkoutCheckin {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  weight?: number;
  measurements?: string; // Observações sobre medidas
  photos?: string[]; // URLs das fotos
  loads?: string; // Carga dos principais
  energyLevel?: number; // 1-5
  sleepQuality?: number; // 1-5
  dietAdherence?: number; // 0-100%
  notes?: string;
  adjustments?: string;
  createdAt: string;
}

export interface RoutineExercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  technique?: string;
  notes?: string;
}

export interface RoutineDay {
  id: string;
  name: string; // Ex: Treino A - Peito, Segunda-feira
  dayOfWeek?: number; // 0 (Sun) to 6 (Sat)
  exercises: RoutineExercise[];
}

export interface WorkoutRoutine {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  days: RoutineDay[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkGoal {
  id: string;
  title: string;
  targetHours: number;
  completedHours: number;
  deadline?: string;
  createdAt: string;
}
