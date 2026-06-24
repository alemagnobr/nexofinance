import React from 'react';
import { View } from '../types';
import { Activity, Dumbbell, Apple, LayoutDashboard } from 'lucide-react';
import { TreinoView } from './TreinoView';

interface SaudeViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
}

export const SaudeView: React.FC<SaudeViewProps> = ({ currentView, onNavigate, data, actions }) => {
  const tabs = [
    { 
      id: View.TREINO, 
      label: 'Gestão de Treinos', 
      icon: Dumbbell,
      activeColor: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Sub-navigation Header */}
      <div className="mb-6">
        <div className="pb-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">Saúde e Bem-estar</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Acompanhe seu corpo, treinos e alimentação.</p>
            </div>
          </div>
          
          {/* Internal Tabs Navigation - Integrated Segmented Control */}
          <div className="w-full overflow-x-auto scrollbar-hide pb-2 md:pb-0">
            <div className="flex items-stretch justify-center w-max min-w-full p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl mx-auto border border-slate-200/50 dark:border-slate-700/50">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = currentView === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onNavigate(tab.id as View)}
                    className={`
                      flex-1 shrink-0 relative flex flex-row items-center justify-center gap-1.5 md:gap-2 py-2 md:py-2.5 px-3 md:px-2 rounded-xl font-bold transition-all duration-300
                      ${isActive 
                        ? `bg-white dark:bg-slate-700 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600 ${tab.activeColor}` 
                        : `text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50`}
                    `}
                  >
                    <Icon className={`w-4 h-4 md:w-4 md:h-4 ${isActive ? 'scale-110' : ''} transition-transform`} />
                    <span className="text-xs md:text-sm whitespace-nowrap truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full bg-slate-50/50 dark:bg-slate-900">
        {currentView === View.SAUDE_DASHBOARD && (
          <div className="p-4 md:p-8 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Módulos de Saúde</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => onNavigate(View.TREINO)}>
                <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
                  <Dumbbell className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Gestão de Treinos e Projetos</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Registre seus projetos, fichas de treino, dietas e acompanhe as progressões de carga.</p>
              </div>

            </div>
          </div>
        )}

        {currentView === View.TREINO && (
          <TreinoView data={data} actions={actions} />
        )}
      </div>
    </div>
  );
};
