
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Receipt, LineChart, PieChart, Eye, EyeOff, Moon, Sun, Target, Calendar, Repeat, MessageSquareMore, ShieldAlert, Hexagon, LogIn, LogOut, Loader2, Maximize, Minimize, Key, Check, Trash2, X, Download, Upload, HardDriveDownload, HardDriveUpload, Github, Linkedin, Heart, ShieldCheck, Copy, Gift, PlusCircle, TrendingUp, Banknote, Lock, Unlock, Cloud } from 'lucide-react';
import { AppData, View, Transaction, Investment, Budget, Debt, TransactionStatus } from './types';
import { loadData, saveData } from './services/storageService';
import { setApiKey, getApiKey, removeApiKey, hasCustomApiKey } from './services/geminiService';
import { auth } from './services/firebase'; // Import Auth
import { onAuthStateChanged, User, signOut } from 'firebase/auth'; // Import Firebase Types

import { Login } from './components/Login'; // Import Login Component
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

const PIX_KEY = "028.268.001-24";
const PIX_NAME = "Alexandre Magno dos Santos Linhares";

// --- Encryption Helpers ---
async function encryptData(data: string, password: string): Promise<{ iv: number[], ciphertext: number[] }> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(data)
    );
    
    // Return format: IV (12 bytes) + Salt (16 bytes) + Ciphertext
    // We will combine them for simple JSON serialization
    const combined = new Uint8Array(iv.length + salt.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(salt, iv.length);
    combined.set(new Uint8Array(encrypted), iv.length + salt.length);
    
    return { iv: Array.from(combined), ciphertext: [] }; // Using Array.from for compatibility if needed, but here we will just return base64
}

async function decryptData(combinedData: Uint8Array, password: string): Promise<string> {
    const iv = combinedData.slice(0, 12);
    const salt = combinedData.slice(12, 28);
    const ciphertext = combinedData.slice(28);
    
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    
    const key = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );
    
    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
}

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // App Data State (Initialized based on user later)
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Quick Action Trigger (Timestamp to force effect in children)
  const [quickActionSignal, setQuickActionSignal] = useState<number>(0);

  // API Key Management State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [userKeyInput, setUserKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);

  // Donation Modal State
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  // Welcome / Onboarding State
  const [showWelcome, setShowWelcome] = useState(false);

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AUTH EFFECT ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        // Load data specific to this user
        const userData = loadData(currentUser.uid);
        setData(userData);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- SAVE DATA EFFECT ---
  // Salva no LocalStorage sempre que houver mudanças, isolado por usuário ou convidado
  useEffect(() => {
    if (!authLoading) {
        if (user) {
            saveData(data, user.uid);
        } else if (isGuest) {
            saveData(data, 'guest_user');
        }
    }
  }, [data, user, isGuest, authLoading]);

  const handleGuestLogin = () => {
      setIsGuest(true);
      const guestData = loadData('guest_user');
      setData(guestData);
  };

  const handleLogout = async () => {
    if (isGuest) {
        setIsGuest(false);
        setData(DEFAULT_DATA);
    } else {
        await signOut(auth);
    }
    // Data will clear via auth effect setting user to null
  };

  // General Effects (Fullscreen, Key Check, Recurring)
  useEffect(() => {
    // Check if key exists on mount (User custom key only)
    setHasKey(hasCustomApiKey());
    
    // If we have a custom key stored, populate the input
    if (hasCustomApiKey()) {
       setUserKeyInput(getApiKey() || '');
    }

    // Check if it's the first visit
    // Make this user-specific key in future, or global per browser
    const hasSeenWelcome = localStorage.getItem('nexo_welcome_seen');
    if (!hasSeenWelcome && (user || isGuest)) {
        setShowWelcome(true);
    }

    // --- AUTOMATION: Check for Recurring Transactions ---
    if (user || isGuest) {
        processRecurringTransactions();
    }
  }, [user, isGuest]); // Re-run when user logs in

  const processRecurringTransactions = () => {
      setData(prevData => {
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          
          const recurringTemplates = new Map<string, Transaction>();
          
          prevData.transactions.forEach(t => {
              if (t.isRecurring) {
                  const existing = recurringTemplates.get(t.description);
                  if (!existing || new Date(t.date) > new Date(existing.date)) {
                      recurringTemplates.set(t.description, t);
                  }
              }
          });

          const newTransactions: Transaction[] = [];

          recurringTemplates.forEach((template, description) => {
               const existsInCurrentMonth = prevData.transactions.some(t => {
                   const tDate = new Date(t.date);
                   return t.description === description &&
                          t.amount === template.amount &&
                          tDate.getMonth() === currentMonth &&
                          tDate.getFullYear() === currentYear;
               });

               if (!existsInCurrentMonth) {
                   const tDate = new Date(template.date);
                   const targetDay = tDate.getDate();
                   const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                   const finalDay = Math.min(targetDay, daysInCurrentMonth);
                   const newDateObj = new Date(currentYear, currentMonth, finalDay);
                   
                   newTransactions.push({
                       ...template,
                       id: crypto.randomUUID(),
                       date: newDateObj.toISOString().split('T')[0],
                       status: 'pending',
                       isRecurring: true
                   });
               }
          });

          if (newTransactions.length > 0) {
              return {
                  ...prevData,
                  transactions: [...prevData.transactions, ...newTransactions]
              };
          }

          return prevData;
      });
  };

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

  // --- Quick Action Handler ---
  const triggerQuickAction = (view: View) => {
    setCurrentView(view);
    setTimeout(() => setQuickActionSignal(Date.now()), 50);
  };

  // --- BACKUP FUNCTIONS (Now with Encryption) ---
  const handleExportBackup = async () => {
    const jsonString = JSON.stringify(data, null, 2);
    let blob;
    let filename = `nexo_backup_${new Date().toISOString().split('T')[0]}.json`;

    if (window.confirm("Deseja criptografar este backup com uma senha? (Recomendado para Cloud Backup)")) {
        const password = window.prompt("Digite uma senha forte para criptografar:");
        if (password) {
            try {
                // Perform encryption manually here to get the byte array
                const enc = new TextEncoder();
                const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
                const salt = window.crypto.getRandomValues(new Uint8Array(16));
                const key = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(jsonString));
                
                const combined = new Uint8Array(iv.length + salt.length + encrypted.byteLength);
                combined.set(iv, 0);
                combined.set(salt, iv.length);
                combined.set(new Uint8Array(encrypted), iv.length + salt.length);

                // Convert to Base64 for easier JSON storage
                const base64Content = btoa(String.fromCharCode(...combined));
                const encryptedPayload = JSON.stringify({
                    isEncrypted: true,
                    data: base64Content
                });
                
                blob = new Blob([encryptedPayload], { type: "application/json" });
                filename = `nexo_secure_backup_${new Date().toISOString().split('T')[0]}.json`;
            } catch (e) {
                console.error(e);
                alert("Erro ao criptografar. Exportando sem senha.");
                blob = new Blob([jsonString], { type: "application/json" });
            }
        } else {
            blob = new Blob([jsonString], { type: "application/json" });
        }
    } else {
        blob = new Blob([jsonString], { type: "application/json" });
    }

    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonContent = e.target?.result as string;
        let parsedData = JSON.parse(jsonContent);
        
        // Check for encryption
        if (parsedData.isEncrypted && parsedData.data) {
            const password = window.prompt("Este backup é criptografado. Digite a senha para restaurar:");
            if (!password) return;

            try {
                // Convert Base64 back to Uint8Array
                const binaryString = atob(parsedData.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const decryptedString = await decryptData(bytes, password);
                parsedData = JSON.parse(decryptedString);
            } catch (err) {
                console.error(err);
                alert("Senha incorreta ou arquivo corrompido.");
                return;
            }
        }

        // Basic Validation
        if (Array.isArray(parsedData.transactions) && Array.isArray(parsedData.investments)) {
           if(window.confirm("Isso substituirá todos os seus dados atuais pelos do backup. Deseja continuar?")) {
             setData(parsedData);
             alert("Backup restaurado com sucesso!");
           }
        } else {
           alert("Arquivo de backup inválido.");
        }
      } catch (error) {
        console.error(error);
        alert("Erro ao ler o arquivo. Certifique-se de que é um JSON válido.");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
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
            hasApiKey={hasKey}
            quickActionSignal={quickActionSignal}
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
            hasApiKey={hasKey}
            quickActionSignal={quickActionSignal}
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
            quickActionSignal={quickActionSignal}
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
            quickActionSignal={quickActionSignal}
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

  // --- RENDER LOADING OR LOGIN ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Show login if NOT user AND NOT guest
  if (!user && !isGuest) {
    return <Login onGuestLogin={handleGuestLogin} />;
  }

  // Main App
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar Navigation - Dark Theme Permanent */}
      <nav className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col fixed md:relative bottom-0 z-20 md:h-screen md:max-h-screen shadow-2xl transition-all">
        {/* Header - Fixed */}
        <div className="hidden md:flex items-center gap-3 mb-6 px-2 mt-4 shrink-0">
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

        {/* User Profile - Fixed */}
        <div className="hidden md:flex items-center gap-3 mb-4 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 overflow-hidden text-xs text-white">
                {user?.photoURL ? <img src={user.photoURL} alt="User" /> : (user?.email?.substring(0,2).toUpperCase() || 'CV')}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate" title={user?.email || 'Convidado'}>{user?.email?.split('@')[0] || 'Convidado'}</p>
                <div className="flex items-center gap-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                   <p className="text-[10px] text-slate-400">{user ? 'Online' : 'Offline'}</p>
                </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500" title="Sair">
               <LogOut className="w-4 h-4" />
            </button>
        </div>

        {/* Menu Items - Scrollable */}
        <div className="flex md:flex-col justify-around md:justify-start gap-1.5 flex-1 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden no-scrollbar pb-2 md:pb-0 min-h-0">
          <p className="hidden md:block px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2 sticky top-0 bg-slate-900 z-10 py-1">Menu Principal</p>
          
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
            onClick={() => hasKey ? setCurrentView(View.AI_ASSISTANT) : null}
            disabled={!hasKey}
            title={!hasKey ? "Configure a Chave API para usar" : "Assistente IA"}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full flex-shrink-0 text-sm font-medium group ${
              !hasKey 
                ? 'opacity-40 cursor-not-allowed grayscale bg-slate-800/50 text-slate-600'
                : currentView === View.AI_ASSISTANT
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-900/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <MessageSquareMore className={`w-5 h-5 ${!hasKey ? 'text-slate-600' : currentView !== View.AI_ASSISTANT && 'text-purple-400 group-hover:text-white'}`} />
            <span className="hidden md:inline">NEXO AI {!hasKey && <span className="text-[10px] ml-1 opacity-50">(Req. Chave)</span>}</span>
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

        {/* Footer - Fixed */}
        <div className="hidden md:flex flex-col gap-2 mt-auto pt-4 border-t border-slate-800 shrink-0">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dados & Backup</p>
          
           {/* Backup Buttons */}
           <div className="flex gap-2 px-2 mb-2">
            <button
               onClick={handleExportBackup}
               className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-all border border-slate-700"
               title="Baixar Backup (Exportar)"
            >
               <HardDriveDownload className="w-5 h-5 mb-1" />
               <span className="text-[10px]">Backup</span>
            </button>
            <button
               onClick={handleImportClick}
               className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-all border border-slate-700"
               title="Restaurar Backup (Importar)"
            >
               <HardDriveUpload className="w-5 h-5 mb-1" />
               <span className="text-[10px]">Restaurar</span>
            </button>
            {/* Hidden Input for File Upload */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportFile} 
              accept=".json" 
              className="hidden" 
            />
           </div>

          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 mt-1">Preferências</p>
          
          {/* Grouped Icons Row */}
          <div className="flex gap-2 px-2">
            <button
              onClick={toggleFullscreen}
              className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
              title={privacyMode ? 'Mostrar Valores' : 'Ocultar Valores'}
            >
              {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={() => setIsKeyModalOpen(true)}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl w-full transition-all text-sm font-medium mt-2 ${
                hasKey 
                 ? 'text-emerald-400 hover:bg-emerald-900/20' 
                 : 'text-white bg-gradient-to-r from-rose-600 to-red-600 shadow-lg shadow-rose-900/40 hover:from-rose-500 hover:to-red-500'
            }`}
          >
            <Key className="w-4 h-4" />
            <span className="text-sm font-bold">
              Configurar IA
            </span>
            {hasKey ? <Check className="w-3 h-3 ml-auto" /> : <ShieldAlert className="w-3 h-3 ml-auto animate-pulse" />}
          </button>

          <button
            onClick={() => setIsDonateModalOpen(true)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl w-full transition-all text-sm font-medium text-rose-500 hover:bg-rose-900/20"
          >
            <Heart className="w-4 h-4" />
            <span className="text-sm font-bold">
              Apoiar Projeto
            </span>
          </button>

          {/* ATTRIBUTION FOOTER */}
          <div className="mt-2 pt-3 border-t border-slate-800 text-center">
             <a 
                href="https://www.linkedin.com/in/alemagnobr/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center group opacity-50 hover:opacity-100 transition-opacity"
             >
                <div className="flex items-center gap-1.5">
                   <p className="text-[10px] font-bold text-slate-500 group-hover:text-white">Alexandre Linhares</p>
                   <Linkedin className="w-3 h-3 text-slate-500 group-hover:text-[#0A66C2]" />
                </div>
                <p className="text-[9px] text-slate-600 group-hover:text-slate-500 mt-0.5">IaLe Hub</p>
             </a>
          </div>
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
              <button onClick={() => setIsKeyModalOpen(true)} className={`${hasKey ? 'text-emerald-400' : 'text-rose-500'} hover:text-white relative`}>
                <Key className="w-5 h-5" />
                {!hasKey && (
                   <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                   </span>
                )}
              </button>
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500">
                <LogOut className="w-5 h-5" />
              </button>
           </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-6xl mx-auto">
          {/* --- QUICK ACTION BAR --- */}
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
                onClick={() => triggerQuickAction(View.INVESTMENTS)}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-300 transition-all group"
             >
                <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Novo</p>
                    <p className="font-bold text-slate-700 dark:text-white">Investimento</p>
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

      {/* WELCOME / ONBOARDING MODAL */}
      {showWelcome && (
          <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 animate-scale-in my-8">
                  <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                      {/* Left: Branding & Info */}
                      <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white flex flex-col justify-between rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                          <div>
                             <div className="bg-white/20 w-fit p-3 rounded-xl mb-6 backdrop-blur-sm">
                                <Hexagon className="w-10 h-10 text-white" />
                             </div>
                             <h2 className="text-3xl font-bold mb-2">Bem-vindo ao NEXO</h2>
                             <p className="text-indigo-100 font-medium">Seu novo hub financeiro inteligente e livre.</p>
                          </div>
                          
                          <div className="space-y-6 mt-8 md:mt-0">
                              <div className="flex gap-4">
                                  <div className="bg-white/10 p-2 rounded-lg h-fit">
                                     <Cloud className="w-6 h-6 text-emerald-300" />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-lg mb-1">Acesso Seguro</h4>
                                      <p className="text-indigo-100 text-xs leading-relaxed">Sua conta é protegida pelo sistema de login seguro. Seus registros são vinculados exclusivamente ao seu usuário.</p>
                                  </div>
                              </div>
                              <div className="flex gap-4">
                                  <div className="bg-white/10 p-2 rounded-lg h-fit">
                                     <HardDriveDownload className="w-6 h-6 text-blue-300" />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-lg mb-1">Propriedade dos Dados</h4>
                                      <p className="text-indigo-100 text-xs leading-relaxed">Você está no comando. Acesse a área de <strong>Dados & Backup</strong> para baixar uma cópia local do seu histórico sempre que desejar.</p>
                                  </div>
                              </div>
                          </div>

                          <div className="mt-8 text-[10px] text-indigo-300 opacity-60">
                              Versão Open Source v1.0
                          </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="md:col-span-3 p-8 bg-white dark:bg-slate-800 flex flex-col justify-center">
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Configuração Inicial</h3>

                          {/* Donation Section */}
                          <div className="mb-8 p-5 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/10 dark:to-orange-900/10 border border-rose-100 dark:border-rose-900/30">
                              <div className="flex items-start gap-3">
                                  <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm text-rose-500">
                                      <Heart className="w-6 h-6 fill-rose-500" />
                                  </div>
                                  <div className="flex-1">
                                      <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-2">Apoie o Desenvolvedor</h4>
                                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                                         O <strong>NEXO</strong> é 100% gratuito e livre. Eu dedico horas de desenvolvimento para entregar uma ferramenta de ponta sem cobrar nada de você.
                                         <br/><br/>
                                         Se ele gera valor para sua vida, considere fazer um <strong>Pix</strong>. Sua contribuição é o combustível que mantém as atualizações e financia a criação de <strong>novos softwares livres</strong> para a comunidade.
                                      </p>
                                      
                                      <p className="text-xs font-bold text-slate-500 mb-1">Chave Pix do Desenvolvedor:</p>
                                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pl-3">
                                          <Gift className="w-4 h-4 text-emerald-500" />
                                          <code className="flex-1 text-xs font-mono text-slate-600 dark:text-slate-400 truncate select-all">{PIX_KEY}</code>
                                          <button 
                                            onClick={copyPix}
                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Copiar Chave"
                                          >
                                              <Copy className="w-4 h-4" />
                                          </button>
                                      </div>
                                      <p className="text-[10px] text-slate-500 mt-1 text-center">Beneficiário: {PIX_NAME}</p>
                                  </div>
                              </div>
                          </div>

                          {/* API Key Setup */}
                          <div className="space-y-4">
                               <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                                   Chave de Inteligência Artificial (Opcional)
                               </label>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                   Para ativar os recursos de IA (Chat, Leitura de Recibos, Dicas), insira sua chave gratuita do Google Gemini. Você pode fazer isso depois.
                               </p>
                               <div className="relative">
                                   <Key className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                   <input 
                                      type="text" // changed from password to text for easier setup on welcome
                                      value={userKeyInput}
                                      onChange={(e) => setUserKeyInput(e.target.value)}
                                      placeholder="Cole sua API Key aqui..."
                                      className="w-full pl-10 p-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                   />
                               </div>
                               <div className="text-right">
                                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">
                                      Obter chave gratuita &rarr;
                                  </a>
                               </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-8 flex flex-col sm:flex-row gap-3">
                              <button 
                                  onClick={() => setShowWelcome(false)}
                                  className="px-6 py-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                              >
                                  Configurar Depois
                              </button>
                              <button 
                                  onClick={handleFinishWelcome}
                                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
                              >
                                  {userKeyInput ? 'Salvar Chave e Entrar' : 'Começar a Usar'}
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* DONATION MODAL */}
      {isDonateModalOpen && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-scale-in">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                      Apoiar o Projeto
                   </h3>
                   <button onClick={() => setIsDonateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X className="w-6 h-6" />
                   </button>
               </div>
               
               <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                  O <strong>NEXO</strong> é um projeto Open Source desenvolvido com muito carinho. 
                  <br/><br/>
                  Se esta ferramenta ajuda você a organizar sua vida financeira, considere fazer uma doação de qualquer valor. 
                  <br/><br/>
                  Isso ajuda a pagar os custos de desenvolvimento e incentiva a criação de <strong>novos softwares livres</strong> para a comunidade.
               </p>

               <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase">Chave Pix do Desenvolvedor</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                      <code className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-200 select-all font-bold text-center">{PIX_KEY}</code>
                      <button 
                        onClick={copyPix}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Copiar"
                      >
                          <Copy className="w-5 h-5" />
                      </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 text-center">Beneficiário: {PIX_NAME}</p>
               </div>

               <button 
                   onClick={() => setIsDonateModalOpen(false)}
                   className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-lg shadow-rose-500/20 transition-colors"
               >
                   Fechar
               </button>
           </div>
        </div>
      )}

      {/* API Key Modal (Existing) */}
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

export default App;
