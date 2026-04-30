
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingItem, ShoppingCategory } from '../types';
import { Plus, Trash2, ShoppingCart, Check, CreditCard, ArrowRight, Calculator, Minus, X, Sparkles, ChefHat, Tag, AlertTriangle, List, Edit2, ChevronLeft, ChevronRight, Calendar, History, Copy } from 'lucide-react';
import { generateShoppingListFromRecipe } from '../services/geminiService';
import { CurrencyInput } from './CurrencyInput';

interface ShoppingListProps {
  items: ShoppingItem[];
  onAdd: (item: Omit<ShoppingItem, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
  onDelete: (id: string) => void;
  onClearList: (month?: string) => void;
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
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemRefPrice, setNewItemRefPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('un');
  const [newItemDate, setNewItemDate] = useState(new Date().toISOString().split('T')[0]);
  const [repeatDates, setRepeatDates] = useState<string[]>([]);
  const [newItemObservation, setNewItemObservation] = useState('');
  
  const [activeTab, setActiveTab] = useState<'list' | 'timeline'>('list');
  
  // Edit Item Modal
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  
  // Add Item Modal
  const [isAddingItem, setIsAddingItem] = useState(false);
  
  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Month Navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStr = useMemo(() => currentDate.toISOString().slice(0, 7), [currentDate]);

  // Budget Edit Mode
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(shoppingBudget.toString());

  // Filtered Items by Month
  const filteredItems = useMemo(() => {
    return items.filter(item => item.month === monthStr);
  }, [items, monthStr]);

  // Calculated Total
  const forecastTotal = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
        const itemPrice = item.isChecked ? item.actualPrice : (item.referencePrice || item.actualPrice || 0);
        return acc + (itemPrice * item.quantity);
    }, 0);
  }, [filteredItems]);

  const spentTotal = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
        return acc + (item.isChecked ? (item.actualPrice * item.quantity) : 0);
    }, 0);
  }, [filteredItems]);

  // Grouped Items
  const groupedItems = useMemo(() => {
      const groups: Record<string, ShoppingItem[]> = {};
      SHOPPING_CATEGORIES.forEach(cat => groups[cat] = []);
      
      filteredItems.forEach(item => {
          const cat = item.category || 'Outros';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(item);
      });
      return groups;
  }, [filteredItems]);

  // Timeline Data
  const timelineData = useMemo(() => {
    const dates: Record<string, { total: number; items: ShoppingItem[] }> = {};
    filteredItems.forEach(item => {
        if (item.purchaseDate) {
            if (!dates[item.purchaseDate]) {
                dates[item.purchaseDate] = { total: 0, items: [] };
            }
            dates[item.purchaseDate].total += (item.actualPrice * item.quantity);
            dates[item.purchaseDate].items.push(item);
        }
    });
    return Object.entries(dates)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => {
            const [y, m, d] = date.split('-');
            return {
                fullDate: date,
                formatted: `${d}/${m}/${y}`,
                total: data.total,
                items: data.items
            };
        });
  }, [filteredItems]);

  const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  // Effect for Quick Action
  useEffect(() => {
    if (quickActionSignal) {
      const input = document.getElementById('new-item-input');
      if (input) input.focus();
    }
  }, [quickActionSignal]);

  const handleSelectAll = () => {
    const allChecked = filteredItems.length > 0 && filteredItems.every(item => item.isChecked);
    filteredItems.forEach(item => {
      if (item.isChecked === allChecked) {
        onUpdate(item.id, { isChecked: !allChecked });
      }
    });
  };

  const handleRepeatNextMonth = () => {
    if (window.confirm('Copiar os itens deste mês para o mês seguinte? O valor real atual será salvo como preço de referência no próximo.')) {
        const [year, month] = monthStr.split('-');
        const nextDate = new Date(parseInt(year), parseInt(month), 1);
        const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
        
        filteredItems.forEach(item => {
            onAdd({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                actualPrice: 0,
                referencePrice: item.actualPrice > 0 ? item.actualPrice : item.referencePrice,
                isChecked: false,
                category: item.category,
                observation: item.observation,
                month: nextMonthStr
            });
        });
    }
  };

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return 0;
    return parseFloat(numericValue) / 100;
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    const dates = [newItemDate, ...repeatDates];
    
    dates.forEach(date => {
      onAdd({
        name: newItemName.trim(),
        quantity: newItemQuantity,
        unit: newItemUnit,
        actualPrice: parseCurrencyInput(newItemPrice),
        referencePrice: parseCurrencyInput(newItemRefPrice),
        isChecked: false,
        category: newItemCategory,
        observation: newItemObservation.trim() || undefined,
        month: date.slice(0, 7),
        purchaseDate: date
      });
    });

    setNewItemName('');
    setNewItemCategory('Outros'); // Reset to default
    setNewItemPrice('');
    setNewItemRefPrice('');
    setNewItemQuantity(1);
    setNewItemUnit('un');
    setRepeatDates([]);
    setNewItemObservation('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingItem || !editingItem.name.trim()) return;
      onUpdate(editingItem.id, {
          name: editingItem.name.trim(),
          category: editingItem.category,
          unit: editingItem.unit,
          actualPrice: editingItem.actualPrice,
          referencePrice: editingItem.referencePrice,
          observation: editingItem.observation,
          purchaseDate: editingItem.purchaseDate,
          month: editingItem.purchaseDate?.slice(0, 7)
      });
      setEditingItem(null);
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
    const newQty = Math.max(0.01, current + delta);
    onUpdate(id, { quantity: newQty });
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

  const budgetPercentage = shoppingBudget > 0 ? (forecastTotal / shoppingBudget) * 100 : 0;
  let budgetColor = 'bg-emerald-500';
  if (budgetPercentage > 100) budgetColor = 'bg-rose-500';
  else if (budgetPercentage > 85) budgetColor = 'bg-amber-500';

  return (
    <div className="space-y-6 animate-fade-in relative pb-32 md:pb-0">
      
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

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-scale-in">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Edit2 className="w-5 h-5 text-indigo-600" /> Editar Item
                  </h3>
                  <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
               </div>
               
               <form onSubmit={handleSaveEdit} className="space-y-4">
                   <div className="grid grid-cols-[1fr_100px] gap-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome do Item</label>
                           <input 
                              autoFocus
                              type="text"
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Unid.</label>
                           <select
                               value={editingItem.unit || 'un'}
                               onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                               className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                           >
                               <option value="un">UN</option>
                               <option value="kg">KG</option>
                               <option value="g">g</option>
                               <option value="L">L</option>
                               <option value="ml">ml</option>
                               <option value="cx">CX</option>
                               <option value="pct">PCT</option>
                               <option value="pc">PÇ</option>
                               <option value="bdj">BDJ</option>
                           </select>
                       </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                           <select 
                              value={editingItem.category}
                              onChange={(e) => setEditingItem({...editingItem, category: e.target.value as ShoppingCategory})}
                              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                           >
                              {SHOPPING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Data da Compra</label>
                           <input 
                              type="date"
                              value={editingItem.purchaseDate || ''}
                              onChange={(e) => setEditingItem({...editingItem, purchaseDate: e.target.value})}
                              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                       </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Preço Ref.</label>
                           <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                               <CurrencyInput 
                                  placeholder="0,00"
                                  value={!editingItem.referencePrice ? '' : editingItem.referencePrice.toString()}
                                  onChangeValue={(val) => setEditingItem({...editingItem, referencePrice: parseFloat(val) || 0})}
                                  className="w-full pl-8 pr-3 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-right font-bold text-sm"
                               />
                           </div>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Preço Real</label>
                           <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                               <CurrencyInput 
                                  placeholder="0,00"
                                  value={editingItem.actualPrice === 0 ? '' : editingItem.actualPrice.toString()}
                                  onChangeValue={(val) => setEditingItem({...editingItem, actualPrice: parseFloat(val) || 0})}
                                  className="w-full pl-8 pr-3 py-3 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500 text-right font-bold text-sm"
                               />
                           </div>
                       </div>
                   </div>

                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Observação</label>
                       <input 
                          type="text"
                          value={editingItem.observation || ''}
                          onChange={(e) => setEditingItem({...editingItem, observation: e.target.value})}
                          placeholder="Ex: Marca específica, quantidade em gramas..."
                          className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                       />
                   </div>

                   <button 
                      type="submit"
                      disabled={!editingItem.name.trim()}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                   >
                      <Check className="w-5 h-5" /> Salvar Alterações
                   </button>
               </form>
           </div>
        </div>
      )}

      {/* HEADER & BUDGET BAR */}
      <div>
        {/* Month Selector */}
        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-800 mb-4 max-w-sm mx-auto w-full">
            <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors rounded-lg text-indigo-700 dark:text-indigo-400"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="px-3 text-sm md:text-base font-black text-indigo-800 dark:text-indigo-300 text-center flex items-center justify-center gap-2 capitalize">
                <Calendar className="w-4 h-4 text-indigo-500 hidden md:block" />
                {currentDate.toLocaleDateString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + currentDate.toLocaleDateString('pt-BR', { month: 'long' }).slice(1)}/{currentDate.getFullYear().toString().slice(-2)}
            </div>
            
            <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors rounded-lg text-indigo-700 dark:text-indigo-400"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
             <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="w-7 h-7 text-indigo-600" />
                    Lista de Compras
                </h2>
                <div className="flex items-center gap-4 mt-1">
                    <button 
                        onClick={() => setActiveTab('list')}
                        className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${activeTab === 'list' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List className="w-4 h-4" /> Lista
                    </button>
                    <button 
                        onClick={() => setActiveTab('timeline')}
                        className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${activeTab === 'timeline' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <History className="w-4 h-4" /> Linha do Tempo
                    </button>
                </div>
             </div>
             <div className="flex flex-wrap items-center gap-2">
                 <button 
                    onClick={handleSelectAll}
                    disabled={filteredItems.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-sm bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                 >
                    <Check className="w-4 h-4" /> {filteredItems.length > 0 && filteredItems.every(i => i.isChecked) ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                 </button>
                 <button 
                    onClick={() => {
                       if (window.confirm('Tem certeza que deseja limpar a lista deste mês?')) {
                          onClearList(monthStr);
                       }
                    }}
                    disabled={filteredItems.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-sm bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 disabled:opacity-50"
                 >
                    <Trash2 className="w-4 h-4" /> Limpar Lista
                 </button>
                 <button 
                    onClick={handleRepeatNextMonth}
                    disabled={filteredItems.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 disabled:opacity-50"
                 >
                    <Copy className="w-4 h-4" /> Repetir para Mês que Vem
                 </button>
                 <button 
                    onClick={() => setIsAiModalOpen(true)}
                    disabled={!hasApiKey}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-sm ${!hasApiKey ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300'}`}
                 >
                    <Sparkles className="w-4 h-4" /> Gerar com IA
                 </button>
             </div>
        </div>
        
        {/* Budget Control Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex justify-between items-end mb-2">
                 <div className="flex gap-4 sm:gap-6">
                     <div>
                         <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Previsão</p>
                         <p className="text-xl font-bold text-slate-800 dark:text-white">{formatValue(forecastTotal)}</p>
                     </div>
                     <div>
                         <p className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider mb-1 flex items-center gap-1"><Check className="w-3 h-3" /> Real</p>
                         <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatValue(spentTotal)}</p>
                     </div>
                 </div>
                 
                 <div className="text-right">
                     <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 flex items-center justify-end gap-1 cursor-pointer hover:text-indigo-500" onClick={() => { setIsEditingBudget(true); setTempBudget(shoppingBudget.toString()); }}>
                        Teto de Gastos (Viagem) <Tag className="w-3 h-3" />
                     </p>
                     
                     {isEditingBudget ? (
                         <div className="flex items-center gap-2 justify-end">
                             <CurrencyInput 
                                autoFocus
                                className="w-24 p-1 text-right font-bold border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={tempBudget}
                                onChangeValue={(val) => setTempBudget(val)}
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

      {/* ADD ITEM FAB */}
      <button 
          onClick={() => setIsAddingItem(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40 hover:-translate-y-1 group"
      >
          <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* ADD ITEM MODAL */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-700 animate-scale-in">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <Plus className="w-6 h-6 text-indigo-500" /> Adicionar Item
                </h3>
                <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
             </div>
             <form onSubmit={(e) => { handleAddItem(e); setIsAddingItem(false); }} className="flex flex-col gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome do Item</label>
                    <input 
                       autoFocus
                       id="new-item-input"
                       type="text"
                       value={newItemName}
                       onChange={(e) => setNewItemName(e.target.value)}
                       placeholder="Nome do item..."
                       className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                       autoComplete="off"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Qtd / Unidade</label>
                        <div className="flex gap-2">
                             <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-1 border border-slate-300 dark:border-slate-600 shadow-sm flex-1">
                                 <button type="button" onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))} className="p-2 text-slate-500 hover:text-indigo-600"><Minus className="w-4 h-4" /></button>
                                 <input type="number" step="any" value={newItemQuantity} onChange={(e) => setNewItemQuantity(Number(e.target.value) || 1)} className="flex-1 w-full min-w-0 text-center font-bold text-slate-700 dark:text-white text-sm bg-transparent outline-none" />
                                 <button type="button" onClick={() => setNewItemQuantity(newItemQuantity + 1)} className="p-2 text-slate-500 hover:text-indigo-600"><Plus className="w-4 h-4" /></button>
                             </div>
                             <select
                                 value={newItemUnit}
                                 onChange={(e) => setNewItemUnit(e.target.value)}
                                 className="w-20 p-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm font-bold"
                             >
                                 <option value="un">UN</option>
                                 <option value="kg">KG</option>
                                 <option value="g">g</option>
                                 <option value="L">L</option>
                                 <option value="ml">ml</option>
                                 <option value="cx">CX</option>
                                 <option value="pct">PCT</option>
                                 <option value="pc">PÇ</option>
                                 <option value="bdj">BDJ</option>
                             </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Preço Ref.</label>
                            <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                               <input 
                                  type="text" 
                                  placeholder="0,00"
                                  value={newItemRefPrice}
                                  onChange={(e) => setNewItemRefPrice(formatCurrencyInput(e.target.value))}
                                  className="w-full pl-8 pr-2 py-3 font-bold text-right rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm"
                               />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Preço Real</label>
                            <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                               <input 
                                  type="text" 
                                  placeholder="0,00"
                                  value={newItemPrice}
                                  onChange={(e) => setNewItemPrice(formatCurrencyInput(e.target.value))}
                                  className="w-full pl-8 pr-2 py-3 font-bold text-right rounded-xl border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm"
                               />
                            </div>
                        </div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                        <select
                            value={newItemCategory}
                            onChange={(e) => setNewItemCategory(e.target.value as ShoppingCategory)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm"
                        >
                            {SHOPPING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Data(s)</label>
                        <div className="flex flex-col gap-2">
                             <input 
                                type="date"
                                value={newItemDate}
                                onChange={(e) => setNewItemDate(e.target.value)}
                                className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                             />
                             {repeatDates.map((date, idx) => (
                                 <div key={idx} className="flex gap-2 items-center">
                                     <input 
                                        type="date"
                                        value={date}
                                        onChange={(e) => {
                                            const newDates = [...repeatDates];
                                            newDates[idx] = e.target.value;
                                            setRepeatDates(newDates);
                                        }}
                                        className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                     />
                                     <button type="button" onClick={() => {
                                         const newDates = repeatDates.filter((_, i) => i !== idx);
                                         setRepeatDates(newDates);
                                     }} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl">
                                         <X className="w-4 h-4" />
                                     </button>
                                 </div>
                             ))}
                             <button type="button" onClick={() => setRepeatDates([...repeatDates, newItemDate])} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 mt-1">
                                 <Plus className="w-3 h-3" /> Repetir em outra data
                             </button>
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Observação</label>
                    <input 
                       type="text"
                       value={newItemObservation}
                       onChange={(e) => setNewItemObservation(e.target.value)}
                       placeholder="Observação (opcional)"
                       className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                       autoComplete="off"
                    />
                 </div>

                 <button 
                    type="submit" 
                    disabled={!newItemName.trim()}
                    className="w-full mt-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-bold text-lg"
                 >
                    <Plus className="w-5 h-5" /> Adicionar Item
                 </button>
             </form>
          </div>
        </div>
      )}

      {/* Categoria Anchors */}
      {activeTab === 'list' && filteredItems.length > 0 && (
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-[72px] z-20">
             <span className="text-xs font-bold text-slate-500 uppercase flex items-center pr-2 border-r border-slate-200 dark:border-slate-700">Ir para</span>
             {SHOPPING_CATEGORIES.filter(c => groupedItems[c]?.length > 0).map(cat => (
                 <button 
                     key={cat} 
                     onClick={() => document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth' })}
                     className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
                 >
                     {cat}
                 </button>
             ))}
          </div>
      )}

      {/* LIST (GROUPED BY CATEGORY) OR TIMELINE */}
      <div className="space-y-6">
         {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
               <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
               <p className="font-medium text-slate-800 dark:text-white">Sua lista para {formatMonth(currentDate)} está vazia.</p>
               {hasApiKey && <p className="text-sm mt-2 text-purple-500 cursor-pointer hover:underline" onClick={() => setIsAiModalOpen(true)}>Experimente usar a IA para criar uma lista!</p>}
            </div>
         ) : activeTab === 'timeline' ? (
            <div className="space-y-4">
                {timelineData.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <History className="w-12 h-12 mb-3 mx-auto opacity-20" />
                        <p>Nenhuma compra com valor e data registrada neste mês.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Histórico de Valores</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {timelineData.map((item, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{item.formatted}</span>
                                        </div>
                                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatValue(item.total)}</span>
                                    </div>
                                    <div className="flex flex-col border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 mt-2">
                                        {item.items.map(product => (
                                             <div key={product.id} className={`py-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${product.isChecked ? 'bg-slate-50/50 dark:bg-slate-700/30' : ''}`}>
                                                
                                                {/* Check & Name */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                   <button 
                                                      onClick={() => onUpdate(product.id, { isChecked: !product.isChecked })}
                                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                                         product.isChecked 
                                                         ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                         : 'border-slate-300 dark:border-slate-500 text-transparent hover:border-emerald-400'
                                                      }`}
                                                   >
                                                      <Check className="w-4 h-4" />
                                                   </button>
                                                   <div className="flex flex-col min-w-0">
                                                      <span className={`font-medium text-lg truncate ${product.isChecked ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                                         {product.name}
                                                      </span>
                                                      <div className="flex items-center gap-2 flex-wrap text-xs">
                                                          {product.observation && (
                                                             <span className={`truncate ${product.isChecked ? 'text-slate-400/70' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                {product.observation}
                                                             </span>
                                                          )}
                                                      </div>
                                                   </div>
                                                </div>
                                                
                                                {/* Controls (Qty & Price) */}
                                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                                   
                                                   {/* Quantity */}
                                                   <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                                      <button onClick={() => handleQuantity(product.id, product.quantity, -1)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Minus className="w-4 h-4" /></button>
                                                      <div className="w-16 text-center font-bold text-slate-700 dark:text-white text-sm flex items-center justify-center gap-1">
                                                          <span>{product.quantity}</span>
                                                          {product.unit && <span className="text-[10px] text-slate-400">{product.unit.toUpperCase()}</span>}
                                                      </div>
                                                      <button onClick={() => handleQuantity(product.id, product.quantity, 1)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Plus className="w-4 h-4" /></button>
                                                   </div>
                                                   
                                                   {/* Price Input (Calculator Mode) */}
                                                   <div className="relative flex flex-col items-end">
                                                      <div className="relative">
                                                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                                                         <CurrencyInput 
                                                            placeholder="0,00"
                                                            value={product.actualPrice === 0 ? '' : product.actualPrice.toString()}
                                                            onChangeValue={(val) => onUpdate(product.id, { actualPrice: parseFloat(val) || 0 })}
                                                            className={`w-28 pl-8 pr-2 py-2 rounded-lg border outline-none font-bold text-right transition-colors ${
                                                               product.actualPrice > 0 
                                                               ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                                                               : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-indigo-500'
                                                            }`}
                                                         />
                                                      </div>
                                                      {product.quantity > 1 && product.actualPrice > 0 && (
                                                         <span className="text-[10px] text-slate-400 font-medium mt-1">
                                                            Subtotal: {formatValue(product.quantity * product.actualPrice)}
                                                         </span>
                                                      )}
                                                   </div>
                                                   
                                                   {/* Edit */}
                                                   <button 
                                                      onClick={() => setEditingItem(product)}
                                                       className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                                                   >
                                                      <Edit2 className="w-5 h-5" />
                                                   </button>
                                                   
                                                   {/* Delete */}
                                                   <button 
                                                      onClick={() => onDelete(product.id)}
                                                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                   >
                                                      <Trash2 className="w-5 h-5" />
                                                   </button>
                                                </div>
                                             </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 border-t border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
                            <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Total do Período</span>
                            <span className="text-xl font-black text-indigo-700 dark:text-indigo-200">{formatValue(spentTotal)}</span>
                        </div>
                    </div>
                )}
            </div>
         ) : (
            SHOPPING_CATEGORIES.map(category => {
                const categoryItems = groupedItems[category];
                if (!categoryItems || categoryItems.length === 0) return null;

                const groupedByDate = categoryItems.reduce((acc, item) => {
                    const d = item.purchaseDate || 'Sem Data';
                    if (!acc[d]) acc[d] = [];
                    acc[d].push(item);
                    return acc;
                }, {} as Record<string, typeof categoryItems>);
                
                const sortedDates = Object.keys(groupedByDate).sort((a,b) => {
                    if (a === 'Sem Data') return 1;
                    if (b === 'Sem Data') return -1;
                    return new Date(a).getTime() - new Date(b).getTime();
                });

                return (
                    <div key={category} id={`cat-${category}`} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 scroll-mt-24">
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <List className="w-3 h-3" /> {category}
                            </h3>
                            <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                                {categoryItems.length}
                            </span>
                        </div>
                        
                        <div className="divide-y divide-slate-100 dark:divide-slate-700 pb-2">
                           {sortedDates.map(dateKey => (
                               <div key={dateKey} className="pt-2">
                                   <div className="px-4 py-1 flex items-center gap-2">
                                       <Calendar className="w-3 h-3 text-slate-400" />
                                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                           {dateKey === 'Sem Data' ? 'Sem Data' : new Date(dateKey + 'T00:00:00').toLocaleDateString('pt-BR')}
                                       </span>
                                   </div>
                                   <div className="flex flex-col">
                                       {groupedByDate[dateKey].map(item => (
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
                                    <div className="flex flex-col min-w-0">
                                       <span className={`font-medium text-lg truncate ${item.isChecked ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                          {item.name}
                                       </span>
                                       <div className="flex items-center gap-2 flex-wrap text-xs">
                                           {item.purchaseDate && (
                                              <span className={`flex items-center gap-1 ${item.isChecked ? 'text-slate-400/70' : 'text-indigo-500 font-medium'}`}>
                                                 <Calendar className="w-3 h-3" />
                                                 {item.purchaseDate.split('-').reverse().join('/')}
                                              </span>
                                           )}
                                           {item.observation && (
                                              <span className={`truncate ${item.isChecked ? 'text-slate-400/70' : 'text-slate-500 dark:text-slate-400'}`}>
                                                 {item.observation}
                                              </span>
                                           )}
                                       </div>
                                    </div>
                                 </div>

                                 {/* Controls (Qty & Price) */}
                                 <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                    
                                    {/* Quantity */}
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                       <button onClick={() => handleQuantity(item.id, item.quantity, -1)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Minus className="w-4 h-4" /></button>
                                       <div className="w-16 text-center font-bold text-slate-700 dark:text-white text-sm flex items-center justify-center gap-1">
                                           <span>{item.quantity}</span>
                                           {item.unit && <span className="text-[10px] text-slate-400">{item.unit.toUpperCase()}</span>}
                                       </div>
                                       <button onClick={() => handleQuantity(item.id, item.quantity, 1)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Plus className="w-4 h-4" /></button>
                                    </div>

                                    {/* Price Input (Calculator Mode) */}
                                    <div className="relative flex flex-col items-end">
                                       <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                                          <CurrencyInput 
                                             placeholder="0,00"
                                             value={item.actualPrice === 0 ? '' : item.actualPrice.toString()}
                                             onChangeValue={(val) => onUpdate(item.id, { actualPrice: parseFloat(val) || 0 })}
                                             className={`w-28 pl-8 pr-2 py-2 rounded-lg border outline-none font-bold text-right transition-colors ${
                                                item.actualPrice > 0 
                                                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                                                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-indigo-500'
                                             }`}
                                          />
                                       </div>
                                       {item.quantity > 1 && item.actualPrice > 0 && (
                                          <span className="text-[10px] text-slate-400 font-medium mt-1">
                                             Subtotal: {formatValue(item.quantity * item.actualPrice)}
                                          </span>
                                       )}
                                    </div>

                                    {/* Edit */}
                                    <button 
                                       onClick={() => setEditingItem(item)}
                                       className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                                    >
                                       <Edit2 className="w-5 h-5" />
                                    </button>

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
                           ))}
                        </div>
                    </div>
                );
            })
         )}
      </div>

    </div>
  );
};