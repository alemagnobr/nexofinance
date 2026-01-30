
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod } from '../types';
import { Plus, Trash2, CheckCircle, Clock, ArrowUpCircle, ArrowDownCircle, Wallet, Wand2, Loader2, Camera, Upload, Repeat, ChevronLeft, ChevronRight, Calendar, Edit2, Pencil, ListFilter } from 'lucide-react';
import { suggestCategory, analyzeReceipt } from '../services/geminiService';

interface TransactionListProps {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal?: number; // Prop to trigger form open
}

const CATEGORY_STYLES: Record<string, string> = {
  // Despesas
  'Casa': 'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  'Mobilidade': 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'Alimentos': 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  'Lazer': 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'Saúde': 'bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  'Educação': 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  'Pets': 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  
  // Receitas
  'Salário': 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  'Renda Extra': 'bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  'Investimentos': 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  'Presente': 'bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  'Reembolso': 'bg-lime-100 text-lime-700 border border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800',
  
  // Comum
  'Outros': 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
};

const PAYMENT_LABELS: Record<string, string> = {
  'credit_card': 'Cartão de Crédito',
  'debit_card': 'Cartão de Débito',
  'cash': 'Dinheiro',
  'pix': 'PIX',
  'direct_debit': 'Débito em Conta',
  'bank_transfer': 'Transferência Bancária',
  'deposit': 'Depósito',
};

const EXPENSE_CATEGORIES = ['Casa', 'Mobilidade', 'Alimentos', 'Lazer', 'Saúde', 'Educação', 'Pets', 'Outros'];
const INCOME_CATEGORIES = ['Salário', 'Renda Extra', 'Investimentos', 'Presente', 'Reembolso', 'Outros'];

// Define available payment methods per transaction type
const EXPENSE_PAYMENT_METHODS = ['credit_card', 'debit_card', 'direct_debit', 'pix', 'cash'];
const INCOME_PAYMENT_METHODS = ['pix', 'bank_transfer', 'cash', 'deposit'];

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onAdd, onUpdate, onDelete, onToggleStatus, privacyMode, hasApiKey, quickActionSignal }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loadingAutoCat, setLoadingAutoCat] = useState(false);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // View Filter State (Tabs)
  const [viewFilter, setViewFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: 'Outros',
    date: new Date().toISOString().split('T')[0],
    status: 'paid' as TransactionStatus,
    paymentMethod: 'credit_card' as PaymentMethod,
    isRecurring: false
  });

  // Effect to listen for Quick Action triggers
  useEffect(() => {
    if (quickActionSignal && Date.now() - quickActionSignal < 2000) {
        setIsFormOpen(true);
        resetForm();
    }
  }, [quickActionSignal]);

  // Derived state for category options based on type
  const currentCategoryOptions = useMemo(() => {
    return newTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  }, [newTransaction.type]);

  // Derived state for payment methods based on type
  const currentPaymentMethods = useMemo(() => {
    return newTransaction.type === 'income' ? INCOME_PAYMENT_METHODS : EXPENSE_PAYMENT_METHODS;
  }, [newTransaction.type]);

  // Month Navigation Logic
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Filter Transactions by Month AND Type
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const [year, month] = t.date.split('-');
      const matchesMonth = (
        parseInt(year) === currentDate.getFullYear() &&
        parseInt(month) === currentDate.getMonth() + 1
      );
      
      const matchesType = viewFilter === 'all' || t.type === viewFilter;

      return matchesMonth && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentDate, viewFilter]);

  // Calculate Totals for the Selected Month (Always calculates totals regardless of filter view)
  const monthTransactionsForTotals = transactions.filter(t => {
      const [year, month] = t.date.split('-');
      return parseInt(year) === currentDate.getFullYear() && parseInt(month) === currentDate.getMonth() + 1;
  });

  const totalIncome = monthTransactionsForTotals
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = monthTransactionsForTotals
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpense;

  // Formatting
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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
    
    // Set a default payment method valid for the new type
    const defaultMethod = newType === 'income' ? 'pix' : 'credit_card';

    setNewTransaction(prev => ({
        ...prev,
        type: newType,
        category: newCats[0],
        paymentMethod: defaultMethod as PaymentMethod
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(1);
        lines.forEach(line => {
          if (!line) return;
          const [date, desc, val] = line.split(',');
          if (desc && val) {
            onAdd({
              description: desc,
              amount: parseFloat(val),
              type: 'expense',
              category: 'Outros',
              date: date || new Date().toISOString().split('T')[0],
              status: 'paid',
              paymentMethod: 'debit_card'
            });
          }
        });
        alert('Importação CSV concluída!');
      };
      reader.readAsText(file);
      return;
    }

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
      } else {
        alert('Não foi possível ler o recibo.');
      }
      setAnalyzingReceipt(false);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setNewTransaction({ 
        description: '', 
        amount: '', 
        type: 'expense', 
        category: 'Outros', 
        date: new Date().toISOString().split('T')[0], 
        status: 'paid', 
        paymentMethod: 'credit_card', 
        isRecurring: false 
    });
    setEditingId(null);
    // Note: Do not setIsFormOpen(false) here, as this is used by the quick action to reset state before showing
  }

  const handleEdit = (t: Transaction) => {
    setNewTransaction({
        description: t.description,
        amount: t.amount.toString(),
        type: t.type,
        category: t.category,
        date: t.date,
        status: t.status,
        paymentMethod: t.paymentMethod || (t.type === 'income' ? 'pix' : 'credit_card'),
        isRecurring: t.isRecurring || false
    });
    setEditingId(t.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData = {
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      category: newTransaction.category,
      date: newTransaction.date,
      status: newTransaction.status,
      paymentMethod: newTransaction.paymentMethod,
      isRecurring: newTransaction.isRecurring
    };

    if (editingId) {
        onUpdate(editingId, transactionData);
    } else {
        onAdd(transactionData);
    }
    
    resetForm();
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Transações</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 font-semibold text-slate-700 dark:text-slate-200 capitalize min-w-[140px] text-center flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              {formatMonth(currentDate)}
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <label 
             title={!hasApiKey ? "Configure a Chave API para usar Leitura de Recibo" : "Ler Recibo com IA"}
             className={`flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-4 py-2.5 rounded-lg transition-colors cursor-pointer text-sm font-medium
                ${!hasApiKey ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
          >
             {analyzingReceipt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
             <span className="hidden lg:inline">{analyzingReceipt ? 'Lendo...' : 'Ler Recibo'}</span>
             <input disabled={!hasApiKey} type="file" accept="image/*,.csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={() => {
                resetForm();
                setIsFormOpen(!isFormOpen);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova
          </button>
        </div>
      </div>

      {/* Summary Cards (Monthly) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Receitas ({formatMonth(currentDate)})</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatValue(totalIncome)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-full">
            <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Despesas ({formatMonth(currentDate)})</p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatValue(totalExpense)}</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/30 p-2 rounded-full">
            <ArrowDownCircle className="w-5 h-5 text-rose-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Balanço Mensal</p>
            <p className={`text-lg font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatValue(balance)}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-full">
            <Wallet className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

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
              className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none w-full pr-10"
            />
            <button
              type="button"
              onClick={handleAutoCategorize}
              disabled={loadingAutoCat || !newTransaction.description || !hasApiKey}
              className={`absolute right-2 top-2 ${!hasApiKey ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-700'} disabled:opacity-30`}
              title={!hasApiKey ? "Requer Chave IA" : "Auto-categorizar com IA"}
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

          <div className="flex items-center gap-2 p-2">
             <input 
                type="checkbox" 
                id="recurring"
                checked={newTransaction.isRecurring}
                onChange={(e) => setNewTransaction({...newTransaction, isRecurring: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded"
             />
             <label htmlFor="recurring" className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Repeat className="w-3 h-3" /> Assinatura/Recorrente
             </label>
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              {editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Modern Segmented Tabs */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl gap-1">
              <button 
                  onClick={() => setViewFilter('all')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                    ${viewFilter === 'all' 
                      ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'}`}
              >
                  <ListFilter className="w-4 h-4" />
                  Todas
              </button>
              <button 
                  onClick={() => setViewFilter('income')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                    ${viewFilter === 'income' 
                      ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'}`}
              >
                  <ArrowUpCircle className="w-4 h-4" />
                  Entradas
              </button>
              <button 
                  onClick={() => setViewFilter('expense')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                    ${viewFilter === 'expense' 
                      ? 'bg-white dark:bg-slate-600 text-rose-600 dark:text-rose-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'}`}
              >
                  <ArrowDownCircle className="w-4 h-4" />
                  Saídas
              </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-base font-medium mb-1">
                        {viewFilter === 'all' ? `Nenhuma transação em ${formatMonth(currentDate)}` : 
                         viewFilter === 'income' ? 'Nenhuma receita encontrada neste mês.' : 'Nenhuma despesa encontrada neste mês.'}
                    </p>
                    <p className="text-xs">Clique em "Nova" para adicionar.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white flex items-center gap-2">
                      {t.type === 'income' ? <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> : <ArrowDownCircle className="w-4 h-4 text-rose-500" />}
                      {t.description}
                      {t.isRecurring && <span title="Recorrente" className="flex items-center"><Repeat className="w-3 h-3 text-slate-400" /></span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_STYLES[t.category] || CATEGORY_STYLES['Outros']}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.type === 'expense' && '- '}
                      {formatValue(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs">{PAYMENT_LABELS[t.paymentMethod || ''] || t.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onToggleStatus(t.id)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                          t.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {t.status === 'paid' ? <><CheckCircle className="w-3 h-3" /> {t.type === 'income' ? 'Recebido' : 'Pago'}</> : <><Clock className="w-3 h-3" /> Pendente</>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-1">
                      <button onClick={() => handleEdit(t)} className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded p-1.5 transition-colors" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(t.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded p-1.5 transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
