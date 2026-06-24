import React from 'react';
import { View } from '../types';
import { TransactionList } from './TransactionList';
import { SubscriptionManager } from './SubscriptionManager';
import { DebtManager } from './DebtManager';
import { InvestmentList } from './InvestmentList';
import { BudgetList } from './BudgetList';
import { RetirementMachine } from './RetirementMachine';
import { PixKeyManager } from './PixKeyManager';
import { Receipt, Repeat, ShieldAlert, LineChart, Target, Landmark, Key, LayoutDashboard } from 'lucide-react';

interface FinanceiroViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({ 
  currentView, onNavigate, data, actions, privacyMode, hasApiKey, quickActionSignal 
}) => {
  
  const tabs = [
    { 
      id: View.TRANSACTIONS, 
      label: 'Transações', 
      icon: Receipt,
      activeColor: 'text-indigo-600 dark:text-indigo-400'
    },
    { 
      id: View.SUBSCRIPTIONS, 
      label: 'Assinaturas', 
      icon: Repeat,
      activeColor: 'text-purple-600 dark:text-purple-400'
    },
    { 
      id: View.DEBTS, 
      label: 'Dívidas', 
      icon: ShieldAlert,
      activeColor: 'text-rose-600 dark:text-rose-400'
    },
    { 
      id: View.INVESTMENTS, 
      label: 'Investimentos', 
      icon: LineChart,
      activeColor: 'text-emerald-600 dark:text-emerald-400'
    },
    { 
      id: View.BUDGETS, 
      label: 'Orçamentos', 
      icon: Target,
      activeColor: 'text-sky-600 dark:text-sky-400'
    },
    { 
      id: View.WEALTH_PLANNER, 
      label: 'Aposentadoria', 
      icon: Landmark,
      activeColor: 'text-amber-600 dark:text-amber-400'
    },
    { 
      id: View.PIX_KEYS, 
      label: 'Pix', 
      icon: Key,
      activeColor: 'text-teal-600 dark:text-teal-400'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation - Integrated Segmented Control */}
      <div className="w-full overflow-x-auto scrollbar-hide pb-2 md:pb-0">
        <div className="flex items-stretch justify-center w-max min-w-full p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl mx-auto border border-slate-200/50 dark:border-slate-700/50">
          {tabs.map(tab => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  flex-1 shrink-0 relative flex flex-row items-center justify-center gap-1.5 md:gap-2 py-2 md:py-2.5 px-3 md:px-2 rounded-xl font-bold transition-all duration-300
                  ${isActive 
                    ? `bg-white dark:bg-slate-700 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600 ${tab.activeColor}` 
                    : `text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50`}
                `}
              >
                <tab.icon className={`w-4 h-4 md:w-4 md:h-4 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs md:text-sm whitespace-nowrap truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
        {currentView === View.FINANCEIRO_DASHBOARD && (
          <div className="p-4 md:p-8 space-y-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Resumo Financeiro</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => onNavigate(View.TRANSACTIONS)}>
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <Receipt className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Transações</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie suas receitas, despesas e gastos.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => onNavigate(View.INVESTMENTS)}>
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <LineChart className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Investimentos</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Acompanhe seus rendimentos e aportes.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-rose-300 transition-colors" onClick={() => onNavigate(View.DEBTS)}>
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Dívidas</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Controle parcelamentos, empréstimos e cartões.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-sky-300 transition-colors" onClick={() => onNavigate(View.BUDGETS)}>
                <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
                  <Target className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Orçamentos</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Defina limites e metas de gastos mensais.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-amber-300 transition-colors" onClick={() => onNavigate(View.WEALTH_PLANNER)}>
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                  <Landmark className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Máquina de Aposentadoria</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Calcule quanto precisa para pagar seus custos fixos com investimentos.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-purple-300 transition-colors" onClick={() => onNavigate(View.SUBSCRIPTIONS)}>
                <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                  <Repeat className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Assinaturas</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Controle serviços mensais e assinaturas ativas.</p>
              </div>
              
            </div>
          </div>
        )}
        {currentView === View.TRANSACTIONS && (
          <TransactionList 
            transactions={data.transactions}
            categories={data.categories}
            budgets={data.budgets}
            wallets={data.wallets}
            onAdd={actions.addTransaction}
            onUpdate={actions.updateTransaction}
            onDelete={actions.deleteTransaction}
            onToggleStatus={actions.toggleTransactionStatus}
            onAddWallet={actions.addWallet}
            onUpdateWallet={actions.updateWallet}
            onDeleteWallet={actions.deleteWallet}
            onNavigate={onNavigate}
            privacyMode={privacyMode}
            hasApiKey={hasApiKey}
            quickActionSignal={quickActionSignal}
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
            scoreSerasa={data.scoreSerasa}
            scoreSerasaUpdatedAt={data.scoreSerasaUpdatedAt}
            scoreSerasaHistory={data.scoreSerasaHistory}
            onUpdateScoreSerasa={(score) => actions.updateScoreSerasa(score, new Date().toISOString())}
          />
        )}
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
          <RetirementMachine 
             data={data}
             actions={actions}
             onSaveProfile={actions.saveWealthProfile}
             onNavigateToInvestments={() => onNavigate(View.INVESTMENTS)}
             privacyMode={privacyMode}
             hasApiKey={hasApiKey}
          />
        )}
        {currentView === View.PIX_KEYS && (
          <PixKeyManager
            pixKeys={data.pixKeys || []}
            onAdd={actions.addPixKey}
            onDelete={actions.deletePixKey}
          />
        )}
      </div>
    </div>
  );
};
