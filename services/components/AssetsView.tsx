
import React from 'react';
import { View } from '../types';
import { InvestmentList } from './InvestmentList';
import { BudgetList } from './BudgetList';
import { WealthPlanner } from './WealthPlanner';
import { LineChart, Target, Landmark } from 'lucide-react';

interface AssetsViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ 
  currentView, onNavigate, data, actions, privacyMode, hasApiKey, quickActionSignal 
}) => {
  
  const tabs = [
    { id: View.INVESTMENTS, label: 'Investimentos', icon: LineChart },
    { id: View.BUDGETS, label: 'Metas & Tetos', icon: Target },
    { id: View.WEALTH_PLANNER, label: 'Planejamento', icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation - Enhanced Design */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Gestão de Patrimônio</p>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {tabs.map(tab => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  relative flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl font-bold transition-all duration-200 border-2
                  ${isActive 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-xs md:text-sm text-center md:text-left">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
        {currentView === View.INVESTMENTS && (
          <InvestmentList 
            investments={data.investments}
            onAdd={actions.addInvestment}
            onUpdate={actions.updateInvestment}
            onDelete={actions.deleteInvestment}
            onNavigate={onNavigate}
            privacyMode={privacyMode}
            hasApiKey={hasApiKey}
            quickActionSignal={quickActionSignal}
          />
        )}
        {currentView === View.BUDGETS && (
          <BudgetList 
            budgets={data.budgets || []} 
            transactions={data.transactions}
            investments={data.investments || []}
            onAdd={actions.addBudget} 
            onUpdate={actions.updateBudget}
            onDelete={actions.deleteBudget}
            onNavigate={onNavigate} 
            privacyMode={privacyMode} 
            quickActionSignal={quickActionSignal}
          />
        )}
        {currentView === View.WEALTH_PLANNER && (
          <WealthPlanner 
             data={data}
             onSaveProfile={actions.saveWealthProfile}
             privacyMode={privacyMode}
             hasApiKey={hasApiKey}
          />
        )}
      </div>
    </div>
  );
};
