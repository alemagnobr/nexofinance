
import React, { useRef } from 'react';
import { 
  LayoutDashboard, Receipt, LineChart, Target, Calendar, Repeat, 
  MessageSquareMore, ShieldAlert, Hexagon, LogIn, LogOut, 
  Maximize, Minimize, Key, Eye, EyeOff, Moon, Sun, 
  HardDriveDownload, HardDriveUpload, Trash2, Heart, X, ShoppingCart, Github, Linkedin, Copy, Landmark 
} from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  user: any; // Using any for Firebase User type simplicity here, or import User from firebase/auth
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  user, isGuest, mobileMenuOpen, setMobileMenuOpen, currentView, onNavigate, onLogout,
  privacyMode, setPrivacyMode, darkMode, setDarkMode, isFullscreen, toggleFullscreen, hasKey,
  onOpenKeyModal, onOpenDonateModal, onExportBackup, onImportBackup, onFactoryReset
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
          {view === View.AI_ASSISTANT && !hasKey && <Key className="w-3 h-3 text-rose-500" />}
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
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu Principal</p>
        
        {/* Reordered Menu as requested */}
        
        <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
        <NavItem view={View.CALENDAR} icon={Calendar} label="Agenda" />
        <NavItem view={View.TRANSACTIONS} icon={Receipt} label="Transações" />
        <NavItem view={View.BUDGETS} icon={Target} label="Metas" />
        <NavItem view={View.SUBSCRIPTIONS} icon={Repeat} label="Assinaturas" />
        <NavItem view={View.INVESTMENTS} icon={LineChart} label="Investir" />
        <NavItem view={View.DEBTS} icon={ShieldAlert} label="Limpa Nome" />
        <NavItem view={View.SHOPPING_LIST} icon={ShoppingCart} label="Lista de Compras" />
        <NavItem view={View.WEALTH_PLANNER} icon={Landmark} label="Planejamento" customClass="text-amber-400" />
        
        <button
          onClick={() => hasKey ? handleNavClick(View.AI_ASSISTANT) : onOpenKeyModal()}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium group ${
            currentView === View.AI_ASSISTANT
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <MessageSquareMore className={`w-5 h-5 ${currentView !== View.AI_ASSISTANT && 'text-purple-400 group-hover:text-white'}`} />
          <div className="flex-1 flex justify-between items-center">
              <span>NEXO AI</span>
              {!hasKey && <Key className="w-3 h-3 text-rose-500" />}
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900 shrink-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dados & Backup</p>
        
         <div className="flex gap-2 mb-2">
          <button
             onClick={onExportBackup}
             className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-all border border-slate-700"
             title="Baixar Backup (Exportar)"
          >
             <HardDriveDownload className="w-5 h-5 mb-1" />
             <span className="text-[10px]">Backup</span>
          </button>
          
          <label className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-all border border-slate-700 cursor-pointer">
             <HardDriveUpload className="w-5 h-5 mb-1" />
             <span className="text-[10px]">Restaurar</span>
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
             className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition-all border border-slate-700"
             title="Resetar App (Fábrica)"
          >
             <Trash2 className="w-5 h-5 mb-1" />
             <span className="text-[10px]">Reset</span>
          </button>
         </div>

         <button
            onClick={onOpenDonateModal}
            className="w-full mb-3 flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
         >
            <Heart className="w-3 h-3 fill-current" /> Apoiar Projeto
         </button>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preferências</p>
        
        <div className="flex gap-2 mb-3">
          <button
            onClick={toggleFullscreen}
            className="flex-1 flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="flex-1 flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title={privacyMode ? 'Mostrar Valores' : 'Ocultar Valores'}
          >
            {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex-1 flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={onOpenKeyModal}
            className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all border border-slate-800 hover:border-slate-700 ${hasKey ? 'text-emerald-400 hover:bg-slate-800' : 'text-rose-400 hover:bg-slate-800 animate-pulse'}`}
            title="Configurar Chave API"
          >
            <Key className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
