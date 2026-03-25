import React, { useState } from 'react';
import { PixKey, PixKeyType } from '../types';
import { Plus, Trash2, Copy, Check, Landmark } from 'lucide-react';

interface PixKeyManagerProps {
  pixKeys: PixKey[];
  onAdd: (key: Omit<PixKey, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

export const PixKeyManager: React.FC<PixKeyManagerProps> = ({ pixKeys, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<Omit<PixKey, 'id' | 'createdAt'>>({
    bank: '',
    type: 'cpf',
    key: '',
    label: ''
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.bank || !newKey.key) return;
    onAdd(newKey);
    setNewKey({ bank: '', type: 'cpf', key: '', label: '' });
    setIsAdding(false);
  };

  const getIcon = (type: PixKeyType) => {
    switch (type) {
      case 'cpf': return '🆔';
      case 'email': return '📧';
      case 'phone': return '📱';
      case 'random': return '🔀';
      default: return '🔑';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Minhas Chaves Pix</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie suas chaves para facilitar recebimentos</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Nova Chave</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Banco</label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank, Itaú..."
                value={newKey.bank}
                onChange={e => setNewKey({ ...newKey, bank: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo de Chave</label>
              <select
                value={newKey.type}
                onChange={e => setNewKey({ ...newKey, type: e.target.value as PixKeyType })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="phone">Celular</option>
                <option value="random">Chave Aleatória</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Chave Pix</label>
              <input
                type="text"
                required
                placeholder="Insira a chave aqui"
                value={newKey.key}
                onChange={e => setNewKey({ ...newKey, key: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Apelido (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Conta Principal"
                value={newKey.label}
                onChange={e => setNewKey({ ...newKey, label: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Salvar Chave
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pixKeys.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Landmark className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
            <p className="text-slate-500 dark:text-slate-400">Nenhuma chave Pix cadastrada.</p>
          </div>
        ) : (
          pixKeys.map(key => (
            <div key={key.id} className="group relative bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-xl rounded-lg">
                    {getIcon(key.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{key.bank}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      {key.label || key.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(key.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <code className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate mr-2">
                  {key.key}
                </code>
                <button
                  onClick={() => handleCopy(key.key, key.id)}
                  className="flex-shrink-0 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                  title="Copiar Chave"
                >
                  {copiedId === key.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
