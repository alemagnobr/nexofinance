
import React, { useState, useEffect, useRef } from 'react';
import { Target, Calendar, ShieldAlert, Hexagon, Loader2, Key, Menu, PlusCircle, ShoppingCart, AppWindow } from 'lucide-react';
import { View, Transaction, TransactionStatus, ShoppingItem, PaymentMethod, AppData } from './types';
import { loadData, saveData, migrateLocalToCloud } from './services/storageService';
import { setApiKey, getApiKey, removeApiKey, hasCustomApiKey } from './services/geminiService';
import { auth } from './services/firebase'; 
import { onAuthStateChanged, User, signOut } from 'firebase/auth'; 

import { Login } from './components/Login'; 
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { InvestmentList } from './components/InvestmentList';
import { BudgetList } from './components/BudgetList';
import { SubscriptionManager } from './components/SubscriptionManager';
import { FinancialCalendar } from './components/FinancialCalendar';
import { AiAssistant } from './components/AiAssistant';
import { DebtManager } from './components/DebtManager';
import { ShoppingList } from './components/ShoppingList';
import { WealthPlanner } from './components/WealthPlanner'; // Nova Importação
import { Sidebar } from './components/Sidebar';
import { AppModals } from './components/AppModals';
import { useAppData } from './hooks/useAppData';

const PIX_KEY = "028.268.001-24";
const PIX_NAME = "Alexandre Magno dos Santos Linhares";

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Custom Hook for all Data Logic
  const { data, setData, actions } = useAppData(user, isGuest);
  
  // UI State
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Modals & Keys
  const [quickActionSignal, setQuickActionSignal] = useState<number>(0);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [userKeyInput, setUserKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setIsGuest(false);
        const localData = loadData('guest_user');
        if (localData.transactions.length > 0) {
            if (confirm("Encontramos dados no modo convidado. Deseja migrar para sua conta na nuvem?")) {
                await migrateLocalToCloud(currentUser.uid, localData);
                localStorage.removeItem('finansmart_data_v2_guest_user');
            }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoading && isGuest) {
        saveData(data, 'guest_user');
    }
  }, [data, isGuest, authLoading]);

  const handleGuestLogin = () => {
      setIsGuest(true);
      const guestData = loadData('guest_user');
      setData(guestData);
  };

  const handleLogout = async () => {
    if (isGuest) {
        setIsGuest(false);
        setData({
            transactions: [], investments: [], budgets: [], debts: [], shoppingList: [], unlockedBadges: []
        });
    } else {
        await signOut(auth);
    }
  };

  useEffect(() => {
    setHasKey(hasCustomApiKey());
    if (hasCustomApiKey()) {
       setUserKeyInput(getApiKey() || '');
    }
    const hasSeenWelcome = localStorage.getItem('nexo_welcome_seen');
    if (!hasSeenWelcome && (user || isGuest)) {
        setShowWelcome(true);
    }
  }, [user, isGuest]); 

  // Helpers
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

  const handleFinishWelcome = () => {
      if (userKeyInput.trim()) {
          setApiKey(userKeyInput.trim());
          setHasKey(true);
      }
      localStorage.setItem('nexo_welcome_seen', 'true');
      setShowWelcome(false);
  };

  const copyPix = () => {
      navigator.clipboard.writeText(PIX_KEY);
      alert("Chave Pix copiada!");
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleFactoryReset = () => {
    if (confirm("⚠️ ATENÇÃO: Isso apagará TODOS os dados, configurações e chave API deste navegador.\n\nDeseja realmente resetar o app para o estado de fábrica?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const handleExportBackup = () => {
     const dataStr = JSON.stringify(data);
     const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
     const linkElement = document.createElement('a');
     linkElement.setAttribute('href', dataUri);
     linkElement.setAttribute('download', 'nexo_backup.json');
     linkElement.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = async (event) => {
         try {
             const json = JSON.parse(event.target?.result as string);
             if (confirm('Isso substituirá seus dados atuais. Tem certeza?')) {
                 if (user) {
                     await migrateLocalToCloud(user.uid, json);
                 } else {
                     setData(json);
                 }
                 alert('Backup restaurado com sucesso!');
             }
         } catch (err) {
             alert('Erro ao ler arquivo de backup.');
         }
     };
     reader.readAsText(file);
  };

  const triggerQuickAction = (view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false); 
    setTimeout(() => setQuickActionSignal(Date.now()), 50);
  };

  // Logic to finish shopping (Convert cart to expense)
  const finishShopping = async (total: number, paymentMethod: string, category: string) => {
     const transaction: Omit<Transaction, 'id'> = {
         description: `Compra de Mercado (${new Date().toLocaleDateString()})`,
         amount: total,
         type: 'expense',
         category: category,
         date: new Date().toISOString().split('T')[0],
         status: 'paid',
         paymentMethod: paymentMethod as PaymentMethod,
         isRecurring: false
     };
     await actions.addTransaction(transaction);
     await actions.clearShoppingList();
     alert("Compra finalizada! Despesa registrada com sucesso.");
     setCurrentView(View.TRANSACTIONS);
  };

  // View Renderer
  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard data={data} privacyMode={privacyMode} onUnlockBadge={actions.unlockBadge} />;
      case View.TRANSACTIONS:
        return (
          <TransactionList 
            transactions={data.transactions}
            budgets={data.budgets}
            onAdd={actions.addTransaction}
            onUpdate={actions.updateTransaction}
            onDelete={actions.deleteTransaction}
            onToggleStatus={actions.toggleTransactionStatus}
            onNavigate={(view) => setCurrentView(view)}
            privacyMode={privacyMode}
            hasApiKey={hasKey}
            quickActionSignal={quickActionSignal}
          />
        );
      case View.INVESTMENTS:
        return (
          <InvestmentList 
            investments={data.investments}
            onAdd={actions.addInvestment}
            onUpdate={actions.updateInvestment}
            onDelete={actions.deleteInvestment}
            onNavigate={(view) => setCurrentView(view)}
            privacyMode={privacyMode}
            hasApiKey={hasKey}
            quickActionSignal={quickActionSignal}
          />
        );
      case View.SHOPPING_LIST:
        return (
          <ShoppingList 
             items={data.shoppingList || []}
             onAdd={actions.addShoppingItem}
             onUpdate={actions.updateShoppingItem}
             onDelete={actions.deleteShoppingItem}
             onClearList={actions.clearShoppingList}
             onFinishShopping={finishShopping}
             shoppingBudget={data.shoppingBudget}
             onUpdateBudget={actions.setShoppingBudget}
             hasApiKey={hasKey}
             privacyMode={privacyMode}
             quickActionSignal={quickActionSignal}
          />
        );
      case View.BUDGETS:
        return (
          <BudgetList 
            budgets={data.budgets || []} 
            transactions={data.transactions}
            investments={data.investments || []}
            onAdd={actions.addBudget} 
            onUpdate={actions.updateBudget}
            onDelete={actions.deleteBudget}
            onNavigate={(view) => setCurrentView(view)} 
            privacyMode={privacyMode} 
            quickActionSignal={quickActionSignal}
          />
        );
      case View.SUBSCRIPTIONS:
        return (
          <SubscriptionManager 
            transactions={data.transactions}
            onUpdateTransaction={actions.updateTransaction}
            onDeleteTransaction={actions.deleteTransaction}
            privacyMode={privacyMode}
          />
        );
      case View.CALENDAR:
        return (
          <FinancialCalendar 
            transactions={data.transactions} 
            onAddTransaction={actions.addTransaction}
            privacyMode={privacyMode} 
          />
        );
      case View.DEBTS:
        return (
          <DebtManager 
            debts={data.debts || []}
            onAdd={actions.addDebt}
            onUpdate={actions.updateDebt}
            onDelete={actions.deleteDebt}
            onAddTransaction={actions.addTransaction}
            privacyMode={privacyMode}
            quickActionSignal={quickActionSignal}
          />
        );
      case View.AI_ASSISTANT:
        return <AiAssistant data={data} privacyMode={privacyMode} />;
      case View.WEALTH_PLANNER:
        return (
          <WealthPlanner 
             data={data}
             onSaveProfile={actions.saveWealthProfile}
             privacyMode={privacyMode}
             hasApiKey={hasKey}
          />
        );
      default:
        return <Dashboard data={data} privacyMode={privacyMode} onUnlockBadge={actions.unlockBadge} />;
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin" /></div>;
  }

  if (!user && !isGuest) {
    return <Login onGuestLogin={handleGuestLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <Sidebar 
        user={user}
        isGuest={isGuest}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onLogout={handleLogout}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        hasKey={hasKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenDonateModal={() => setIsDonateModalOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onFactoryReset={handleFactoryReset}
        canInstall={!!deferredPrompt}
        onInstall={handleInstallClick}
      />

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-8 overflow-y-auto h-screen scroll-smooth">
        <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 p-4 border-b border-slate-800 z-30 flex items-center justify-between shadow-md">
           <div className="flex items-center gap-3">
             <button onClick={() => setMobileMenuOpen(true)} className="text-slate-300 hover:text-white p-1"><Menu className="w-6 h-6" /></button>
             <div className="flex items-center gap-2">
                 <div className="bg-indigo-600 p-1.5 rounded-lg"><Hexagon className="w-4 h-4 text-white" /></div>
                 <span className="font-bold text-white tracking-tight">NEXO</span>
             </div>
           </div>
           
           <div className="flex gap-4 items-center">
              {deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className="text-emerald-400 hover:text-white animate-pulse"
                  title="Instalar Aplicativo"
                >
                  <AppWindow className="w-5 h-5" />
                </button>
              )}

              <button onClick={() => setIsKeyModalOpen(true)} className={`${hasKey ? 'text-emerald-400' : 'text-rose-500'} hover:text-white relative`}>
                <Key className="w-5 h-5" />
                {!hasKey && (
                   <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                   </span>
                )}
              </button>
           </div>
        </div>

        <div className="max-w-7xl mx-auto animate-fade-in">
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
             <button 
                onClick={() => triggerQuickAction(View.TRANSACTIONS)}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-blue-100 dark:border-blue-900/30 hover:border-blue-300 transition-all group"
             >
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600 dark:text-blue-400">
                    <PlusCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nova</p>
                    <p className="font-bold text-slate-700 dark:text-white">Transação</p>
                </div>
             </button>

             <button 
                onClick={() => triggerQuickAction(View.SHOPPING_LIST)}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 transition-all group"
             >
                <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600 dark:text-emerald-400">
                    <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Calculadora</p>
                    <p className="font-bold text-slate-700 dark:text-white">Mercado</p>
                </div>
             </button>

             <button 
                onClick={() => triggerQuickAction(View.DEBTS)}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-rose-100 dark:border-rose-900/30 hover:border-rose-300 transition-all group"
             >
                <div className="bg-rose-100 dark:bg-rose-900/40 p-2.5 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Registrar</p>
                    <p className="font-bold text-slate-700 dark:text-white">Dívida</p>
                </div>
             </button>

             <button 
                onClick={() => triggerQuickAction(View.BUDGETS)}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-pink-100 dark:border-pink-900/30 hover:border-pink-300 transition-all group"
             >
                <div className="bg-pink-100 dark:bg-pink-900/40 p-2.5 rounded-lg group-hover:bg-pink-600 group-hover:text-white transition-colors text-pink-600 dark:text-pink-400">
                    <Target className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Definir</p>
                    <p className="font-bold text-slate-700 dark:text-white">Meta/Limite</p>
                </div>
             </button>
          </div>

          {renderContent()}
        </div>
      </main>

      <AppModals 
        showWelcome={showWelcome}
        isDonateModalOpen={isDonateModalOpen}
        isKeyModalOpen={isKeyModalOpen}
        userKeyInput={userKeyInput}
        hasKey={hasKey}
        PIX_KEY={PIX_KEY}
        PIX_NAME={PIX_NAME}
        setShowWelcome={setShowWelcome}
        setIsDonateModalOpen={setIsDonateModalOpen}
        setIsKeyModalOpen={setIsKeyModalOpen}
        setUserKeyInput={setUserKeyInput}
        handleSaveKey={handleSaveKey}
        handleRemoveKey={handleRemoveKey}
        handleFinishWelcome={handleFinishWelcome}
        copyPix={copyPix}
      />
    </div>
  );
};

export default App;
