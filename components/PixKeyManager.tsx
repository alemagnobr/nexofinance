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
          Object.values(
            pixKeys.reduce((acc, key) => {
              const normalizedBank = (key.bank || 'Outros').trim().toLowerCase();
              if (!acc[normalizedBank]) {
                acc[normalizedBank] = { name: key.bank || 'Outros', keys: [] };
              }
              acc[normalizedBank].keys.push(key);
              return acc;
            }, {} as Record<string, { name: string; keys: PixKey[] }>)
          ).map((group) => (
            <div key={group.name} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Landmark size={20} />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-lg">{group.name}</h4>
              </div>
              <div className="space-y-3 flex-1">
                {group.keys.map(key => (
                  <div key={key.id} className="group relative flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" title={key.type.toUpperCase()}>{getIcon(key.type)}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {key.label || key.type.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => onDelete(key.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir chave"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                      <code className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate mr-2 select-all">
                        {key.key}
                      </code>
                      <button
                        onClick={() => handleCopy(key.key, key.id)}
                        className="flex-shrink-0 p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                        title="Copiar Chave"
                      >
                        {copiedId === key.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
