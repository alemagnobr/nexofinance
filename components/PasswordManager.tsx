import React, { useState, useEffect } from 'react';
import { PasswordEntry } from '../types';
import { Key, Lock, Unlock, Copy, Eye, EyeOff, Plus, Trash2, Edit2, ExternalLink, ShieldCheck, X } from 'lucide-react';
import * as CryptoJS from 'crypto-js';

interface PasswordManagerProps {
  passwords: PasswordEntry[];
  onAdd: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<PasswordEntry>) => void;
  onDelete: (id: string) => void;
  privacyMode: boolean;
}

export const PasswordManager: React.FC<PasswordManagerProps> = ({ passwords, onAdd, onUpdate, onDelete, privacyMode }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'Geral'
  });

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

  // Auto-lock timer
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isLocked) {
      timeout = setTimeout(() => {
        handleLock();
      }, 5 * 60 * 1000); // 5 minutes auto-lock
    }
    return () => clearTimeout(timeout);
  }, [isLocked, masterPassword]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwords.length === 0) {
      // First time setup
      if (inputPassword.length < 6) {
        setError('A Senha Mestra deve ter pelo menos 6 caracteres.');
        return;
      }
      setMasterPassword(inputPassword);
      setIsLocked(false);
      setInputPassword('');
      return;
    }

    // Verify by attempting to decrypt the first password
    try {
      const bytes = CryptoJS.AES.decrypt(passwords[0].encryptedPassword, inputPassword);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Wrong password');
      }
      
      setMasterPassword(inputPassword);
      setIsLocked(false);
      setInputPassword('');
    } catch (err) {
      setError('Senha Mestra incorreta.');
    }
  };

  const handleLock = () => {
    setMasterPassword('');
    setIsLocked(true);
    setRevealedPasswords({});
    setIsModalOpen(false);
  };

  const decryptPassword = (encrypted: string): string => {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, masterPassword);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      return 'Erro ao descriptografar';
    }
  };

  const toggleReveal = (id: string, encrypted: string) => {
    if (revealedPasswords[id]) {
      const newRevealed = { ...revealedPasswords };
      delete newRevealed[id];
      setRevealedPasswords(newRevealed);
    } else {
      setRevealedPasswords({
        ...revealedPasswords,
        [id]: decryptPassword(encrypted)
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optional: show a small toast here
  };

  const handleOpenModal = (entry?: PasswordEntry) => {
    if (entry) {
      setEditingId(entry.id);
      setFormData({
        title: entry.title,
        username: entry.username,
        password: decryptPassword(entry.encryptedPassword),
        url: entry.url || '',
        notes: entry.notes || '',
        category: entry.category || 'Geral'
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        category: 'Geral'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.password) return;

    const encryptedPassword = CryptoJS.AES.encrypt(formData.password, masterPassword).toString();

    if (editingId) {
      onUpdate(editingId, {
        title: formData.title,
        username: formData.username,
        encryptedPassword,
        url: formData.url,
        notes: formData.notes,
        category: formData.category
      });
    } else {
      onAdd({
        title: formData.title,
        username: formData.username,
        encryptedPassword,
        url: formData.url,
        notes: formData.notes,
        category: formData.category
      });
    }
    setIsModalOpen(false);
  };

  const filteredPasswords = passwords.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Cofre de Senhas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {passwords.length === 0 
              ? "Crie uma Senha Mestra para proteger seu cofre. Ela não poderá ser recuperada se você esquecer."
              : "Digite sua Senha Mestra para descriptografar e acessar suas senhas."}
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                autoFocus
                placeholder="Senha Mestra"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center font-medium tracking-widest"
              />
              {error && <p className="text-rose-500 text-xs mt-2 font-medium">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <Unlock className="w-5 h-5" />
              {passwords.length === 0 ? 'Criar Cofre' : 'Desbloquear Cofre'}
            </button>
          </form>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Criptografia AES-256 Ponta a Ponta
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Key className="w-7 h-7 text-indigo-600" />
            Cofre de Senhas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Suas senhas criptografadas e seguras.</p>
        </div>

        <div className="flex w-full md:w-auto gap-3 items-center">
          <div className="flex-1 relative group md:w-64">
            <input 
              type="text"
              placeholder="Buscar senhas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Nova Senha
          </button>
          <button 
            onClick={handleLock}
            className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-bold text-sm"
            title="Trancar Cofre"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPasswords.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
              <Key className="w-8 h-8 opacity-50" />
            </div>
            <p>Nenhuma senha encontrada.</p>
          </div>
        ) : (
          filteredPasswords.map(entry => (
            <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg uppercase">
                    {entry.title.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{entry.title}</h3>
                    {entry.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{entry.category}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(entry)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(entry.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="truncate flex-1 text-sm text-slate-600 dark:text-slate-300 font-medium">
                    {entry.username || 'Sem usuário'}
                  </div>
                  {entry.username && (
                    <button onClick={() => copyToClipboard(entry.username)} className="p-1 text-slate-400 hover:text-indigo-500 transition-colors" title="Copiar Usuário">
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="truncate flex-1 text-sm text-slate-800 dark:text-white font-mono tracking-wider">
                    {privacyMode ? '••••••••' : (revealedPasswords[entry.id] || '••••••••')}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleReveal(entry.id, entry.encryptedPassword)} 
                      className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                      title={revealedPasswords[entry.id] ? "Ocultar Senha" : "Mostrar Senha"}
                    >
                      {revealedPasswords[entry.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(decryptPassword(entry.encryptedPassword))} 
                      className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="Copiar Senha"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {entry.url && (
                <a href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                  <ExternalLink className="w-3 h-3" /> Acessar Site
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-500" />
                {editingId ? 'Editar Senha' : 'Nova Senha'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título / Site</label>
                <input 
                  type="text" required autoFocus
                  placeholder="Ex: Netflix, Google, Banco do Brasil"
                  className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário / Email</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
                  <input 
                    type="text" required
                    className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ex: https://netflix.com"
                  className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas (Opcional)</label>
                <textarea 
                  rows={2}
                  className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
