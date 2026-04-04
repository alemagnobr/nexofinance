import React, { useState } from 'react';
import { Wallet, WalletType } from '../types';
import { Plus, Trash2, Pencil, Landmark, CreditCard, Banknote, MoreHorizontal, CheckCircle, X } from 'lucide-react';

interface WalletsViewProps {
  wallets: Wallet[];
  onAdd: (wallet: Omit<Wallet, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Wallet>) => void;
  onDelete: (id: string) => void;
}

const WALLET_TYPES: { value: WalletType; label: string; icon: any }[] = [
  { value: WalletType.BANK, label: 'Conta Bancária', icon: Landmark },
  { value: WalletType.CREDIT_CARD, label: 'Cartão de Crédito', icon: CreditCard },
  { value: WalletType.MEAL_TICKET, label: 'Vale Refeição/Alimentação', icon: Banknote },
  { value: WalletType.OTHER, label: 'Outro', icon: MoreHorizontal },
];

const COLORS = ['slate', 'red', 'orange', 'amber', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

export const WalletsView: React.FC<WalletsViewProps> = ({ wallets, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-500" />
            Minhas Contas
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seus bancos, cartões e vales.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Nova Conta
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 animate-scale-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {editingId ? 'Editar Conta' : 'Nova Conta'}
            </h3>
            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map(wallet => {
          const TypeIcon = WALLET_TYPES.find(t => t.value === wallet.type)?.icon || MoreHorizontal;
          const colorClass = wallet.color ? `bg-${wallet.color}-100 text-${wallet.color}-600 dark:bg-${wallet.color}-900/30 dark:text-${wallet.color}-400` : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
          const borderClass = wallet.color ? `border-${wallet.color}-200 dark:border-${wallet.color}-800/50` : 'border-slate-200 dark:border-slate-700';

          return (
            <div key={wallet.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all group ${borderClass}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClass}`}>
                  <TypeIcon className="w-6 h-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(wallet)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(wallet.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{wallet.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{WALLET_TYPES.find(t => t.value === wallet.type)?.label}</p>
                
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Saldo Atual</p>
                  <p className={`text-xl font-bold ${wallet.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(wallet.balance)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {wallets.length === 0 && !isFormOpen && (
          <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
            <Landmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Nenhuma conta cadastrada</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Adicione suas contas bancárias, cartões e vales para começar a gerenciar.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-bold text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" /> Adicionar Primeira Conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
