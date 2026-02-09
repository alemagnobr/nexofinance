
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, Budget, View } from '../types';
import { Plus, Trash2, CheckCircle, Clock, ArrowUpCircle, ArrowDownCircle, Wallet, Wand2, Loader2, Camera, Repeat, ChevronLeft, ChevronRight, Calendar, Pencil, ListFilter, AlertTriangle, AlertCircle, Layers, Bell, Search, Filter, X, Smartphone, CreditCard, Banknote, Landmark, Save, MoreHorizontal } from 'lucide-react';
import { suggestCategory, analyzeReceipt } from '../services/geminiService';

interface TransactionListProps {
  transactions: Transaction[];
  budgets: Budget[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onNavigate: (view: View) => void; // New prop
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal?: number;
}

const CATEGORY_STYLES: Record<string, string> = {
  'Casa': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  'Mobilidade': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'Alimentos': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  'Lazer': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'Saúde': 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  'Educação': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  'Pets': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  'Salário': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  'Investimentos': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  'Outros': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
};

const PAYMENT_LABELS: Record<string, string> = {
  'credit_card': 'Crédito',
  'debit_card': 'Débito',
  'cash': 'Dinheiro',
  'pix': 'PIX',
  'direct_debit': 'Déb. Auto',
  'bank_transfer': 'TED/DOC',
  'deposit': 'Depósito',
};

// Icons for payment methods
const PaymentIcon = ({ method, className }: { method: string, className?: string }) => {
    switch(method) {
        case 'credit_card': return <CreditCard className={className} />;
        case 'debit_card': return <CreditCard className={className} />;
        case 'cash': return <Banknote className={className} />;
        case 'pix': return <Smartphone className={className} />; // Represents digital/pix
        default: return <Landmark className={className} />;
    }
};

const EXPENSE_CATEGORIES = ['Casa', 'Mobilidade', 'Alimentos', 'Lazer', 'Saúde', 'Educação', 'Pets', 'Outros'];
const INCOME_CATEGORIES = ['Salário', 'Renda Extra', 'Investimentos', 'Presente', 'Reembolso', 'Outros'];
const EXPENSE_PAYMENT_METHODS = ['credit_card', 'debit_card', 'direct_debit', 'pix', 'cash'];
const INCOME_PAYMENT_METHODS = ['pix', 'bank_transfer', 'cash', 'deposit'];

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, budgets, onAdd, onUpdate, onDelete, onToggleStatus, onNavigate, privacyMode, hasApiKey, quickActionSignal }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loadingAutoCat, setLoadingAutoCat] = useState(false);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- FILTERS STATE ---
  const [viewFilter, setViewFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // --- INLINE EDITING STATE ---
  const [editingId, setEditingId] = useState<string | null>(null); // For full form
  const [inlineEditId, setInlineEditId] = useState<string | null>(null); // For row edit
  const [editValues, setEditValues] = useState<{
      description: string;
      amount: string;
      category: string;
  }>({ description: '', amount: '', category: '' });

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: 'Outros',
    date: new Date().toISOString().split('T')[0],
    status: 'paid' as TransactionStatus,
    paymentMethod: 'credit_card' as PaymentMethod,
    isRecurring: false,
    installments: ''
  });

  useEffect(() => {
    if (quickActionSignal && Date.now() - quickActionSignal < 2000) {
        setIsFormOpen(true);
        resetForm();
    }
  }, [quickActionSignal]);

  const currentCategoryOptions = useMemo(() => {
    return newTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  }, [newTransaction.type]);

  const currentPaymentMethods = useMemo(() => {
    return newTransaction.type === 'income' ? INCOME_PAYMENT_METHODS : EXPENSE_PAYMENT_METHODS;
  }, [newTransaction.type]);

  const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  // --- FILTERING LOGIC ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Month Filter
      const [year, month] = t.date.split('-');
      const matchesMonth = (
        parseInt(year) === currentDate.getFullYear() &&
        parseInt(month) === currentDate.getMonth() + 1
      );
      if (!matchesMonth) return false;

      // 2. Type Filter
      if (viewFilter !== 'all' && t.type !== viewFilter) return false;

      // 3. Search Filter
      if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // 4. Category Filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // 5. Payment Filter
      if (paymentFilter !== 'all' && t.paymentMethod !== paymentFilter) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentDate, viewFilter, searchQuery, categoryFilter, paymentFilter]);

  // --- GROUPING LOGIC (By Date) ---
  const groupedTransactions = useMemo(() => {
      const groups: Record<string, { transactions: Transaction[], total: number }> = {};
      
      filteredTransactions.forEach(t => {
          if (!groups[t.date]) {
              groups[t.date] = { transactions: [], total: 0 };
          }
          groups[t.date].transactions.push(t);
          const val = t.type === 'income' ? t.amount : -t.amount;
          if (t.status === 'paid') {
             groups[t.date].total += val;
          }
      });

      return Object.entries(groups)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  // --- DYNAMIC TOTALS ---
  const dynamicTotals = useMemo(() => {
      const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDateFriendly = (dateStr: string) => {
      const date = new Date(dateStr + 'T12:00:00');
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Hoje';
      if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
      
      const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      return `${weekday.split('-')[0]}, ${dayMonth}`;
  };

  const handleAutoCategorize = async () => {
    if (!newTransaction.description) return;
    setLoadingAutoCat(true);
    const suggested = await suggestCategory(newTransaction.description);
    const isValid = currentCategoryOptions.includes(suggested);
    setNewTransaction(prev => ({ ...prev, category: isValid ? suggested : 'Outros' }));
    setLoadingAutoCat(false);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as TransactionType;
    const newCats = newType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const defaultMethod = newType === 'income' ? 'pix' : 'credit_card';
    setNewTransaction(prev => ({ ...prev, type: newType, category: newCats[0], paymentMethod: defaultMethod as PaymentMethod }));
  };

  const resetForm = () => {
    setNewTransaction({ description: '', amount: '', type: 'expense', category: 'Outros', date: new Date().toISOString().split('T')[0], status: 'paid', paymentMethod: 'credit_card', isRecurring: false, installments: '' });
    setEditingId(null);
  }

  const handleEdit = (t: Transaction) => {
    setNewTransaction({
        description: t.description, amount: t.amount.toString(), type: t.type, category: t.category, date: t.date, status: t.status, paymentMethod: t.paymentMethod || (t.type === 'income' ? 'pix' : 'credit_card'), isRecurring: t.isRecurring || false, installments: ''
    });
    setEditingId(t.id);
    setIsFormOpen(true);
  };

  // --- INLINE EDITING LOGIC ---
  const startInlineEdit = (t: Transaction) => {
      setInlineEditId(t.id);
      setEditValues({
          description: t.description,
          amount: t.amount.toString(),
          category: t.category
      });
  };

  const saveInlineEdit = (id: string) => {
      const amount = parseFloat(editValues.amount);
      if (editValues.description && !isNaN(amount) && amount > 0) {
          onUpdate(id, {
              description: editValues.description,
              amount: amount,
              category: editValues.category
          });
      }
      setInlineEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData = {
      description: newTransaction.description, amount: parseFloat(newTransaction.amount), type: newTransaction.type, category: newTransaction.category, date: newTransaction.date, status: newTransaction.status, paymentMethod: newTransaction.paymentMethod, isRecurring: newTransaction.isRecurring
    };
    const numInstallments = parseInt(newTransaction.installments);
    if (newTransaction.isRecurring && !isNaN(numInstallments) && numInstallments > 1) {
        const baseDateObj = new Date(newTransaction.date + 'T12:00:00'); 
        for(let i=0; i < numInstallments; i++) {
             const nextDate = new Date(baseDateObj);
             nextDate.setMonth(baseDateObj.getMonth() + i);
             const isoDate = nextDate.toISOString().split('T')[0];
             const desc = `${newTransaction.description} (${i+1}/${numInstallments})`;
             onAdd({ ...transactionData, description: desc, date: isoDate, isRecurring: false });
        }
    } else {
        if (editingId) onUpdate(editingId, transactionData);
        else onAdd(transactionData);
    }
    resetForm();
    setIsFormOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setAnalyzingReceipt(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await analyzeReceipt(base64);
        if (data) {
          setNewTransaction(prev => ({
            ...prev,
            description: data.description || prev.description,
            amount: data.amount ? String(data.amount) : prev.amount,
            date: data.date || prev.date,
            category: data.category || 'Outros',
            type: 'expense'
          }));
          setIsFormOpen(true);
        } else alert('Não foi possível ler o recibo.');
        setAnalyzingReceipt(false);
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP BAR: Title, Search, Actions */}
      <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white hidden md:block">Transações</h2>
            
            <div className="flex flex-1 w-full md:w-auto gap-3 items-center">
                <div className="flex-1 relative group">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                    <Filter className="w-5 h-5" />
                </button>

                <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 shrink-0">
                    <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-2 text-xs font-bold text-slate-700 dark:text-slate-200 capitalize min-w-[80px] text-center">{currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}</span>
                    <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="hidden md:flex gap-2">
                <button
                    onClick={() => onNavigate(View.SUBSCRIPTIONS)}
                    className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm shadow-sm"
                >
                    <Repeat className="w-4 h-4 text-indigo-500" />
                    Assinaturas
                </button>
                <button
                    onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 font-bold text-sm"
                >
                    <Plus className="w-4 h-4" /> Nova
                </button>
            </div>
          </div>

          {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in-down">
                  <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                      <option value="all">Todas Categorias</option>
                      {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select 
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                      <option value="all">Todos Métodos</option>
                      {[...EXPENSE_PAYMENT_METHODS, ...INCOME_PAYMENT_METHODS].map(m => <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>)}
                  </select>
              </div>
          )}
      </div>

      {/* 2. DYNAMIC SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Entradas</p>
          <p className="text-sm md:text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">{formatValue(dynamicTotals.income)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Saídas</p>
          <p className="text-sm md:text-lg font-bold text-rose-600 dark:text-rose-400 truncate">{formatValue(dynamicTotals.expense)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Resultado</p>
          <p className={`text-sm md:text-lg font-bold truncate ${dynamicTotals.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
            {formatValue(dynamicTotals.balance)}
          </p>
        </div>
      </div>

      {/* 3. FORM */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                {editingId ? 'Editar Transação' : 'Adicionar Transação'}
            </h3>
          </div>
          
          <div className="relative">
            <input
              required
              type="text"
              placeholder="Descrição"
              value={newTransaction.description}
              onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none w-full pr-10"
            />
            <button
              type="button"
              onClick={handleAutoCategorize}
              disabled={loadingAutoCat || !newTransaction.description || !hasApiKey}
              className={`absolute right-2 top-2 ${!hasApiKey ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-700'} disabled:opacity-30`}
            >
              {loadingAutoCat ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            </button>
          </div>
          
          <input
            required
            type="number"
            placeholder="Valor (R$)"
            value={newTransaction.amount}
            onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 outline-none"
          />

          <select
            value={newTransaction.type}
            onChange={handleTypeChange}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>

          <select
            value={newTransaction.category}
            onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2"
          >
            {currentCategoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            required
            type="date"
            value={newTransaction.date}
            onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2"
          />

          <select
            value={newTransaction.status}
            onChange={e => setNewTransaction({ ...newTransaction, status: e.target.value as TransactionStatus })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2"
          >
            <option value="paid">Pago/Recebido</option>
            <option value="pending">Pendente</option>
          </select>

          <select
            value={newTransaction.paymentMethod}
            onChange={e => setNewTransaction({ ...newTransaction, paymentMethod: e.target.value as PaymentMethod })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2"
          >
            {currentPaymentMethods.map(method => (
              <option key={method} value={method}>{PAYMENT_LABELS[method]}</option>
            ))}
          </select>

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 p-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
               <input 
                  type="checkbox" 
                  id="recurring"
                  checked={newTransaction.isRecurring}
                  onChange={(e) => setNewTransaction({...newTransaction, isRecurring: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
               />
               <label htmlFor="recurring" className="text-sm text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1 cursor-pointer">
                  <Repeat className="w-4 h-4 text-indigo-500" /> Assinatura / Recorrente / Parcelado
               </label>
            </div>

            {newTransaction.isRecurring && (
                <div className="mt-2 pl-2 md:pl-6 animate-fade-in">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Repetir por quantas vezes? (Opcional)
                        </label>
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                placeholder="Ex: 12 (Deixe vazio para assinatura infinita)"
                                value={newTransaction.installments}
                                onChange={e => setNewTransaction({...newTransaction, installments: e.target.value})}
                                className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              {editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* 4. TABS (View Filter) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex">
          <button 
              onClick={() => setViewFilter('all')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${viewFilter === 'all' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
              <ListFilter className="w-4 h-4" /> Todas
          </button>
          <button 
              onClick={() => setViewFilter('income')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${viewFilter === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
              <ArrowUpCircle className="w-4 h-4" /> Entradas
          </button>
          <button 
              onClick={() => setViewFilter('expense')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${viewFilter === 'expense' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
              <ArrowDownCircle className="w-4 h-4" /> Saídas
          </button>
      </div>

      {/* 5. LIST AREA (Grouped by Date) */}
      <div className="space-y-4 pb-20 md:pb-0">
          {groupedTransactions.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                  <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 opacity-50" />
                  </div>
                  <p>Nenhuma transação encontrada.</p>
                  <p className="text-xs mt-1">Tente mudar os filtros ou adicione uma nova.</p>
              </div>
          ) : (
              groupedTransactions.map((group) => (
                  <div key={group.date} className="animate-fade-in">
                      {/* Date Header */}
                      <div className="flex items-center justify-between px-3 py-2 mb-1 sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg border-b border-slate-100 dark:border-slate-800">
                          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {formatDateFriendly(group.date)}
                          </h3>
                          <span className={`text-xs font-bold ${group.total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                              {group.total !== 0 && (group.total > 0 ? '+' : '') + formatValue(group.total)}
                          </span>
                      </div>

                      {/* Desktop Header Row (Only shown once per group or handled via grid in list) */}
                      {/* Keeping it simple: We use a list of items that change layout on desktop */}

                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                          {group.transactions.map((t) => (
                              <div key={t.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                  
                                  {/* --- MOBILE VIEW (< md) --- */}
                                  <div className="md:hidden p-4 flex items-center gap-3 relative">
                                      {/* Icon Box */}
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                          t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                                      }`}>
                                          {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                      </div>

                                      {/* Main Content */}
                                      <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start">
                                              <h4 className="font-bold text-slate-800 dark:text-white truncate pr-2 text-sm">{t.description}</h4>
                                              <span className={`font-bold text-sm whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                  {t.type === 'expense' && '- '}{formatValue(t.amount)}
                                              </span>
                                          </div>
                                          
                                          <div className="flex justify-between items-center mt-1">
                                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${CATEGORY_STYLES[t.category]?.replace('bg-', 'border-').split(' ')[2] || 'border-slate-200'}`}>
                                                      {t.category}
                                                  </span>
                                                  {t.isRecurring && (
                                                      <span className="flex items-center gap-0.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                                          <Repeat className="w-3 h-3" /> 
                                                          {t.description.match(/\(\d+\/\d+\)/) ? 'Parcela' : 'Fixo'}
                                                      </span>
                                                  )}
                                              </div>

                                              {/* Actions */}
                                              <div className="flex items-center gap-3">
                                                  <button 
                                                      onClick={() => onToggleStatus(t.id)}
                                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                          t.status === 'paid' 
                                                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                          : 'border-slate-300 dark:border-slate-500 text-transparent hover:border-emerald-400'
                                                      }`}
                                                  >
                                                      <CheckCircle className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button onClick={() => handleEdit(t)} className="p-1 text-slate-400">
                                                       <MoreHorizontal className="w-4 h-4" />
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  {/* --- DESKTOP TABLE ROW (>= md) --- */}
                                  <div className="hidden md:flex items-center gap-4 p-3 text-sm">
                                      {/* Icon */}
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                          t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                                      }`}>
                                          {t.type === 'income' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                                      </div>

                                      {/* Inline Edit Mode or Display Mode */}
                                      {inlineEditId === t.id ? (
                                          <>
                                              <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                                                  {/* Category Select */}
                                                  <div className="col-span-2">
                                                      <select 
                                                          value={editValues.category}
                                                          onChange={(e) => setEditValues({...editValues, category: e.target.value})}
                                                          className="w-full p-1.5 text-xs rounded border border-slate-300 dark:bg-slate-700 dark:border-slate-600"
                                                      >
                                                          {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => <option key={c} value={c}>{c}</option>)}
                                                      </select>
                                                  </div>
                                                  
                                                  {/* Description Input */}
                                                  <div className="col-span-5">
                                                      <input 
                                                          autoFocus
                                                          type="text"
                                                          value={editValues.description}
                                                          onChange={(e) => setEditValues({...editValues, description: e.target.value})}
                                                          className="w-full p-1.5 text-xs rounded border border-slate-300 dark:bg-slate-700 dark:border-slate-600"
                                                      />
                                                  </div>

                                                  {/* Amount Input */}
                                                  <div className="col-span-3">
                                                      <input 
                                                          type="number"
                                                          value={editValues.amount}
                                                          onChange={(e) => setEditValues({...editValues, amount: e.target.value})}
                                                          className="w-full p-1.5 text-xs rounded border border-slate-300 dark:bg-slate-700 dark:border-slate-600 font-bold"
                                                      />
                                                  </div>

                                                  {/* Actions */}
                                                  <div className="col-span-2 flex gap-1 justify-end">
                                                      <button onClick={() => saveInlineEdit(t.id)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Save className="w-3 h-3"/></button>
                                                      <button onClick={() => setInlineEditId(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><X className="w-3 h-3"/></button>
                                                  </div>
                                              </div>
                                          </>
                                      ) : (
                                          <>
                                              {/* Date (Day) - Fixed Timezone Issue by string parsing */}
                                              <div className="w-8 text-center font-bold text-slate-400 text-xs">
                                                  {parseInt(t.date.split('-')[2])}
                                              </div>

                                              {/* Category */}
                                              <div className="w-24 shrink-0">
                                                  <span className={`px-2 py-1 rounded text-[10px] font-medium border block text-center truncate ${CATEGORY_STYLES[t.category]?.replace('bg-', 'border-').split(' ')[2] || 'border-slate-200'}`}>
                                                      {t.category}
                                                  </span>
                                              </div>

                                              {/* Description */}
                                              <div 
                                                  className="flex-1 font-medium text-slate-700 dark:text-slate-200 truncate cursor-pointer hover:text-indigo-500"
                                                  onClick={() => startInlineEdit(t)}
                                                  title="Clique para editar"
                                              >
                                                  {t.description}
                                                  {t.isRecurring && <span className="ml-2 text-[10px] text-slate-400 italic">({t.description.match(/\(\d+\/\d+\)/) ? 'Parcela' : 'Recorrente'})</span>}
                                              </div>

                                              {/* Payment Method */}
                                              <div className="w-24 text-xs text-slate-500 flex items-center gap-1">
                                                  <PaymentIcon method={t.paymentMethod || ''} className="w-3 h-3" />
                                                  <span className="truncate">{PAYMENT_LABELS[t.paymentMethod || ''] || '-'}</span>
                                              </div>

                                              {/* Amount */}
                                              <div 
                                                  className={`w-28 text-right font-bold cursor-pointer hover:text-indigo-500 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
                                                  onClick={() => startInlineEdit(t)}
                                              >
                                                  {formatValue(t.amount)}
                                              </div>

                                              {/* Status */}
                                              <div className="w-8 flex justify-center">
                                                  <button 
                                                      onClick={() => onToggleStatus(t.id)}
                                                      className={`transition-all hover:scale-110 ${
                                                          t.status === 'paid' 
                                                          ? 'text-emerald-500' 
                                                          : 'text-slate-300 hover:text-emerald-400'
                                                      }`}
                                                      title={t.status === 'paid' ? 'Marcar como pendente' : 'Marcar como pago'}
                                                  >
                                                      <CheckCircle className="w-5 h-5" />
                                                  </button>
                                              </div>

                                              {/* Actions */}
                                              <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={() => startInlineEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                                                      <Pencil className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                                                      <Trash2 className="w-4 h-4" />
                                                  </button>
                                              </div>
                                          </>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* Floating Add Button (Mobile Only) */}
      <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center z-40 hover:scale-105 transition-transform"
      >
          <Plus className="w-7 h-7" />
      </button>

    </div>
  );
};
