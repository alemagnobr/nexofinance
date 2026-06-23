import React, { useState, useMemo } from 'react';
import { Wallet, WalletType, Transaction } from '../types';
import { Plus, Trash2, Pencil, Landmark, CreditCard, Banknote, MoreHorizontal, CheckCircle, X, ChevronDown, ChevronUp, ArrowRightLeft, AlertCircle, Utensils, Wallet as WalletIcon, Save } from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';

interface WalletsViewProps {
  wallets: Wallet[];
  transactions?: Transaction[];
  onAdd: (wallet: Omit<Wallet, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Wallet>) => void;
  onDelete: (id: string) => void;
  onTransfer?: (sourceWalletId: string, targetWalletId: string, amount: number, date: string, observation?: string) => void;
}

const WALLET_TYPES: { value: WalletType; label: string; icon: any }[] = [
  { value: WalletType.BANK, label: 'Conta Bancária', icon: Landmark },
  { value: WalletType.CREDIT_CARD, label: 'Cartão de Crédito', icon: CreditCard },
  { value: WalletType.MEAL_TICKET, label: 'Vale Refeição/Alimentação', icon: Banknote },
  { value: WalletType.OTHER, label: 'Outro', icon: MoreHorizontal },
];

const COLORS = ['slate', 'red', 'orange', 'amber', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

export const WalletsView: React.FC<WalletsViewProps> = ({ wallets, transactions = [], onAdd, onUpdate, onDelete, onTransfer }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string>('');
  
  const totals = useMemo(() => {
    return wallets.reduce(
      (acc, wallet) => {
        if (wallet.type === WalletType.BANK) acc.bank += wallet.balance;
        else if (wallet.type === WalletType.CREDIT_CARD) acc.credit += wallet.balance;
        else if (wallet.type === WalletType.MEAL_TICKET) acc.meal += wallet.balance;
        else if (wallet.type === WalletType.OTHER) acc.other += wallet.balance;
        return acc;
      },
      { bank: 0, credit: 0, meal: 0, other: 0 }
    );
  }, [wallets]);

  const creditCardsSummaries = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const allCreditCards = wallets.filter(w => w.type === WalletType.CREDIT_CARD);
    
    return allCreditCards.map(card => {
       const currentInvoiceSum = (transactions || [])
         .filter(t => t.walletId === card.id && t.type === 'expense' &&
                      new Date(t.date).getMonth() === currentMonth &&
                      new Date(t.date).getFullYear() === currentYear)
         .reduce((acc, t) => acc + t.amount, 0);

       return {
         ...card,
         currentInvoice: currentInvoiceSum
       };
    });
  }, [wallets, transactions]);

  const otherWallets = useMemo(() => wallets.filter(w => w.type !== WalletType.CREDIT_CARD), [wallets]);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState<string>('');
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferObs, setTransferObs] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');
  
  const [formData, setFormData] = useState<Omit<Wallet, 'id'>>({
    name: '',
    type: WalletType.BANK,
    balance: 0,
    color: 'indigo',
    observation: ''
  });

  const resetForm = () => {
    setFormData({ name: '', type: WalletType.BANK, balance: 0, color: 'indigo', observation: '', creditCardDueDate: undefined, creditLimit: undefined });
    setEditingId(null);
    setIsFormOpen(false);
    setWalletError('');
  };

  const handleEdit = (wallet: Wallet) => {
    setFormData({
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      color: wallet.color || 'indigo',
      icon: wallet.icon,
      observation: wallet.observation || '',
      creditCardDueDate: wallet.creditCardDueDate,
      creditLimit: wallet.creditLimit
    });
    setEditingId(wallet.id);
    setIsFormOpen(true);
    setWalletError('');
  };

  const handleDelete = (id: string) => {
    const hasLinkedTransactions = transactions.some(t => t.walletId === id);
    if (hasLinkedTransactions) {
      setWalletError('Não é possível excluir esta conta pois existem transações vinculadas a ela. Exclua as transações primeiro ou edite-as para outra conta.');
      // Auto clear error after 5s
      setTimeout(() => setWalletError(''), 5000);
      return;
    }
    setWalletError('');
    onDelete(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    resetForm();
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (transferAmount <= 0) {
      setTransferError('O valor da transferência deve ser maior que zero.');
      return;
    }
    
    if (transferSourceId === transferTargetId) {
      setTransferError('A conta de destino deve ser diferente da conta de origem.');
      return;
    }
    
    const sourceWallet = wallets.find(w => w.id === transferSourceId);
    if (sourceWallet && transferAmount > sourceWallet.balance) {
      setTransferError('Saldo insuficiente para esta transferência.');
      return;
    }
    
    if (onTransfer && transferSourceId && transferTargetId && transferAmount > 0) {
      onTransfer(transferSourceId, transferTargetId, transferAmount, transferDate, transferObs);
      setIsTransferModalOpen(false);
      setTransferAmount(0);
      setTransferObs('');
      setTransferTargetId('');
      setTransferError('');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-500" />
              Minhas Contas
            </h2>
            {isExpanded && <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie seus bancos, cartões e vales.</p>}
          </div>
        </div>
        {!isFormOpen && isExpanded && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-bold text-xs"
          >
            <Plus className="w-3 h-3" /> Nova Conta
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {isFormOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh] animate-scale-in border border-slate-200 dark:border-slate-700">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur z-20">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                    {editingId ? 'Editar Conta' : 'Nova Conta'}
                  </h3>
                  <button onClick={resetForm} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 md:p-6 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Conta</label>
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Nubank, Itaú, Vale Refeição"
                          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                        <select
                          value={formData.type}
                          onChange={e => setFormData({ ...formData, type: e.target.value as WalletType })}
                          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {WALLET_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Saldo Atual</label>
                        <CurrencyInput
                          required
                          value={formData.balance}
                          onChangeValue={val => setFormData({ ...formData, balance: parseFloat(val) || 0 })}
                          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {formData.type === WalletType.CREDIT_CARD && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Limite Total</label>
                            <CurrencyInput
                              value={formData.creditLimit || 0}
                              onChangeValue={val => setFormData({ ...formData, creditLimit: parseFloat(val) || 0 })}
                              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dia do Vencimento</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={formData.creditCardDueDate || ''}
                              onChange={e => setFormData({ ...formData, creditCardDueDate: parseInt(e.target.value) || undefined })}
                              placeholder="Ex: 10"
                              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </>
                      )}

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações (Opcional)</label>
                        <textarea
                          value={formData.observation || ''}
                          onChange={e => setFormData({ ...formData, observation: e.target.value })}
                          placeholder="Ex: Cartão vence dia 10, conta conjunta..."
                          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cor</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData({ ...formData, color })}
                              className={`w-8 h-8 rounded-full bg-${color}-500 flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${formData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800 scale-110' : ''}`}
                            >
                              {formData.color === color && <CheckCircle className="w-4 h-4 text-white" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 sticky bottom-0 bg-white/95 dark:bg-slate-800/95 pt-4 pb-2 border-t border-slate-100 dark:border-slate-700 z-10 w-full -mx-4 -mb-4 px-4 md:-mx-6 md:-mb-6 md:px-6">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {editingId ? 'Salvar Alterações' : 'Criar Conta'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

      {walletError && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-sm font-medium flex items-start gap-2 mb-4 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{walletError}</p>
        </div>
      )}

      {isExpanded && !isFormOpen && (
        <div className="mb-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700">
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/20">
                <Landmark className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">Contas</span>
                <span className="text-lg md:text-xl font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.bank)}
                </span>
              </div>
            </div>
            
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/20">
                <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">Cartões</span>
                <span className="text-lg md:text-xl font-bold text-slate-600 dark:text-slate-300 leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.credit)}
                </span>
              </div>
            </div>
            
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-500/20">
                <Utensils className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">Alimentação</span>
                <span className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.meal)}
                </span>
              </div>
            </div>
            
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-600/50">
                <MoreHorizontal className="w-5 h-5 md:w-6 md:h-6 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">Outros</span>
                <span className="text-lg md:text-xl font-bold text-slate-600 dark:text-slate-300 leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.other)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
         <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2 mb-3">
            <Landmark className="w-4 h-4 text-slate-500" /> Contas e Cartões
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {creditCardsSummaries.map(card => (
               <div key={card.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-3 rounded-xl shadow-md relative overflow-hidden group hover:shadow-lg transition-all flex flex-col justify-between">
                  <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${card.color || 'indigo'}-500/20 rounded-full blur-3xl`} />
                  
                  <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-1.5 relative z-10">
                        <div className={`p-1.5 rounded-lg bg-slate-700 text-${card.color || 'indigo'}-400`}>
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] text-slate-400 uppercase font-bold">Cartão de Crédito</span>
                           <h3 className="font-bold text-white text-xs truncate" title={card.name}>{card.name}</h3>
                        </div>
                     </div>
                     <div className="flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(card as Wallet)} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Editar">
                           <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(card.id)} className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors" title="Excluir">
                           <Trash2 className="w-3 h-3" />
                        </button>
                     </div>
                  </div>

                  <div className="relative z-10">
                     <div className="flex justify-between items-end mb-2">
                         <div>
                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mb-0.5">Fatura Atual</p>
                            <p className="text-sm font-black text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.currentInvoice)}</p>
                         </div>
                         {card.creditCardDueDate && (
                            <span className="text-[8px] font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600 mb-0.5">
                                Venc. {card.creditCardDueDate}
                            </span>
                         )}
                     </div>

                     {card.creditLimit ? (
                          <div className="pt-2 border-t border-slate-700/50 mt-1">
                             <div className="flex justify-between text-[9px] font-medium text-slate-400 mb-1.5">
                                <span>Lim: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.creditLimit)}</span>
                                <span className="text-white">Disp: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, card.creditLimit - card.currentInvoice))}</span>
                             </div>
                             <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all bg-${card.color || 'indigo'}-500`} style={{ width: `${Math.min(100, (card.currentInvoice / card.creditLimit) * 100)}%` }} />
                             </div>
                          </div>
                      ) : (
                          <div className="text-[9px] text-slate-500 italic mt-2">Sem limite.</div>
                      )}
                      {card.observation && (
                         <p className="text-[9px] text-slate-500 mt-2 line-clamp-1 italic">
                            {card.observation}
                         </p>
                      )}
                  </div>
               </div>
            ))}

            {otherWallets.map(wallet => {
              const TypeIcon = WALLET_TYPES.find(t => t.value === wallet.type)?.icon || MoreHorizontal;
              const typeLabel = WALLET_TYPES.find(t => t.value === wallet.type)?.label || 'Conta';
              const colorClass = wallet.color ? `bg-${wallet.color}-100 text-${wallet.color}-600 dark:bg-${wallet.color}-900/30 dark:text-${wallet.color}-400` : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
              const borderClass = wallet.color ? `border-${wallet.color}-200 dark:border-${wallet.color}-800/50` : 'border-slate-200 dark:border-slate-700';

              return (
                <div key={wallet.id} className={`bg-white dark:bg-slate-800 rounded-xl p-3 border shadow-sm hover:shadow-md transition-all group ${borderClass} flex flex-col justify-between`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                       <div className={`p-1.5 rounded-lg ${colorClass}`}>
                         <TypeIcon className="w-3.5 h-3.5" />
                       </div>
                       <div className="flex flex-col">
                           <span className="text-[8px] text-slate-400 uppercase font-bold">{typeLabel}</span>
                           <h3 className="font-bold text-slate-800 dark:text-white text-xs truncate" title={wallet.name}>{wallet.name}</h3>
                       </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onTransfer && (
                        <button onClick={() => {
                          setTransferSourceId(wallet.id);
                          setTransferTargetId('');
                          setTransferAmount(0);
                          setTransferDate(new Date().toISOString().split('T')[0]);
                          setTransferObs('');
                          setTransferError('');
                          setIsTransferModalOpen(true);
                        }} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Transferir">
                          <ArrowRightLeft className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(wallet)} className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors" title="Editar">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(wallet.id)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors" title="Excluir">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest mb-0.5">Saldo Atual</p>
                      <p className={`text-sm font-bold ${wallet.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wallet.balance)}
                      </p>
                    </div>
                    {wallet.observation && (
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 line-clamp-1 italic leading-tight">
                        {wallet.observation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
         </div>
      </div>
      
      {wallets.length === 0 && !isFormOpen && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 text-center">
          <Landmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nenhuma conta</h3>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-1 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-bold text-xs shadow-sm mt-2"
          >
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
      )}
        </>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white">Nova Transferência</h3>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {transferError && (
              <div className="mx-4 mt-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-sm font-medium flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{transferError}</p>
              </div>
            )}
            
            <form onSubmit={handleTransferSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conta de Origem</label>
                <div className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-xl p-3 opacity-70 flex justify-between items-center">
                  <span>{wallets.find(w => w.id === transferSourceId)?.name || 'Conta não encontrada'}</span>
                  <span className="font-bold text-sm">
                    Saldo: {formatCurrency(wallets.find(w => w.id === transferSourceId)?.balance || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conta de Destino</label>
                <select
                  required
                  value={transferTargetId}
                  onChange={e => setTransferTargetId(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecione a conta de destino</option>
                  {wallets.filter(w => w.id !== transferSourceId).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor</label>
                <CurrencyInput
                  required
                  value={transferAmount || ''}
                  onChangeValue={val => setTransferAmount(parseFloat(val) || 0)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                <input
                  required
                  type="date"
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observação (Opcional)</label>
                <input
                  type="text"
                  value={transferObs}
                  onChange={e => setTransferObs(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Transferência para reserva"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!transferTargetId || transferAmount <= 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
