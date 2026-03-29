import React, { useState } from 'react';
import { PixKey, PixKeyType } from '../types';
import { Plus, Trash2, Copy, Check, Landmark, X } from 'lucide-react';

interface PixKeyManagerProps {
  pixKeys: PixKey[];
  onAdd: (key: Omit<PixKey, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

export const PixKeyManager: React.FC<PixKeyManagerProps> = ({ pixKeys, onAdd, onDelete }) => {
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [addingKeyToBank, setAddingKeyToBank] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // State for new bank form
  const [newBank, setNewBank] = useState('');
  const [newKeyType, setNewKeyType] = useState<PixKeyType>('cpf');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');

  // State for adding key to existing bank
  const [existingBankKeyType, setExistingBankKeyType] = useState<PixKeyType>('cpf');
  const [existingBankKeyValue, setExistingBankKeyValue] = useState('');
  const [existingBankKeyLabel, setExistingBankKeyLabel] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank || !newKeyValue) return;
    onAdd({
      bank: newBank,
      type: newKeyType,
      key: newKeyValue,
      label: newKeyLabel
    });
    setNewBank('');
    setNewKeyValue('');
    setNewKeyLabel('');
    setIsAddingBank(false);
  };

  const handleAddKeyToBank = (e: React.FormEvent, bank: string) => {
    e.preventDefault();
    if (!existingBankKeyValue) return;
    onAdd({
      bank,
      type: existingBankKeyType,
      key: existingBankKeyValue,
      label: existingBankKeyLabel
    });
    setExistingBankKeyValue('');
    setExistingBankKeyLabel('');
    setAddingKeyToBank(null);
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

  const groupedKeys = pixKeys.reduce((acc, key) => {
    if (!acc[key.bank]) acc[key.bank] = [];
    acc[key.bank].push(key);
    return acc;
  }, {} as Record<string, PixKey[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Minhas Chaves Pix</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie suas chaves agrupadas por banco</p>
        </div>
        <button
          onClick={() => setIsAddingBank(!isAddingBank)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Novo Banco</span>
        </button>
      </div>

      {isAddingBank && (
        <form onSubmit={handleAddBank} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Banco</label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank, Itaú..."
                value={newBank}
                onChange={e => setNewBank(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo de Chave</label>
              <select
                value={newKeyType}
                onChange={e => setNewKeyType(e.target.value as PixKeyType)}
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
                value={newKeyValue}
                onChange={e => setNewKeyValue(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Apelido (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Conta Principal"
                value={newKeyLabel}
                onChange={e => setNewKeyLabel(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddingBank(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Salvar Banco e Chave
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(groupedKeys).length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Landmark className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
            <p className="text-slate-500 dark:text-slate-400">Nenhuma chave Pix cadastrada.</p>
          </div>
        ) : (
          Object.entries(groupedKeys).map(([bank, keys]) => (
            <div key={bank} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Landmark size={20} />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-lg">{bank}</h4>
                </div>
                <button
                  onClick={() => setAddingKeyToBank(bank)}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title="Adicionar chave a este banco"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="p-4 space-y-3 flex-1">
                {keys.map(key => (
                  <div key={key.id} className="group relative bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getIcon(key.type)}</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {key.label || key.type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onDelete(key.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir Chave"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                      <code className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate mr-2">
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

                {addingKeyToBank === bank && (
                  <form onSubmit={(e) => handleAddKeyToBank(e, bank)} className="bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30 mt-3 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase">Nova Chave</span>
                      <button type="button" onClick={() => setAddingKeyToBank(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <select
                        value={existingBankKeyType}
                        onChange={e => setExistingBankKeyType(e.target.value as PixKeyType)}
                        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="cpf">CPF</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Celular</option>
                        <option value="random">Chave Aleatória</option>
                        <option value="other">Outro</option>
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="Chave Pix"
                        value={existingBankKeyValue}
                        onChange={e => setExistingBankKeyValue(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Apelido (Opcional)"
                        value={existingBankKeyLabel}
                        onChange={e => setExistingBankKeyLabel(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
