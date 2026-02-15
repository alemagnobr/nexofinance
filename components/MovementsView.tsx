
import React from 'react';
import { View, Transaction, Budget, Debt } from '../types';
import { TransactionList } from './TransactionList';
import { FinancialCalendar } from './FinancialCalendar';
import { SubscriptionManager } from './SubscriptionManager';
import { DebtManager } from './DebtManager';
import { Receipt, Calendar, Repeat, ShieldAlert } from 'lucide-react';

interface MovementsViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const MovementsView: React.FC<MovementsViewProps> = ({ 
  currentView, onNavigate, data, actions, privacyMode, hasApiKey, quickActionSignal 
}) => {
  
  const tabs = [
    { id: View.TRANSACTIONS, label: 'Transações', icon: Receipt },
    { id: View.CALENDAR, label: 'Agenda', icon: Calendar },
    { id: View.SUBSCRIPTIONS, label: 'Assinaturas', icon: Repeat },
    { id: View.DEBTS, label: 'Dívidas', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation - Enhanced Design */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Navegação</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {tabs.map(tab => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  relative flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-200 border-2
                  ${isActive 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-sm">{tab.label}</span>
                
                {/* Active Indicator Dot (Optional Visual Cue) */}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-400/50 rounded-full blur-sm md:hidden"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
        {currentView === View.TRANSACTIONS && (
          <TransactionList 
            transactions={data.transactions}
            categories={data.categories}
            budgets={data.budgets}
            onAdd={actions.addTransaction}
            onUpdate={actions.updateTransaction}
            onDelete={actions.deleteTransaction}
            onToggleStatus={actions.toggleTransactionStatus}
            onNavigate={onNavigate}
            privacyMode={privacyMode}
            hasApiKey={hasApiKey}
            quickActionSignal={quickActionSignal}
          />
        )}
        {currentView === View.CALENDAR && (
          <FinancialCalendar 
            transactions={data.transactions} 
            budgets={data.budgets}
            onAddTransaction={actions.addTransaction}
            privacyMode={privacyMode} 
          />
        )}
        {currentView === View.SUBSCRIPTIONS && (
          <SubscriptionManager 
            transactions={data.transactions}
            onUpdateTransaction={actions.updateTransaction}
            onDeleteTransaction={actions.deleteTransaction}
            privacyMode={privacyMode}
          />
        )}
        {currentView === View.DEBTS && (
          <DebtManager 
            debts={data.debts || []}
            onAdd={actions.addDebt}
            onUpdate={actions.updateDebt}
            onDelete={actions.deleteDebt}
            onAddTransaction={actions.addTransaction}
            privacyMode={privacyMode}
            quickActionSignal={quickActionSignal}
          />
        )}
      </div>
    </div>
  );
};
