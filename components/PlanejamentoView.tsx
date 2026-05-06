import React from 'react';
import { View } from '../types';
import { KanbanBoard } from './KanbanBoard';
import { Notes } from './Notes';
import { HabitTracker } from './HabitTracker';
import { WorkGoalsView } from './WorkGoalsView';
import { ShoppingList } from './ShoppingList';
import { PasswordManager } from './PasswordManager';
import { Wallet, StickyNote, Target, LayoutDashboard, TrendingUp, ShoppingCart, Key } from 'lucide-react';

interface PlanejamentoViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const PlanejamentoView: React.FC<PlanejamentoViewProps> = ({ 
  currentView, onNavigate, data, actions, privacyMode, hasApiKey, quickActionSignal 
}) => {
  // Logic to finish shopping (Convert cart to expense)
  const finishShopping = async (total: number, paymentMethod: string, category: string) => {
     const transaction = {
         description: `Compra de Mercado (${new Date().toLocaleDateString()})`,
         amount: total,
         type: 'expense',
         category: category,
         date: new Date().toISOString().split('T')[0],
         status: 'paid',
         paymentMethod: paymentMethod,
         isRecurring: false
     };
     await actions.addTransaction(transaction);
     await actions.clearShoppingList();
     alert("Compra finalizada! Despesa registrada com sucesso.");
     onNavigate(View.TRANSACTIONS);
  };

  const tabs = [
    { 
      id: View.PLANEJAMENTO_DASHBOARD, 
      label: 'Visão Geral', 
      icon: LayoutDashboard,
      activeClass: 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200'
    },
    { 
      id: View.PRODUCTIVITY, 
      label: 'Hábitos', 
      icon: Target,
      activeClass: 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200'
    },
    { 
      id: View.KANBAN, 
      label: 'NEXO Flow', 
      icon: Wallet,
      activeClass: 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/30 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-200'
    },
    { 
      id: View.NOTES, 
      label: 'NEXO Notes', 
      icon: StickyNote,
      activeClass: 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-200'
    },
    { 
      id: View.WORK_GOALS, 
      label: 'Metas', 
      icon: TrendingUp,
      activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200'
    },
    { 
      id: View.SHOPPING_LIST, 
      label: 'Compras', 
      icon: ShoppingCart,
      activeClass: 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200'
    },
    { 
      id: View.PASSWORDS, 
      label: 'Senhas', 
      icon: Key,
      activeClass: 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/30 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-200'
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
        {currentView === View.PLANEJAMENTO_DASHBOARD && (
          <div className="p-4 md:p-8 space-y-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Resumo Planejamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-rose-300 transition-colors" onClick={() => onNavigate(View.PRODUCTIVITY)}>
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <Target className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Hábitos</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Registre e acompanhe a evolução dos seus hábitos diários.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-sky-300 transition-colors" onClick={() => onNavigate(View.KANBAN)}>
                <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
                  <Wallet className="w-8 h-8" />
                  <h3 className="text-lg font-bold">NEXO Flow</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Gestão de tarefas e ideias usando quadros no estilo Kanban.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-amber-300 transition-colors" onClick={() => onNavigate(View.NOTES)}>
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                  <StickyNote className="w-8 h-8" />
                  <h3 className="text-lg font-bold">NEXO Notes</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Crie e organize suas anotações com facilidade.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => onNavigate(View.WORK_GOALS)}>
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Metas de Trabalho</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Registre trabalhos e acompanhe suas metas de horas.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-rose-300 transition-colors" onClick={() => onNavigate(View.SHOPPING_LIST)}>
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <ShoppingCart className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Lista de Compras</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Organize suas idas ao mercado focando nas categorias.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-sky-300 transition-colors" onClick={() => onNavigate(View.PASSWORDS)}>
                <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
                  <Key className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Cofre de Senhas</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Suas senhas seguras dentro da sua conta pessoal.</p>
              </div>

            </div>
          </div>
        )}
        {currentView === View.WORK_GOALS && (
          <WorkGoalsView 
             goals={data.workGoals || []}
             onAddGoal={actions.addWorkGoal}
             onUpdateGoal={actions.updateWorkGoal}
             onDeleteGoal={actions.deleteWorkGoal}
          />
        )}
        {currentView === View.PRODUCTIVITY && (
          <HabitTracker 
             habits={data.habits || []}
             onAdd={actions.addHabit}
             onUpdate={actions.updateHabit}
             onDelete={actions.deleteHabit}
             onToggleEntry={actions.toggleHabitEntry}
             privacyMode={privacyMode}
          />
        )}
        {currentView === View.KANBAN && (
          <KanbanBoard 
             boards={data.kanbanBoards || []}
             onSaveBoard={actions.saveKanbanBoard}
             onDeleteBoard={actions.deleteKanbanBoard}
             onAddTransaction={(t) => {
                 actions.addTransaction(t);
                 alert('Transação criada a partir do card!');
                 onNavigate(View.TRANSACTIONS);
             }}
             privacyMode={privacyMode}
          />
        )}
        {currentView === View.NOTES && (
          <Notes 
             notes={data.notes || []}
             onAdd={actions.addNote}
             onUpdate={actions.updateNote}
             onDelete={actions.deleteNote}
             privacyMode={privacyMode}
          />
        )}
        {currentView === View.SHOPPING_LIST && (
          <ShoppingList 
             items={data.shoppingList || []}
             onAdd={actions.addShoppingItem}
             onUpdate={actions.updateShoppingItem}
             onDelete={actions.deleteShoppingItem}
             onClearList={actions.clearShoppingList}
             onFinishShopping={finishShopping}
             shoppingBudget={data.shoppingBudget}
             onUpdateBudget={actions.setShoppingBudget}
             hasApiKey={hasApiKey}
             privacyMode={privacyMode}
             quickActionSignal={quickActionSignal}
          />
        )}
        {currentView === View.PASSWORDS && (
          <PasswordManager
             passwords={data.passwords || []}
             onAdd={actions.addPassword}
             onUpdate={actions.updatePassword}
             onDelete={actions.deletePassword}
             privacyMode={privacyMode}
          />
        )}
      </div>
    </div>
  );
};

