import React from 'react';
import { View } from '../types';
import { KanbanBoard } from './KanbanBoard';
import { Notes } from './Notes';
import { HabitTracker } from './HabitTracker';
import { WorkGoalsView } from './WorkGoalsView';
import { ShoppingList } from './ShoppingList';
import { PasswordManager } from './PasswordManager';
import { Inventory } from './Inventory';
import { Wallet, StickyNote, Target, LayoutDashboard, TrendingUp, ShoppingCart, Key, Package } from 'lucide-react';

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
  // Logic to finish shopping (Convert cart to expense and update inventory)
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

     // Process items to Inventory
     const shoppingList = data.shoppingList || [];
     const purchasedItems = shoppingList.filter((item: any) => item.isChecked);
     const itemsToProcess = purchasedItems.length > 0 ? purchasedItems : shoppingList;
     const currentInventory = data.inventoryList || [];

     for (const sItem of itemsToProcess) {
         // Find existing inventory item by name (case-insensitive)
         const existing = currentInventory.find(
             (inv: any) => inv.name.trim().toLowerCase() === sItem.name.trim().toLowerCase()
         );

         if (existing) {
             const newQty = (existing.quantity || 0) + (sItem.quantity || 1);
             await actions.updateInventoryItem(existing.id, {
                 quantity: newQty,
                 category: sItem.category || existing.category || 'Outros',
                 unit: sItem.unit || existing.unit || 'un'
             });
         } else {
             await actions.addInventoryItem({
                 name: sItem.name.trim(),
                 quantity: sItem.quantity || 1,
                 unit: sItem.unit || 'un',
                 category: sItem.category || 'Outros',
                 minQuantity: 1
             });
         }

         // Register replenishment log
         await actions.addReplenishmentLog({
             itemName: sItem.name.trim(),
             quantityAdded: sItem.quantity || 1,
             unit: sItem.unit || 'un',
             category: sItem.category || 'Outros',
             date: new Date().toISOString(),
             type: 'purchase'
         });
     }

     await actions.addTransaction(transaction);
     await actions.clearShoppingList();
     alert("Compra finalizada! Despesa registrada e itens enviados ao estoque.");
     onNavigate(View.INVENTORY);
  };

  const tabs = [
    { 
      id: View.PRODUCTIVITY, 
      label: 'Hábitos', 
      icon: Target,
      activeColor: 'text-rose-600 dark:text-rose-400'
    },
    { 
      id: View.KANBAN, 
      label: 'NEXO Flow', 
      icon: Wallet,
      activeColor: 'text-sky-600 dark:text-sky-400'
    },
    { 
      id: View.NOTES, 
      label: 'NEXO Notes', 
      icon: StickyNote,
      activeColor: 'text-amber-600 dark:text-amber-400'
    },
    { 
      id: View.WORK_GOALS, 
      label: 'Metas', 
      icon: TrendingUp,
      activeColor: 'text-emerald-600 dark:text-emerald-400'
    },
    { 
      id: View.SHOPPING_LIST, 
      label: 'Compras', 
      icon: ShoppingCart,
      activeColor: 'text-rose-600 dark:text-rose-400'
    },
    { 
      id: View.INVENTORY, 
      label: 'Estoque', 
      icon: Package,
      activeColor: 'text-indigo-600 dark:text-indigo-400'
    },
    { 
      id: View.PASSWORDS, 
      label: 'Senhas', 
      icon: Key,
      activeColor: 'text-sky-600 dark:text-sky-400'
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

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => onNavigate(View.INVENTORY)}>
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <Package className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Estoque & Reposição</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Controle de estoque, avisos de reposição e itens de consumo.</p>
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
             registeredProducts={data.registeredProducts || []}
             inventoryList={data.inventoryList || []}
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
        {currentView === View.INVENTORY && (
          <Inventory
             items={data.inventoryList || []}
             replenishmentLogs={data.replenishmentHistory || []}
             onAdd={actions.addInventoryItem}
             onUpdate={actions.updateInventoryItem}
             onDelete={actions.deleteInventoryItem}
             onAddReplenishmentLog={actions.addReplenishmentLog}
             onClearReplenishmentHistory={actions.clearReplenishmentHistory}
             onAddToShoppingList={(item) => {
                 actions.addShoppingItem({
                     name: item.name,
                     quantity: item.quantity,
                     unit: item.unit,
                     category: item.category,
                     actualPrice: 0,
                     isChecked: false,
                     observation: 'Auto-gerado para reposição de estoque'
                 });
                 alert(`"${item.name}" foi adicionado de volta à lista de compras!`);
             }}
             privacyMode={privacyMode}
          />
        )}
      </div>
    </div>
  );
};

