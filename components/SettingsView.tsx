
import React, { useState, useRef } from 'react';
import { View, Category, TransactionType, AppData } from '../types';
import { Settings, Key, Database, Palette, Shield, Download, Upload, Trash2, Plus, X, Monitor, Moon, Sun, Lock } from 'lucide-react';

interface SettingsViewProps {
  data: AppData;
  actions: any;
  privacyMode: boolean;
  setPrivacyMode: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  hasApiKey: boolean;
  onOpenKeyModal: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFactoryReset: () => void;
}

const COLORS = [
    { name: 'emerald', bg: 'bg-emerald-500' },
    { name: 'blue', bg: 'bg-blue-500' },
    { name: 'rose', bg: 'bg-rose-500' },
    { name: 'amber', bg: 'bg-amber-500' },
    { name: 'purple', bg: 'bg-purple-500' },
    { name: 'indigo', bg: 'bg-indigo-500' },
    { name: 'pink', bg: 'bg-pink-500' },
    { name: 'orange', bg: 'bg-orange-500' },
    { name: 'teal', bg: 'bg-teal-500' },
    { name: 'cyan', bg: 'bg-cyan-500' },
    { name: 'slate', bg: 'bg-slate-500' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  data, actions, privacyMode, setPrivacyMode, darkMode, setDarkMode, hasApiKey,
  onOpenKeyModal, onExportBackup, onImportBackup, onFactoryReset
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'data'>('general');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('expense');
  const [newCatColor, setNewCatColor] = useState('slate');
  
  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleAddCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCatName.trim()) return;
      
      const newCat: Category = {
          id: `cat_${Date.now()}`,
          name: newCatName.trim(),
          type: newCatType,
          color: newCatColor,
          isDefault: false
      };
      
      actions.addCategory(newCat);
      setNewCatName('');
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          if (!text) return;
          
          const lines = text.split('\n');
          let count = 0;
          
          // Simple parser assuming: Date,Description,Value
          // Skipping header
          for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              const parts = line.split(',');
              if (parts.length >= 3) {
                  // Basic sanitization
                  const date = parts[0].trim(); // Assuming ISO or clean format
                  const description = parts[1].trim();
                  const valueRaw = parts[2].trim();
                  const value = parseFloat(valueRaw);
                  
                  if (!isNaN(value)) {
                      const amount = Math.abs(value);
                      const type = value < 0 ? 'expense' : 'income';
                      
                      actions.addTransaction({
                          description: description || 'Importado',
                          amount: amount,
                          type: type,
                          category: 'Outros', // Default to Outros
                          date: date.includes('/') ? date.split('/').reverse().join('-') : date, // Try to fix DD/MM/YYYY to ISO
                          status: 'paid',
                          paymentMethod: 'credit_card',
                          isRecurring: false
                      });
                      count++;
                  }
              }
          }
          alert(`${count} transações importadas com sucesso! Verifique as datas e categorias.`);
      };
      reader.readAsText(file);
  };

  const categories = data.categories || [];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      <div className="flex items-center gap-3 mb-6">
          <div className="bg-slate-200 dark:bg-slate-700 p-2.5 rounded-xl">
              <Settings className="w-6 h-6 text-slate-700 dark:text-slate-200" />
          </div>
          <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Personalize sua experiência no NEXO.</p>
          </div>
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button 
             onClick={() => setActiveTab('general')}
             className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap
               ${activeTab === 'general' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
          >
             <Monitor className="w-4 h-4" /> Geral & API
          </button>
          <button 
             onClick={() => setActiveTab('categories')}
             className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap
               ${activeTab === 'categories' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
          >
             <Palette className="w-4 h-4" /> Categorias
          </button>
          <button 
             onClick={() => setActiveTab('data')}
             className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap
               ${activeTab === 'data' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
          >
             <Database className="w-4 h-4" /> Dados & Backup
          </button>
      </div>

      {/* CONTENT */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 min-h-[400px]">
          
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
              <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Preferências Visuais</h3>
                          
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                      {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-800 dark:text-white">Modo Escuro</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Alternar tema claro/escuro</p>
                                  </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} className="sr-only peer" />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                              </label>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                      {privacyMode ? <Shield className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-800 dark:text-white">Modo Privacidade</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Ocultar valores monetários</p>
                                  </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" checked={privacyMode} onChange={(e) => setPrivacyMode(e.target.checked)} className="sr-only peer" />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                              </label>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Integrações</h3>
                          
                          <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h4 className="font-bold text-lg flex items-center gap-2"><Key className="w-5 h-5" /> Google Gemini API</h4>
                                      <p className="text-indigo-100 text-xs mt-1">Inteligência Artificial para análises e categorização.</p>
                                  </div>
                                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${hasApiKey ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'}`}>
                                      {hasApiKey ? 'Conectado' : 'Desconectado'}
                                  </div>
                              </div>
                              <button 
                                  onClick={onOpenKeyModal}
                                  className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-bold transition-colors"
                              >
                                  {hasApiKey ? 'Gerenciar Chave' : 'Configurar Chave'}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* 2. CATEGORIES TAB */}
          {activeTab === 'categories' && (
              <div className="animate-fade-in h-full flex flex-col">
                  {/* Add Form */}
                  <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-3 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                      <div className="flex-1">
                          <input 
                              type="text" 
                              placeholder="Nome da nova categoria..." 
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>
                      <div className="flex gap-2">
                          <select 
                              value={newCatType}
                              onChange={(e) => setNewCatType(e.target.value as TransactionType)}
                              className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none"
                          >
                              <option value="expense">Despesa</option>
                              <option value="income">Receita</option>
                          </select>
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-300 dark:border-slate-600">
                              {COLORS.map(c => (
                                  <button
                                      key={c.name}
                                      type="button"
                                      onClick={() => setNewCatColor(c.name)}
                                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${c.bg} ${newCatColor === c.name ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
                                  />
                              ))}
                          </div>
                          <button 
                              type="submit"
                              disabled={!newCatName.trim()}
                              className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                              <Plus className="w-5 h-5" />
                          </button>
                      </div>
                  </form>

                  {/* List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-3 flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-800 pb-2">
                              Entradas
                          </h4>
                          <div className="space-y-2">
                              {categories.filter(c => c.type === 'income').map(cat => (
                                  <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-3 h-3 rounded-full bg-${cat.color}-500`}></div>
                                          <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                                      </div>
                                      {!cat.isDefault && (
                                          <button 
                                              onClick={() => { if(confirm(`Excluir categoria "${cat.name}"?`)) actions.deleteCategory(cat.id); }}
                                              className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div>
                          <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase mb-3 flex items-center gap-2 border-b border-rose-200 dark:border-rose-800 pb-2">
                              Saídas
                          </h4>
                          <div className="space-y-2">
                              {categories.filter(c => c.type === 'expense').map(cat => (
                                  <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-3 h-3 rounded-full bg-${cat.color}-500`}></div>
                                          <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                                      </div>
                                      {!cat.isDefault && (
                                          <button 
                                              onClick={() => { if(confirm(`Excluir categoria "${cat.name}"?`)) actions.deleteCategory(cat.id); }}
                                              className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* 3. DATA TAB */}
          {activeTab === 'data' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                          <div>
                              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Download className="w-5 h-5 text-indigo-500" /> Exportar Backup</h4>
                              <p className="text-sm text-slate-500 mt-2">Baixe todos os seus dados em um arquivo JSON seguro. Ideal para migrar entre dispositivos.</p>
                          </div>
                          <button onClick={onExportBackup} className="mt-6 w-full py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                              Baixar JSON
                          </button>
                      </div>

                      <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                          <div>
                              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Upload className="w-5 h-5 text-emerald-500" /> Restaurar Backup</h4>
                              <p className="text-sm text-slate-500 mt-2">Recupere seus dados a partir de um arquivo JSON exportado anteriormente.</p>
                          </div>
                          <label className="mt-6 w-full py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-center block">
                              Selecionar Arquivo
                              <input 
                                  type="file" 
                                  ref={fileInputRef}
                                  className="hidden" 
                                  accept=".json"
                                  onChange={onImportBackup}
                              />
                          </label>
                      </div>
                  </div>

                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Importar Transações (CSV Simples)</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                          Importe extratos simples. Formato esperado: <code>Data,Descrição,Valor</code> (sem cabeçalho).
                          <br/><span className="text-xs opacity-70">Ex: 2024-03-20,Mercado,-150.00</span>
                      </p>
                      <input 
                          type="file" 
                          ref={csvInputRef}
                          accept=".csv"
                          onChange={handleCsvImport}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                      />
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div className="p-4 border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/10 rounded-xl flex items-center justify-between">
                          <div>
                              <h4 className="font-bold text-rose-700 dark:text-rose-400">Zona de Perigo</h4>
                              <p className="text-xs text-rose-600/80 dark:text-rose-400/70">Isso apagará todos os dados locais deste navegador.</p>
                          </div>
                          <button onClick={onFactoryReset} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-700">
                              Resetar App
                          </button>
                      </div>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};
