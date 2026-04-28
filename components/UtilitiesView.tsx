import React from 'react';
import { View } from '../types';
import { PasswordManager } from './PasswordManager';
import { ShoppingList } from './ShoppingList';
import { ShoppingCart, Key, LayoutDashboard } from 'lucide-react';

interface UtilitiesViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({ 
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
      id: View.UTILIDADES_DASHBOARD, 
      label: 'Visão Geral', 
      icon: LayoutDashboard,
      activeClass: 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200'
    },
    { 
      id: View.SHOPPING_LIST, 
      label: 'Lista de Compras', 
      icon: ShoppingCart,
      activeClass: 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/30',
      inactiveClass: 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200'
    },
    { 
      id: View.PASSWORDS, 
      label: 'Cofre de Senhas', 
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
        {currentView === View.UTILIDADES_DASHBOARD && (
          <div className="p-4 md:p-8 space-y-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Resumo Utilidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
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
