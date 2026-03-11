
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingItem, ShoppingCategory } from '../types';
import { Plus, Trash2, ShoppingCart, Check, CreditCard, ArrowRight, Calculator, Minus, X, Sparkles, ChefHat, Tag, AlertTriangle, List } from 'lucide-react';
import { generateShoppingListFromRecipe } from '../services/geminiService';

interface ShoppingListProps {
  items: ShoppingItem[];
  onAdd: (item: Omit<ShoppingItem, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
  onDelete: (id: string) => void;
  onClearList: () => void;
  onFinishShopping: (total: number, paymentMethod: string, category: string) => void;
  
  // Novos Props
  shoppingBudget?: number;
  onUpdateBudget: (amount: number) => void;
  hasApiKey?: boolean;
  
  privacyMode: boolean;
  quickActionSignal?: number;
}

const SHOPPING_CATEGORIES: ShoppingCategory[] = [
    'Hortifruti', 'Carnes', 'Laticínios', 'Mercearia', 'Padaria', 'Bebidas', 'Limpeza', 'Higiene', 'Outros'
];

export const ShoppingList: React.FC<ShoppingListProps> = ({ 
  items, onAdd, onUpdate, onDelete, onClearList, onFinishShopping, 
  shoppingBudget = 0, onUpdateBudget, hasApiKey = false,
  privacyMode, quickActionSignal 
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ShoppingCategory>('Outros');
  
  const [isFinishing, setIsFinishing] = useState(false);
  
  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Budget Edit Mode
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(shoppingBudget.toString());

  // Checkout State
  const [checkoutCategory, setCheckoutCategory] = useState('Alimentos');
  const [checkoutMethod, setCheckoutMethod] = useState('debit_card');

  // Calculated Total
  const total = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.actualPrice * item.quantity), 0);
  }, [items]);

  // Grouped Items
  const groupedItems = useMemo(() => {
      const groups: Record<string, ShoppingItem[]> = {};
      SHOPPING_CATEGORIES.forEach(cat => groups[cat] = []);
      
      items.forEach(item => {
          const cat = item.category || 'Outros';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(item);
      });
      return groups;
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
      isChecked: false,
      category: newItemCategory
    });
    setNewItemName('');
    setNewItemCategory('Outros'); // Reset to default
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiPrompt.trim()) return;

      setLoadingAi(true);
      const generatedItems = await generateShoppingListFromRecipe(aiPrompt);
      
      generatedItems.forEach(item => {
          onAdd({
              ...item,
              actualPrice: 0,
              isChecked: false
          });
      });

      setLoadingAi(false);
      setIsAiModalOpen(false);
      setAiPrompt('');
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
    // Budget reset? Maybe optional. For now, we keep it.
    setIsFinishing(false);
  };

  const handleSaveBudget = () => {
      const val = parseFloat(tempBudget);
      if (!isNaN(val)) {
          onUpdateBudget(val);
      }
      setIsEditingBudget(false);
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const budgetPercentage = shoppingBudget > 0 ? (total / shoppingBudget) * 100 : 0;
  let budgetColor = 'bg-emerald-500';
  if (budgetPercentage > 100) budgetColor = 'bg-rose-500';
  else if (budgetPercentage > 85) budgetColor = 'bg-amber-500';

  return (
    <div className="space-y-6 animate-fade-in relative pb-32 md:pb-0">
      
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

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-purple-200 dark:border-purple-800 animate-scale-in">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" /> Assistente de Compras
                  </h3>
                  <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
               </div>
               
               <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  O que vamos comprar? Digite uma receita (ex: "Strogonoff para 4") ou um evento (ex: "Churrasco fim de semana") e eu gero a lista.
               </p>

               <form onSubmit={handleAiGenerate}>
                   <input 
                      autoFocus
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ex: Ingredientes para bolo de cenoura..."
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                   />
                   <button 
                      type="submit"
                      disabled={loadingAi || !aiPrompt}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                      {loadingAi ? <span className="animate-spin">⏳</span> : <ChefHat className="w-5 h-5" />}
                      Gerar Lista
                   </button>
               </form>
           </div>
        </div>
      )}

      {/* HEADER & BUDGET BAR */}
      <div>
        <div className="flex justify-between items-center mb-4">
             <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="w-7 h-7 text-indigo-600" />
                    Lista de Compras
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Organize sua ida ao mercado.</p>
             </div>
             <button 
                onClick={() => setIsAiModalOpen(true)}
                disabled={!hasApiKey}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-sm ${!hasApiKey ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300'}`}
             >
                <Sparkles className="w-4 h-4" /> Gerar com IA
             </button>
        </div>
        
        {/* Budget Control Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex justify-between items-end mb-2">
                 <div>
                     <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Total Calculado</p>
                     <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatValue(total)}</p>
                 </div>
                 
                 <div className="text-right">
                     <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 flex items-center justify-end gap-1 cursor-pointer hover:text-indigo-500" onClick={() => { setIsEditingBudget(true); setTempBudget(shoppingBudget.toString()); }}>
                        Teto de Gastos (Viagem) <Tag className="w-3 h-3" />
                     </p>
                     
                     {isEditingBudget ? (
                         <div className="flex items-center gap-2 justify-end">
                             <span className="text-sm font-bold text-slate-500">R$</span>
                             <input 
                                autoFocus
                                type="number" 
                                className="w-24 p-1 text-right font-bold border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={tempBudget}
                                onChange={(e) => setTempBudget(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                                onBlur={handleSaveBudget}
                             />
                         </div>
                     ) : (
                         <p className="text-xl font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-indigo-500" onClick={() => { setIsEditingBudget(true); setTempBudget(shoppingBudget.toString()); }}>
                             {shoppingBudget > 0 ? formatValue(shoppingBudget) : 'Definir Teto'}
                         </p>
                     )}
                 </div>
             </div>

             {shoppingBudget > 0 && (
                 <div className="relative w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                     <div 
                        className={`h-full transition-all duration-500 ${budgetColor}`} 
                        style={{ width: `${Math.min(100, budgetPercentage)}%` }}
                     ></div>
                     {budgetPercentage > 100 && (
                         <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-[9px] font-bold text-white drop-shadow-md animate-pulse flex items-center gap-1">
                                 <AlertTriangle className="w-3 h-3" /> ACIMA DO ORÇAMENTO
                             </span>
                         </div>
                     )}
                 </div>
             )}
        </div>
      </div>

      {/* ADD ITEM INPUT */}
      <form onSubmit={handleAddItem} className="flex gap-2">
         <div className="relative flex-1 flex gap-2">
            <input 
               id="new-item-input"
               type="text"
               value={newItemName}
               onChange={(e) => setNewItemName(e.target.value)}
               placeholder="Adicionar item..."
               className="flex-1 p-3 pl-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
               autoComplete="off"
            />
            <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as ShoppingCategory)}
                className="hidden md:block w-32 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm"
            >
                {SHOPPING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         </div>
         <button 
            type="submit" 
            disabled={!newItemName.trim()}
            className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
         >
            <Plus className="w-6 h-6" />
         </button>
      </form>
      
      {/* Mobile Category Select fallback if user types on mobile */}
      <div className="md:hidden overflow-x-auto pb-2 -mt-4">
          <div className="flex gap-2 px-1">
              {SHOPPING_CATEGORIES.map(cat => (
                  <button
                      key={cat}
                      type="button"
                      onClick={() => setNewItemCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${
                          newItemCategory === cat 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                      {cat}
                  </button>
              ))}
          </div>
      </div>

      {/* LIST (GROUPED BY CATEGORY) */}
      <div className="space-y-6">
         {items.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
               <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
               <p>Sua lista está vazia.</p>
               {hasApiKey && <p className="text-sm mt-2 text-purple-500 cursor-pointer hover:underline" onClick={() => setIsAiModalOpen(true)}>Experimente usar a IA para criar uma lista!</p>}
            </div>
         ) : (
            SHOPPING_CATEGORIES.map(category => {
                const categoryItems = groupedItems[category];
                if (!categoryItems || categoryItems.length === 0) return null;

                return (
                    <div key={category} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <List className="w-3 h-3" /> {category}
                            </h3>
                            <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                                {categoryItems.length}
                            </span>
                        </div>
                        
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                           {categoryItems.map(item => (
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
                    </div>
                );
            })
         )}
      </div>

      {/* FLOAT ACTION BUTTON FOR MOBILE FINISH */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:hidden z-30 flex gap-2 w-[90%] max-w-sm">
           <button 
             onClick={() => setIsAiModalOpen(true)}
             disabled={!hasApiKey}
             className="bg-white dark:bg-slate-800 text-purple-600 p-4 rounded-full shadow-lg border border-purple-100 dark:border-purple-900 disabled:opacity-50"
           >
              <Sparkles className="w-6 h-6" />
           </button>
           <button 
             onClick={() => setIsFinishing(true)}
             disabled={items.length === 0}
             className="flex-1 bg-slate-900 text-white rounded-full shadow-xl font-bold flex items-center justify-between px-6 hover:scale-105 transition-transform disabled:opacity-70 disabled:scale-100"
           >
              <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">Total</span>
                  <span className="text-lg">{formatValue(total)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-lg">
                  Finalizar <ArrowRight className="w-4 h-4" />
              </div>
           </button>
      </div>

    </div>
  );
};