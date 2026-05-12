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
      id: View.SAUDE_DASHBOARD, 
      label: 'Painel Geral', 
      icon: LayoutDashboard,
      activeClass: 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200'
    },
    { 
      id: View.TREINO, 
      label: 'Gestão de Treinos', 
      icon: Dumbbell,
      activeClass: 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200'
    }
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Sub-navigation Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 -mt-4 mx-[-1rem] md:-mt-8 md:mx-[-2rem] px-4 md:px-8 pt-4 md:pt-8">
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
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id as View)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 border
                    ${isActive ? tab.activeClass : tab.inactiveClass}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
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
