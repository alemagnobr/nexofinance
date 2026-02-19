
import React from 'react';
import { View } from '../types';
import { KanbanBoard } from './KanbanBoard';
import { Notes } from './Notes';
import { ShoppingList } from './ShoppingList';
import { Wallet, StickyNote, ShoppingCart } from 'lucide-react';

interface OrganizationViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const OrganizationView: React.FC<OrganizationViewProps> = ({ 
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
    { id: View.KANBAN, label: 'NEXO Flow', icon: Wallet },
    { id: View.NOTES, label: 'NEXO Notes', icon: StickyNote },
    { id: View.SHOPPING_LIST, label: 'Lista de Compras', icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation - Enhanced Design */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Ferramentas de Organização</p>
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
                    ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02]' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-700'
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
      </div>
    </div>
  );
};
