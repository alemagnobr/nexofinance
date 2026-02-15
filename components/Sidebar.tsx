
import React, { useRef } from 'react';
import { 
  LayoutDashboard, Receipt, LineChart, Target, Calendar, Repeat, 
  MessageSquareMore, ShieldAlert, Hexagon, LogIn, LogOut, 
  Maximize, Minimize, Key, Eye, EyeOff, Moon, Sun, 
  HardDriveDownload, HardDriveUpload, Trash2, Heart, X, ShoppingCart, Github, Linkedin, Copy, Landmark, AppWindow, Wallet, StickyNote
} from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  user: any; 
  isGuest: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  
  // State props
  privacyMode: boolean;
  setPrivacyMode: (mode: boolean) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  hasKey: boolean;
  
  // Modal triggers
  onOpenKeyModal: () => void;
  onOpenDonateModal: () => void;
  
  // Data actions
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFactoryReset: () => void;

  // PWA
  canInstall: boolean;
  onInstall: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user, isGuest, mobileMenuOpen, setMobileMenuOpen, currentView, onNavigate, onLogout,
  privacyMode, setPrivacyMode, darkMode, setDarkMode, isFullscreen, toggleFullscreen, hasKey,
  onOpenKeyModal, onOpenDonateModal, onExportBackup, onImportBackup, onFactoryReset, canInstall, onInstall
}) => {
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNavClick = (view: View) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const NavItem = ({ view, icon: Icon, label, customClass = '' }: { view: View, icon: any, label: string, customClass?: string }) => (
    <button
      onClick={() => handleNavClick(view)}
      className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${customClass} ${
        currentView === view
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 ${currentView !== view && customClass ? 'text-purple-400 group-hover:text-white' : ''}`} />
      <div className="flex-1 flex justify-between items-center">
          <span>{label}</span>
      </div>
    </button>
  );

  return (
    <nav 
       className={`
         fixed md:sticky top-0 left-0 h-screen z-50 w-72 md:w-64 bg-slate-900 border-r border-slate-800 
         transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
         ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
       `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-900/50">
            <Hexagon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">
              NEXO
            </h1>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Financial Hub</span>
          </div>
        </div>
        <button 
           onClick={() => setMobileMenuOpen(false)}
           className="md:hidden text-slate-400 hover:text-white"
        >
           <X className="w-6 h-6" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 overflow-hidden text-xs text-white">
                  {user?.photoURL ? <img src={user.photoURL} alt="User" /> : (user?.email?.substring(0,2).toUpperCase() || 'CV')}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate" title={user?.email || 'Convidado'}>{user?.email?.split('@')[0] || 'Convidado'}</p>
                  <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <p className="text-[10px] text-slate-400">{user ? 'Online (Cloud)' : 'Offline (Local)'}</p>
                  </div>
              </div>
              <button onClick={onLogout} className="text-slate-400 hover:text-rose-500" title="Sair">
                  <LogOut className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col no-scrollbar">
        
        {/* Seção Destaque: Visão Geral */}
        <div className="mb-6 space-y-1">
            <p className="px-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Visão Geral</p>
            <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={View.TRANSACTIONS} icon={Receipt} label="Transações" />
            <NavItem view={View.KANBAN} icon={Wallet} label="NEXO Flow" />
            <NavItem view={View.CALENDAR} icon={Calendar} label="Agenda" />
        </div>

        {/* Seção Padrão: Gestão */}
        <div className="space-y-1">
            <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gestão Financeira</p>
            
            <NavItem view={View.BUDGETS} icon={Target} label="Metas" />
            <NavItem view={View.SUBSCRIPTIONS} icon={Repeat} label="Assinaturas" />
            <NavItem view={View.INVESTMENTS} icon={LineChart} label="Investir" />
            <NavItem view={View.DEBTS} icon={ShieldAlert} label="Limpa Nome" />
            <NavItem view={View.SHOPPING_LIST} icon={ShoppingCart} label="Lista de Compras" />
            <NavItem view={View.NOTES} icon={StickyNote} label="Bloco de Notas" />
            <NavItem view={View.WEALTH_PLANNER} icon={Landmark} label="Planejamento" customClass="text-amber-400" />
        </div>

        {/* NEXO AI - Differentiated Section */}
        <div className="mt-6 pt-4 border-t border-slate-800">
             <button
              onClick={() => hasKey ? handleNavClick(View.AI_ASSISTANT) : onOpenKeyModal()}
              className={`w-full relative group overflow-hidden rounded-xl p-[1px] transition-all duration-300 ${
                  currentView === View.AI_ASSISTANT 
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/20' 
                  : 'bg-slate-700/50 hover:bg-gradient-to-r hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500'
              }`}
            >
              <div className={`relative flex items-center gap-3 px-3 py-3 rounded-[11px] bg-slate-900 transition-colors h-full`}>
                  <div className={`p-1.5 rounded-lg ${currentView === View.AI_ASSISTANT ? 'bg-indigo-500/20' : 'bg-slate-800 group-hover:bg-slate-800'}`}>
                      <MessageSquareMore className={`w-5 h-5 ${currentView === View.AI_ASSISTANT ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                  </div>
                  <div className="flex-1 text-left">
                      <p className={`text-sm font-bold ${currentView === View.AI_ASSISTANT ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>NEXO AI</p>
                      <p className="text-[10px] text-slate-500 group-hover:text-slate-400">Assistente Virtual</p>
                  </div>
                  {!hasKey && <Key className="w-3 h-3 text-rose-500 animate-pulse" />}
              </div>
            </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900 shrink-0">
         {canInstall && (
             <button
                onClick={onInstall}
                className="w-full mb-4 flex items-center justify-center gap-2 p-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
             >
                <AppWindow className="w-3 h-3" /> Instalar App (PWA)
             </button>
         )}

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configurações & Dados</p>
        
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1: Visual Preferences */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title={privacyMode ? 'Mostrar Valores' : 'Ocultar Valores'}
          >
            {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={onOpenKeyModal}
            className={`flex items-center justify-center p-2 rounded-lg transition-all border border-slate-800 hover:border-slate-700 ${hasKey ? 'text-emerald-400 hover:bg-slate-800' : 'text-rose-400 hover:bg-slate-800 animate-pulse'}`}
            title="Configurar Chave API"
          >
            <Key className="w-5 h-5" />
          </button>

          {/* Row 2: Data & Support */}
          <button
             onClick={onExportBackup}
             className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-all border border-slate-800 hover:border-slate-700"
             title="Baixar Backup (Exportar)"
          >
             <HardDriveDownload className="w-5 h-5" />
          </button>
          
          <label 
             className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-all border border-slate-800 hover:border-slate-700 cursor-pointer"
             title="Restaurar Backup (Importar)"
          >
             <HardDriveUpload className="w-5 h-5" />
             <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".json"
                onChange={onImportBackup}
             />
          </label>

          <button
             onClick={onFactoryReset}
             className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-rose-500 transition-all border border-slate-800 hover:border-slate-700"
             title="Resetar App (Fábrica)"
          >
             <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenDonateModal}
            className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-pink-500 transition-all border border-slate-800 hover:border-slate-700"
            title="Apoiar Projeto"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Credits & Version */}
        <div className="pt-4 mt-3 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 font-mono">v2.4.0 Notes</p>
            <a 
              href="https://www.linkedin.com/in/alemagnobr/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-slate-400 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5 mt-1"
            >
              <Linkedin className="w-3 h-3" /> Alexandre Magno S. Linhares
            </a>
        </div>
      </div>
    </nav>
  );
};