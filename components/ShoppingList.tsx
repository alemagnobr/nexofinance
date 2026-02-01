
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingItem, Transaction } from '../types';
import { Plus, Trash2, ShoppingCart, Check, CreditCard, DollarSign, Calculator, Minus, PlusCircle, X } from 'lucide-react';

interface ShoppingListProps {
  items: ShoppingItem[];
  onAdd: (item: Omit<ShoppingItem, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
  onDelete: (id: string) => void;
  onClearList: () => void;
  onFinishShopping: (total: number, paymentMethod: string, category: string) => void;
  privacyMode: boolean;
  quickActionSignal?: number;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ 
  items, onAdd, onUpdate, onDelete, onClearList, onFinishShopping, privacyMode, quickActionSignal 
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Checkout State
  const [checkoutCategory, setCheckoutCategory] = useState('Alimentos');
  const [checkoutMethod, setCheckoutMethod] = useState('debit_card');

  // Calculated Total
  const total = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.actualPrice * item.quantity), 0);
  }, [items]);

  // Effect for Quick Action
  useEffect(() => {
    if (quickActionSignal) {
      const input = document.getElementById('new-item-input');
      if (input) input.focus();
    }
  }, [quickActionSignal]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    onAdd({
      name: newItemName.trim(),
      quantity: 1,
      actualPrice: 0,
      isChecked: false
    });
    setNewItemName('');
  };

  const handleQuantity = (id: string, current: number, delta: number) => {
    const newQty = Math.max(1, current + delta);
    onUpdate(id, { quantity: newQty });
  };

  const handleFinish = () => {
    if (total === 0) {
      alert("O valor total está zerado. Adicione preços aos itens para lançar a despesa.");
      return;
    }
    onFinishShopping(total, checkoutMethod, checkoutCategory);
    setIsFinishing(false);
  };

  const formatValue = (val: number) => {
    // Na lista de compras, talvez a privacidade não seja tão crítica, mas mantemos por consistência
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-24 md:pb-0">
      
      {/* Checkout Modal */}
      {isFinishing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 border border-emerald-500/30 animate-scale-in">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <CreditCard className="w-6 h-6 text-emerald-500" /> Finalizar Compra
                </h3>
                <button onClick={() => setIsFinishing(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl mb-6 text-center border border-emerald-100 dark:border-emerald-800">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">Valor Final a Lançar</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{formatValue(total)}</p>
             </div>

             <div className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Categoria da Despesa</label>
                   <select 
                      value={checkoutCategory}
                      onChange={(e) => setCheckoutCategory(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none"
                   >
                      <option value="Alimentos">Alimentos</option>
                      <option value="Casa">Casa</option>
                      <option value="Lazer">Lazer</option>
                      <option value="Pets">Pets</option>
                      <option value="Outros">Outros</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Forma de Pagamento</label>
                   <select 
                      value={checkoutMethod}
                      onChange={(e) => setCheckoutMethod(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none"
                   >
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="debit_card">Cartão de Débito</option>
                      <option value="cash">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="ticket">Vale Alimentação/Refeição</option>
                   </select>
                </div>
                
                <button 
                  onClick={handleFinish}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 mt-4"
                >
                   <Check className="w-5 h-5" /> Confirmar e Lançar
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Header & Total Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-indigo-600" />
            Lista & Calculadora
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Marque os itens e preencha o preço para controlar o gasto no mercado.
          </p>
        </div>
      </div>

      {/* BIG TOTAL CALCULATOR DISPLAY */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 sticky top-2 z-10 md:static">
          <div className="flex items-center gap-3">
             <div className="bg-white/10 p-3 rounded-full">
                <Calculator className="w-8 h-8 text-emerald-400" />
             </div>
             <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Subtotal do Carrinho</p>
                <h3 className="text-4xl font-bold text-white tracking-tight">{formatValue(total)}</h3>
             </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
             <button 
                onClick={() => {
                   if(confirm('Tem certeza que deseja limpar toda a lista?')) onClearList();
                }}
                className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors text-sm font-medium"
             >
                Limpar Lista
             </button>
             <button 
                onClick={() => setIsFinishing(true)}
                disabled={items.length === 0}
                className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                Finalizar <ArrowRightIcon className="w-4 h-4" />
             </button>
          </div>
      </div>

      {/* ADD ITEM INPUT */}
      <form onSubmit={handleAddItem} className="flex gap-2">
         <div className="relative flex-1">
            <input 
               id="new-item-input"
               type="text"
               value={newItemName}
               onChange={(e) => setNewItemName(e.target.value)}
               placeholder="Adicionar item (ex: Leite, Arroz...)"
               className="w-full p-4 pl-5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
               autoComplete="off"
            />
         </div>
         <button 
            type="submit" 
            disabled={!newItemName.trim()}
            className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
         >
            <Plus className="w-6 h-6" />
         </button>
      </form>

      {/* LIST */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
         {items.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
               <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
               <p>Sua lista está vazia.</p>
               <p className="text-sm">Adicione itens antes de ir ao mercado.</p>
            </div>
         ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
               {items.map(item => (
                  <div key={item.id} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${item.isChecked ? 'bg-slate-50/50 dark:bg-slate-700/30' : ''}`}>
                     
                     {/* Check & Name */}
                     <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button 
                           onClick={() => onUpdate(item.id, { isChecked: !item.isChecked })}
                           className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                              item.isChecked 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-slate-300 dark:border-slate-500 text-transparent hover:border-emerald-400'
                           }`}
                        >
                           <Check className="w-4 h-4" />
                        </button>
                        <span className={`font-medium text-lg truncate ${item.isChecked ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                           {item.name}
                        </span>
                     </div>

                     {/* Controls (Qty & Price) */}
                     <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        
                        {/* Quantity */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                           <button onClick={() => handleQuantity(item.id, item.quantity, -1)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Minus className="w-4 h-4" /></button>
                           <span className="w-8 text-center font-bold text-slate-700 dark:text-white text-sm">{item.quantity}</span>
                           <button onClick={() => handleQuantity(item.id, item.quantity, 1)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Plus className="w-4 h-4" /></button>
                        </div>

                        {/* Price Input (Calculator Mode) */}
                        <div className="relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                           <input 
                              type="number" 
                              step="0.01"
                              placeholder="0,00"
                              value={item.actualPrice === 0 ? '' : item.actualPrice}
                              onChange={(e) => onUpdate(item.id, { actualPrice: parseFloat(e.target.value) || 0 })}
                              className={`w-24 pl-8 pr-2 py-2 rounded-lg border outline-none font-bold text-right transition-colors ${
                                 item.actualPrice > 0 
                                 ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                                 : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-indigo-500'
                              }`}
                           />
                        </div>

                        {/* Delete */}
                        <button 
                           onClick={() => onDelete(item.id)}
                           className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
};

// Icon Helper
const ArrowRightIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);
