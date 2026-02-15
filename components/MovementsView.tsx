
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
    { 
      id: View.TRANSACTIONS, 
      label: 'Transações', 
      icon: Receipt,
      activeClass: 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200'
    },
    { 
      id: View.CALENDAR, 
      label: 'Agenda', 
      icon: Calendar,
      activeClass: 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200'
    },
    { 
      id: View.SUBSCRIPTIONS, 
      label: 'Assinaturas', 
      icon: Repeat,
      activeClass: 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200'
    },
    { 
      id: View.DEBTS, 
      label: 'Dívidas', 
      icon: ShieldAlert,
      activeClass: 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation - Enhanced Design */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tabs.map(tab => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  relative flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-200 border-2
                  ${isActive ? `${tab.activeClass} scale-[1.02]` : `${tab.inactiveClass}`}
                `}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'currentColor'}`} />
                <span className="text-sm">{tab.label}</span>
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
