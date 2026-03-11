import React from 'react';
import { View } from '../types';
import { PasswordManager } from './PasswordManager';
import { ShoppingList } from './ShoppingList';
import { ShoppingCart, Key } from 'lucide-react';

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
    { id: View.SHOPPING_LIST, label: 'Lista de Compras', icon: ShoppingCart },
    { id: View.PASSWORDS, label: 'Cofre de Senhas', icon: Key },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Utilidades</p>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
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
