
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, LineChart, PieChart, Eye, EyeOff, Moon, Sun, Target, Calendar, Repeat, MessageSquareMore, ShieldAlert, Hexagon, LogIn, LogOut, Loader2, Maximize, Minimize, Key, Check, Trash2, X } from 'lucide-react';
import { AppData, View, Transaction, Investment, Budget, Debt, TransactionStatus } from './types';
import { loadData, saveData } from './services/storageService';
import { setApiKey, getApiKey, removeApiKey, hasCustomApiKey } from './services/geminiService';

import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { InvestmentList } from './components/InvestmentList';
import { BudgetList } from './components/BudgetList';
import { SubscriptionManager } from './components/SubscriptionManager';
import { FinancialCalendar } from './components/FinancialCalendar';
import { AiAssistant } from './components/AiAssistant';
import { DebtManager } from './components/DebtManager';

const DEFAULT_DATA: AppData = {
    transactions: [],
    investments: [],
    budgets: [],
    debts: [],
    unlockedBadges: []
};

const App: React.FC = () => {
  // Inicializa com dados do LocalStorage
  const [data, setData] = useState<AppData>(() => {
    return loadData() || DEFAULT_DATA;
  });
  
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // API Key Management State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [userKeyInput, setUserKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    // Check if key exists on mount (User custom key only)
    setHasKey(hasCustomApiKey());
    
    // If we have a custom key stored, populate the input
    if (hasCustomApiKey()) {
       setUserKeyInput(getApiKey() || '');
    }
  }, []);

  const handleSaveKey = () => {
     if (userKeyInput.trim()) {
        setApiKey(userKeyInput.trim());
        setHasKey(true);
        setIsKeyModalOpen(false);
        alert('Chave API salva no seu navegador com sucesso!');
     }
  };

  const handleRemoveKey = () => {
     removeApiKey();
     setUserKeyInput('');
     setHasKey(false);
     setIsKeyModalOpen(false);
  };

  // Salva no LocalStorage sempre que houver mudanças
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Dark Mode Toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
          console.error(`Erro ao tentar tela cheia: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Unlock Badge Handler
  const unlockBadge = (badgeId: string) => {
    if (!data.unlockedBadges.includes(badgeId)) {
      setData(prev => ({
        ...prev,
        unlockedBadges: [...prev.unlockedBadges, badgeId]
      }));
    }
  };

  // Transaction Handlers
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...t, id: crypto.randomUUID() };
    setData(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction]
    }));
  };

  const deleteTransaction = (id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const toggleTransactionStatus = (id: string) => {
    setData(prev => {
      const targetTransaction = prev.transactions.find(t => t.id === id);
      if (!targetTransaction) return prev;
      const newStatus: TransactionStatus = targetTransaction.status === 'paid' ? 'pending' : 'paid';

      const updatedTransactions = prev.transactions.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
      );

      let updatedDebts = prev.debts;
      if (targetTransaction.debtId) {
         updatedDebts = prev.debts.map(d => {
            if (d.id === targetTransaction.debtId) {
               return {
                  ...d,
                  status: newStatus === 'paid' ? 'paid' : 'agreement'
               };
            }
            return d;
         });
      }

      return {
        ...prev,
        transactions: updatedTransactions,
        debts: updatedDebts
      };
    });
  };

  // Investment Handlers
  const addInvestment = (inv: Omit<Investment, 'id'>) => {
    const newInvestment: Investment = { ...inv, id: crypto.randomUUID() };
    setData(prev => ({
      ...prev,
      investments: [...prev.investments, newInvestment]
    }));
  };

  const updateInvestment = (id: string, newAmount: number) => {
    setData(prev => ({
      ...prev,
      investments: prev.investments.map(inv => 
        inv.id === id ? { ...inv, amount: newAmount } : inv
      )
    }));
  };

  const deleteInvestment = (id: string) => {
    setData(prev => ({
      ...prev,
      investments: prev.investments.filter(i => i.id !== id)
    }));
  };

  // Budget Handlers
  const addBudget = (b: Omit<Budget, 'id'>) => {
    const newBudget: Budget = { ...b, id: crypto.randomUUID() };
    setData(prev => ({
      ...prev,
      budgets: [...(prev.budgets || []), newBudget]
    }));
  };

  const deleteBudget = (id: string) => {
    setData(prev => ({
      ...prev,
      budgets: prev.budgets.filter(b => b.id !== id)
    }));
  };

  // Debt Handlers
  const addDebt = (d: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...d, id: crypto.randomUUID() };
    setData(prev => ({
      ...prev,
      debts: [...(prev.debts || []), newDebt]
    }));
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    setData(prev => ({
      ...prev,
      debts: prev.debts.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  const deleteDebt = (id: string) => {
    setData(prev => ({
      ...prev,
      debts: prev.debts.filter(d => d.id !== id)
    }));
  };

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard data={data} privacyMode={privacyMode} onUnlockBadge={unlockBadge} />;
      case View.TRANSACTIONS:
        return (
          <TransactionList 
            transactions={data.transactions}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
            onToggleStatus={toggleTransactionStatus}
            privacyMode={privacyMode}
          />
        );
      case View.INVESTMENTS:
        return (
          <InvestmentList 
            investments={data.investments}
            onAdd={addInvestment}
            onUpdate={updateInvestment}
            onDelete={deleteInvestment}
            privacyMode={privacyMode}
          />
        );
      case View.BUDGETS:
        return (
          <BudgetList 
            budgets={data.budgets || []} 
            transactions={data.transactions}
            onAdd={addBudget} 
            onDelete={deleteBudget} 
            privacyMode={privacyMode} 
          />
        );
      case View.SUBSCRIPTIONS:
        return (
          <SubscriptionManager 
            transactions={data.transactions}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            privacyMode={privacyMode}
          />
        );
      case View.CALENDAR:
        return (
          <FinancialCalendar 
            transactions={data.transactions}
            privacyMode={privacyMode}
          />
        );
      case View.DEBTS:
        return (
          <DebtManager 
            debts={data.debts || []}
            onAdd={addDebt}
            onUpdate={updateDebt}
            onDelete={deleteDebt}
            onAddTransaction={addTransaction}
            privacyMode={privacyMode}
          />
        );
      case View.AI_ASSISTANT:
        return (
          <AiAssistant 
            data={data}
            privacyMode={privacyMode}
          />
        );
      default:
        return <Dashboard data={data} privacyMode={privacyMode} onUnlockBadge={unlockBadge} />;
    }
  };

  // Main App
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar Navigation - Dark Theme Permanent */}
      <nav className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col fixed md:relative bottom-0 z-20 md:h-screen shadow-2xl transition-all">
        <div className="hidden md:flex items-center gap-3 mb-10 px-2 mt-4">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-900/50">
            <Hexagon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">
              NEXO
            </h1>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Financial Hub</span>
          </div>
        </div>

        {/* User Profile Placeholder (Offline Mode) */}
        <div className="hidden md:flex items-center gap-3 mb-6 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                <span className="text-xs font-bold text-white">EU</span>
            </div>
            <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Minha Conta</p>
                <div className="flex items-center gap-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                   <p className="text-[10px] text-slate-400">
                      {hasKey ? 'IA Conectada' : 'IA Offline'}
                   </p>
                </div>
            </div>
        </div>

        <div className="flex md:flex-col justify-around md:justify-start gap-1.5 h-full flex-1 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
          <p className="hidden md:block px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Menu Principal</p>
          
          <button
            onClick={() => setCurrentView(View.DASHBOARD)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full flex-shrink-0 text-sm font-medium ${
              currentView === View.DASHBOARD
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="hidden md:inline">Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView(View.TRANSACTIONS)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full flex-shrink-0 text-sm font-medium ${
              currentView === View.TRANSACTIONS
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="hidden md:inline">Transações</span>
          </button>

          <button
            onClick={() => setCurrentView(View.AI_ASSISTANT)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full flex-shrink-0 text-sm font-medium group ${
              currentView === View.AI_ASSISTANT
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <MessageSquareMore className={`w-5 h-5 ${currentView !== View.AI_ASSISTANT && 'text-purple-400 group-hover:text-white'}`} />
            <span className="hidden md:inline">NEXO AI</span>
          </button>

          <button
            onClick={() => setCurrentView(View.BUDGETS)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full flex-shrink-0 text-sm font-medium ${
              currentView === View.BUDGETS
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="hidden md:inline">Metas</span>
          </button>

          <button
            onClick={() => setCurrentView(View.DEBTS)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full flex-shrink-0 text-sm font-medium ${
              currentView === View.DEBTS
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="hidden md:inline">Limpa Nome</span>
          </button>

          <button
            onClick={() => setCurrentView(View.SUBSCRIPTIONS)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full flex-shrink-0 text-sm font-medium ${
              currentView === View.SUBSCRIPTIONS
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Repeat className="w-5 h-5" />
            <span className="hidden md:inline">Assinaturas</span>
          </button>

          <button
            onClick={() => setCurrentView(View.CALENDAR)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full flex-shrink-0 text-sm font-medium ${
              currentView === View.CALENDAR
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="hidden md:inline">Calendário</span>
          </button>

          <button
            onClick={() => setCurrentView(View.INVESTMENTS)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full flex-shrink-0 text-sm font-medium ${
              currentView === View.INVESTMENTS
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LineChart className="w-5 h-5" />
            <span className="hidden md:inline">Investimentos</span>
          </button>
        </div>

        <div className="hidden md:flex flex-col gap-2 mt-auto pt-6 border-t border-slate-800">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Preferências</p>
          
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white w-full transition-all text-sm font-medium"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            <span className="text-sm">
              {isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
            </span>
          </button>

          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white w-full transition-all text-sm font-medium"
          >
            {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span className="text-sm">
              {privacyMode ? 'Mostrar Valores' : 'Ocultar Valores'}
            </span>
          </button>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white w-full transition-all text-sm font-medium"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-sm">
              {darkMode ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>

          <button
            onClick={() => setIsKeyModalOpen(true)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all text-sm font-medium ${hasKey ? 'text-emerald-400 hover:bg-emerald-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Key className="w-5 h-5" />
            <span className="text-sm">
              Configurar IA
            </span>
            {hasKey && <Check className="w-3 h-3 ml-auto" />}
          </button>
        </div>
        
        {/* Mobile Header - Dark Theme */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 p-4 border-b border-slate-800 z-30 flex items-center justify-between shadow-md">
           <div className="flex items-center">
             <div className="bg-indigo-600 p-1.5 rounded-lg mr-2">
                <Hexagon className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-white tracking-tight">NEXO</span>
           </div>
           <div className="flex gap-4">
              <button onClick={() => setIsKeyModalOpen(true)} className={`${hasKey ? 'text-emerald-400' : 'text-slate-400'} hover:text-white`}>
                <Key className="w-5 h-5" />
              </button>
              <button onClick={toggleFullscreen} className="text-slate-400 hover:text-white">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="text-slate-400 hover:text-white">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => setPrivacyMode(!privacyMode)} className="text-slate-400 hover:text-white">
                  {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
           </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-scale-in">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Key className="w-6 h-6 text-indigo-500" />
                      Configurar Chave API
                   </h3>
                   <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X className="w-6 h-6" />
                   </button>
               </div>
               
               <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Para usar a IA do NEXO (recomendações, leitura de recibos e chat), você precisa de uma chave gratuita do Google.
               </p>

               <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
                  <li>Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline hover:text-indigo-600">Google AI Studio</a>.</li>
                  <li>Crie uma nova chave de API (Gratuita).</li>
                  <li>Cole a chave no campo abaixo.</li>
               </ol>

               <div className="space-y-4">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Sua API Key</label>
                      <input 
                         type="password"
                         value={userKeyInput}
                         onChange={(e) => setUserKeyInput(e.target.value)}
                         placeholder="Cole sua chave aqui (AIza...)"
                         className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                         <ShieldAlert className="w-3 h-3" /> Sua chave fica salva apenas no seu navegador.
                      </p>
                   </div>

                   <div className="flex gap-2">
                      {hasCustomApiKey() && (
                          <button 
                             onClick={handleRemoveKey}
                             className="px-4 py-2 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                             <Trash2 className="w-4 h-4" /> Remover
                          </button>
                      )}
                      <button 
                         onClick={handleSaveKey}
                         disabled={!userKeyInput}
                         className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                         Salvar e Conectar
                      </button>
                   </div>
               </div>
           </div>
        </div>
      )}
      
    </div>
  );
};

// Helper for icons
const ArrowRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
)

export default App;
