import React, { useState } from 'react';
import { Wallet, WalletType } from '../types';
import { Plus, Trash2, Pencil, Landmark, CreditCard, Banknote, MoreHorizontal, CheckCircle, X, ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react';

interface WalletsViewProps {
  wallets: Wallet[];
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

export const WalletsView: React.FC<WalletsViewProps> = ({ wallets, onAdd, onUpdate, onDelete, onTransfer }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState<string>('');
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferObs, setTransferObs] = useState<string>('');
  
  const [formData, setFormData] = useState<Omit<Wallet, 'id'>>({
    name: '',
    type: WalletType.BANK,
    balance: 0,
    color: 'indigo'
  });

  const resetForm = () => {
    setFormData({ name: '', type: WalletType.BANK, balance: 0, color: 'indigo' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (wallet: Wallet) => {
    setFormData({
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      color: wallet.color || 'indigo',
      icon: wallet.icon
    });
    setEditingId(wallet.id);
    setIsFormOpen(true);
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
    if (onTransfer && transferSourceId && transferTargetId && transferAmount > 0) {
      onTransfer(transferSourceId, transferTargetId, transferAmount, transferDate, transferObs);
      setIsTransferModalOpen(false);
      setTransferAmount(0);
      setTransferObs('');
      setTransferTargetId('');
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  {editingId ? 'Editar Conta' : 'Nova Conta'}
                </h3>
                <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={e => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cor</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full bg-${color}-500 flex items-center justify-center transition-transform hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800 scale-110' : ''}`}
                    >
                      {formData.color === color && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 font-bold"
              >
                {editingId ? 'Salvar Alterações' : 'Criar Conta'}
              </button>
            </div>
          </form>
        </div>
      )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {wallets.map(wallet => {
              const TypeIcon = WALLET_TYPES.find(t => t.value === wallet.type)?.icon || MoreHorizontal;
              const colorClass = wallet.color ? `bg-${wallet.color}-100 text-${wallet.color}-600 dark:bg-${wallet.color}-900/30 dark:text-${wallet.color}-400` : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
              const borderClass = wallet.color ? `border-${wallet.color}-200 dark:border-${wallet.color}-800/50` : 'border-slate-200 dark:border-slate-700';

              return (
                <div key={wallet.id} className={`bg-white dark:bg-slate-800 rounded-xl p-3 border shadow-sm hover:shadow-md transition-all group ${borderClass}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onTransfer && (
                        <button onClick={() => {
                          setTransferSourceId(wallet.id);
                          setIsTransferModalOpen(true);
                        }} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Transferir">
                          <ArrowRightLeft className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(wallet)} className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors" title="Editar">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDelete(wallet.id)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors" title="Excluir">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate" title={wallet.name}>{wallet.name}</h3>
                    
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <p className={`text-sm font-bold ${wallet.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(wallet.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {wallets.length === 0 && !isFormOpen && (
              <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 text-center">
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
          </div>
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
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transferAmount || ''}
                  onChange={e => setTransferAmount(parseFloat(e.target.value) || 0)}
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
