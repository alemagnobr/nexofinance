import React from 'react';
import { View } from '../types';
import { TransactionList } from './TransactionList';
import { SubscriptionManager } from './SubscriptionManager';
import { DebtManager } from './DebtManager';
import { InvestmentList } from './InvestmentList';
import { BudgetList } from './BudgetList';
import { WealthPlanner } from './WealthPlanner';
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
      id: View.FINANCEIRO_DASHBOARD, 
      label: 'Visão Geral', 
      icon: LayoutDashboard,
      activeClass: 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200'
    },
    { 
      id: View.TRANSACTIONS, 
      label: 'Transações', 
      icon: Receipt,
      activeClass: 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200'
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
    { 
      id: View.INVESTMENTS, 
      label: 'Investimentos', 
      icon: LineChart,
      activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200'
    },
    { 
      id: View.BUDGETS, 
      label: 'Orçamentos', 
      icon: Target,
      activeClass: 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/30 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-200'
    },
    { 
      id: View.WEALTH_PLANNER, 
      label: 'Patrimônio', 
      icon: Landmark,
      activeClass: 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-200'
    },
    { 
      id: View.PIX_KEYS, 
      label: 'Pix', 
      icon: Key,
      activeClass: 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-200'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation - Horizontal Scroll on Mobile */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-hide snap-x">
        <div className="flex items-center gap-2 md:gap-3 min-w-max px-2 md:px-0">
          {tabs.map(tab => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  snap-start shrink-0 relative flex flex-row items-center justify-center gap-2 py-2 px-3 md:py-3 md:px-4 rounded-xl font-bold transition-all duration-200 border-2
                  ${isActive ? `${tab.activeClass} scale-[1.02]` : `${tab.inactiveClass}`}
                `}
              >
                <tab.icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-white' : 'currentColor'}`} />
                <span className="text-xs md:text-sm whitespace-nowrap">{tab.label}</span>
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
                  <h3 className="text-lg font-bold">Patrimônio</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Consolide seus bens e analise seu patrimônio líquido.</p>
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
          <WealthPlanner 
             data={data}
             onSaveProfile={actions.saveWealthProfile}
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
