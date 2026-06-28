import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Edit, 
  Search, 
  Package, 
  AlertTriangle, 
  Check, 
  ShoppingCart, 
  PlusCircle, 
  X, 
  Filter,
  CheckCircle2,
  History,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { InventoryItem, ShoppingCategory, ReplenishmentLog } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  replenishmentLogs?: ReplenishmentLog[];
  onAdd: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<InventoryItem>) => void;
  onDelete: (id: string) => void;
  onAddReplenishmentLog: (log: Omit<ReplenishmentLog, 'id'>) => void;
  onClearReplenishmentHistory: () => void;
  onAddToShoppingList: (item: { name: string; category: any; unit: string; quantity: number }) => void;
  privacyMode: boolean;
}

const CATEGORIES: ShoppingCategory[] = [
  'Hortifruti', 'Carnes', 'Laticínios', 'Mercearia', 'Padaria', 'Bebidas', 'Limpeza', 'Higiene', 'Outros'
];

export const getStockStatusDetails = (item: InventoryItem) => {
  const persistedMonths = item.persistedMonthsCount || 0;
  if (persistedMonths >= 2 && item.quantity > 0) {
    return {
      label: "Diminuir estoque",
      classes: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/30",
      description: "Persistente no estoque há pelo menos 2 meses. Recomendado diminuir quantidade comprada."
    };
  } else if (item.minQuantity !== undefined && item.quantity <= item.minQuantity) {
    return {
      label: "Aumentar estoque",
      classes: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30",
      description: "Nível abaixo do mínimo ideal."
    };
  } else {
    return {
      label: "Estoque está bom",
      classes: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30",
      description: "Estoque adequado para as necessidades."
    };
  }
};

export const Inventory: React.FC<InventoryProps> = ({
  items = [],
  replenishmentLogs = [],
  onAdd,
  onUpdate,
  onDelete,
  onAddReplenishmentLog,
  onClearReplenishmentHistory,
  onAddToShoppingList,
  privacyMode
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');
  
  // Stock list state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterReplenish, setFilterReplenish] = useState<boolean | null>(null); // null = all, true = needs replenish, false = ok

  // History list state
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'purchase' | 'manual'>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('all'); // format "YYYY-MM" or "all"

  // Modal / Add item state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnit, setItemUnit] = useState('un');
  const [itemCategory, setItemCategory] = useState<ShoppingCategory>('Outros');
  const [itemMinQuantity, setItemMinQuantity] = useState<number>(1);
  const [itemPersistedMonths, setItemPersistedMonths] = useState<number>(0);

  const resetForm = () => {
    setItemName('');
    setItemQuantity(1);
    setItemUnit('un');
    setItemCategory('Outros');
    setItemMinQuantity(1);
    setItemPersistedMonths(0);
    setEditingItem(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(item.quantity);
    setItemUnit(item.unit);
    setItemCategory(item.category as ShoppingCategory);
    setItemMinQuantity(item.minQuantity || 0);
    setItemPersistedMonths(item.persistedMonthsCount || 0);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const qty = Number(itemQuantity);
    const minQty = Number(itemMinQuantity);

    const itemData = {
      name: itemName.trim(),
      quantity: qty,
      unit: itemUnit,
      category: itemCategory,
      minQuantity: minQty,
      persistedMonthsCount: Number(itemPersistedMonths)
    };

    if (editingItem) {
      onUpdate(editingItem.id, itemData);
      
      // If quantity increased, log manual replenishment
      if (qty > editingItem.quantity) {
        onAddReplenishmentLog({
          itemName: itemData.name,
          quantityAdded: qty - editingItem.quantity,
          unit: itemUnit,
          category: itemCategory,
          date: new Date().toISOString(),
          type: 'manual'
        });
      }
    } else {
      onAdd(itemData);
      
      // Log new stock as manual replenishment if qty > 0
      if (qty > 0) {
        onAddReplenishmentLog({
          itemName: itemData.name,
          quantityAdded: qty,
          unit: itemUnit,
          category: itemCategory,
          date: new Date().toISOString(),
          type: 'manual'
        });
      }
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleQuantityChange = (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    onUpdate(id, { quantity: newQty });

    // If delta is positive, log manual replenishment
    if (delta > 0) {
      const item = items.find(i => i.id === id);
      if (item) {
        onAddReplenishmentLog({
          itemName: item.name,
          quantityAdded: delta,
          unit: item.unit || 'un',
          category: item.category || 'Outros',
          date: new Date().toISOString(),
          type: 'manual'
        });
      }
    }
  };

  const handleAddBackToShopping = (item: InventoryItem) => {
    onAddToShoppingList({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: item.minQuantity && item.quantity < item.minQuantity 
        ? Math.max(1, item.minQuantity - item.quantity) 
        : 1
    });
  };

  // Filter items (Current Stock)
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    const needsReplenish = item.minQuantity !== undefined && item.quantity <= item.minQuantity;
    const matchesReplenish = filterReplenish === null || (filterReplenish === needsReplenish);

    return matchesSearch && matchesCategory && matchesReplenish;
  });

  // Filter Replenishment Logs
  const filteredLogs = replenishmentLogs
    .filter(log => {
      const matchesSearch = log.itemName.toLowerCase().includes(historySearch.toLowerCase());
      const matchesType = historyTypeFilter === 'all' || log.type === historyTypeFilter;
      
      let matchesMonth = true;
      if (historyMonthFilter !== 'all' && log.date) {
        matchesMonth = log.date.substring(0, 7) === historyMonthFilter;
      }

      return matchesSearch && matchesType && matchesMonth;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Extract distinct months for dropdown filter
  const distinctMonths = Array.from(
    new Set(
      replenishmentLogs
        .filter(log => log.date)
        .map(log => log.date.substring(0, 7))
    )
  ).sort((a, b) => b.localeCompare(a));

  const totalItems = items.length;
  const itemsLow = items.filter(item => item.minQuantity !== undefined && item.quantity <= item.minQuantity).length;

  // Analysis / Recommendation Logic for adjusting next month's shopping quantities
  const getPlanningSuggestions = () => {
    const suggestionList: {
      itemName: string;
      category: string;
      unit: string;
      totalReplenished: number;
      currentStock: number;
      minQuantity: number;
      recommendation: string;
      status: 'increase' | 'decrease' | 'balanced';
    }[] = [];

    // Aggregate replenishment amounts per item
    const agg: Record<string, { total: number; unit: string; category: string }> = {};
    
    // Use selected month's logs if possible, else use all logs
    const activeLogsForAnalysis = historyMonthFilter !== 'all' 
      ? replenishmentLogs.filter(log => log.date && log.date.substring(0, 7) === historyMonthFilter)
      : replenishmentLogs;

    activeLogsForAnalysis.forEach(log => {
      const key = log.itemName.trim().toLowerCase();
      if (!agg[key]) {
        agg[key] = { total: 0, unit: log.unit || 'un', category: log.category || 'Outros' };
      }
      agg[key].total += log.quantityAdded;
    });

    // Match with current inventory to make recommendations
    items.forEach(invItem => {
      const key = invItem.name.trim().toLowerCase();
      const totalReplenished = agg[key]?.total || 0;
      const minQty = invItem.minQuantity || 0;
      const current = invItem.quantity;
      const persistedMonths = invItem.persistedMonthsCount || 0;

      let recommendation = '';
      let status: 'increase' | 'decrease' | 'balanced' = 'balanced';

      // 0. Persisted for at least 2 months
      if (persistedMonths >= 2 && current > 0) {
        recommendation = `Persistência Detectada: O produto persistiu por pelo menos 2 meses no estoque (${current} ${invItem.unit}). Sugerimos diminuir a quantidade de compra para o próximo mês em pelo menos 30% para controlar melhor o estoque.`;
        status = 'decrease';
      }
      // 1. Stock is empty/low despite some replenishment -> shortage risk
      else if (current <= minQty && totalReplenished > 0) {
        recommendation = `Falta Detectada: Você repôs ${totalReplenished} ${invItem.unit} este mês, mas o estoque continua muito baixo (${current} ${invItem.unit}). Sugerimos aumentar a quantidade de compra para o próximo mês em pelo menos 20-30%.`;
        status = 'increase';
      }
      // 2. High stock and high replenishment or high stock and no replenish -> maybe excess
      else if (current > minQty * 2 && totalReplenished > 0) {
        recommendation = `Excesso Detectado: Você repôs ${totalReplenished} ${invItem.unit} e o estoque atual está muito alto (${current} ${invItem.unit}). Recomendamos comprar menos no próximo mês para evitar desperdício e economizar.`;
        status = 'decrease';
      }
      // 3. Stock is empty and no replenishment recorded
      else if (current <= minQty && totalReplenished === 0) {
        recommendation = `Pendente: Este item está abaixo do mínimo ideal e não teve nenhuma reposição registrada. Adicione à sua lista de compras.`;
        status = 'increase';
      }
      // 4. Balanced
      else {
        recommendation = `Estoque Saudável: A média de reposição está em equilíbrio com o consumo da sua casa. Mantenha os níveis atuais.`;
        status = 'balanced';
      }

      // Only add to suggestions if there was active replenishment, if it is low on stock, or if it persisted
      if (totalReplenished > 0 || current <= minQty || (persistedMonths >= 2 && current > 0)) {
        suggestionList.push({
          itemName: invItem.name,
          category: invItem.category,
          unit: invItem.unit || 'un',
          totalReplenished,
          currentStock: current,
          minQuantity: minQty,
          recommendation,
          status
        });
      }
    });

    return suggestionList;
  };

  const suggestions = getPlanningSuggestions();
  const suggestionsToIncrease = suggestions.filter(s => s.status === 'increase');
  const suggestionsToDecrease = suggestions.filter(s => s.status === 'decrease');

  const handleClearHistoryConfirm = () => {
    if (window.confirm("Deseja realmente limpar todo o histórico de reposição? Esta ação é irreversível.")) {
      onClearReplenishmentHistory();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Controle de Estoque & Reposição
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitore o estoque de itens da sua casa, registre o histórico de reposições e ajuste suas compras do mês.
          </p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-xs"
        >
          <PlusCircle className="w-4 h-4" />
          Novo Item no Estoque
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-black border-b-2 transition-all uppercase tracking-wider ${
            activeTab === 'stock'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Package className="w-4 h-4" />
          Estoque Atual ({totalItems})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-black border-b-2 transition-all uppercase tracking-wider ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          Histórico de Reposições ({replenishmentLogs.length})
        </button>
      </div>

      {activeTab === 'stock' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Itens Registrados</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{totalItems}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
              <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Precisa de Reposição</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400">{itemsLow}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Estoque Adequado</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalItems - itemsLow}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar item no estoque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todas Categorias</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status buttons */}
              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900 self-start lg:self-auto shrink-0">
                <button
                  onClick={() => setFilterReplenish(null)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterReplenish === null
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterReplenish(true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    filterReplenish === true
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-rose-500 hover:bg-rose-500/10'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Reposição ({itemsLow})
                </button>
                <button
                  onClick={() => setFilterReplenish(false)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    filterReplenish === false
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-emerald-500 hover:bg-emerald-500/10'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Adequado ({totalItems - itemsLow})
                </button>
              </div>
            </div>
          </div>

          {/* Grid of items */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-bold">Nenhum item encontrado no estoque.</p>
              <p className="text-slate-400 text-xs mt-1">Experimente mudar seus filtros ou adicione um novo item.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const statusDetails = getStockStatusDetails(item);
                const borderClass = statusDetails.label === "Diminuir estoque"
                  ? "border-amber-300 dark:border-amber-900/50 shadow-md shadow-amber-500/[0.02]"
                  : statusDetails.label === "Aumentar estoque"
                    ? "border-rose-300 dark:border-rose-900/50 shadow-md shadow-rose-500/[0.02]"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm";
                
                return (
                  <div 
                    key={item.id} 
                    className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all p-4 flex flex-col justify-between gap-4 ${borderClass}`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                          {item.category || 'Outros'}
                        </span>
                        
                        <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-md ${statusDetails.classes}`}>
                          {statusDetails.label === "Diminuir estoque" && <TrendingDown className="w-3 h-3" />}
                          {statusDetails.label === "Aumentar estoque" && <AlertTriangle className="w-3 h-3" />}
                          {statusDetails.label === "Estoque está bom" && <Check className="w-3 h-3" />}
                          {statusDetails.label}
                        </span>
                      </div>
 
                      <h4 className="font-bold text-slate-800 dark:text-white text-base truncate">
                        {privacyMode ? '••••••' : item.name}
                      </h4>
                      
                      <div className="mt-2 text-xs text-slate-400 flex flex-col gap-1">
                        <div className="flex justify-between">
                          <span>Mínimo Recomendado:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                            {item.minQuantity ?? 0} {(item.unit || 'un').toUpperCase()}
                          </span>
                        </div>
                        {item.persistedMonthsCount !== undefined && item.persistedMonthsCount > 0 && (
                          <div className="flex justify-between text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            <span>Persistência no Estoque:</span>
                            <span>{item.persistedMonthsCount} {item.persistedMonthsCount === 1 ? 'mês' : 'meses'}</span>
                          </div>
                        )}
                        {item.updatedAt && (
                          <div className="flex justify-between text-[10px]">
                            <span>Última atualização:</span>
                            <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-1">
                      {/* Quantity adjustment controls */}
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-1 border border-slate-100 dark:border-slate-700">
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-indigo-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-12 text-center text-sm font-black text-slate-700 dark:text-white flex items-center justify-center gap-0.5">
                          <span>{privacyMode ? '••' : item.quantity}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{item.unit || 'un'}</span>
                        </div>
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-indigo-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        {(item.minQuantity !== undefined && item.quantity <= item.minQuantity) && (
                          <button
                            onClick={() => handleAddBackToShopping(item)}
                            title="Adicionar à lista de compras para reposição"
                            className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-all border border-indigo-100 dark:border-indigo-900/30"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Editar"
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          title="Excluir"
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Intelligent Planning & recommendation assistant (💡 Assistente de Planejamento de Compras) */}
          <div className="bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/20 dark:to-sky-950/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">💡 Assistente de Planejamento de Compras</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cruzamos o seu histórico de reposições de {historyMonthFilter === 'all' ? 'todos os meses' : 'este mês'} com o seu estoque para ajustar as compras para o próximo mês.
                </p>
              </div>
            </div>

            {/* Smart Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Shortages Alert */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <h4 className="text-xs font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Consumo Alto (Comprar Mais no Próximo Mês)
                </h4>
                {suggestionsToIncrease.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum item em falta recorrente detectado. Seu plano de compras está cobrindo a demanda!</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {suggestionsToIncrease.slice(0, 4).map(s => (
                      <div key={s.itemName} className="text-xs border-b border-slate-100 dark:border-slate-700 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                          <span>{s.itemName}</span>
                          <span className="text-rose-600 dark:text-rose-400">Estoque: {s.currentStock} {s.unit}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Excess Alert */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <h4 className="text-xs font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-4 h-4" />
                  Sobra / Excesso (Comprar Menos no Próximo Mês)
                </h4>
                {suggestionsToDecrease.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum item com estoque excessivo detectado. Ritmo ideal de consumo e compras!</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {suggestionsToDecrease.slice(0, 4).map(s => (
                      <div key={s.itemName} className="text-xs border-b border-slate-100 dark:border-slate-700 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                          <span>{s.itemName}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">Estoque: {s.currentStock} {s.unit}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History Filters Card */}
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar no histórico de reposição..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Month selector */}
              <div className="w-full lg:w-48 relative">
                <select
                  value={historyMonthFilter}
                  onChange={(e) => setHistoryMonthFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todos os Meses</option>
                  {distinctMonths.map(m => {
                    const [year, month] = m.split('-');
                    const dateObj = new Date(Number(year), Number(month) - 1, 1);
                    const label = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    return (
                      <option key={m} value={m}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Type selector */}
              <div className="w-full lg:w-48">
                <select
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todas as Origens</option>
                  <option value="purchase">🛒 Compras (Shopping List)</option>
                  <option value="manual">✍️ Ajustes de Estoque</option>
                </select>
              </div>

              {/* Reset History Button */}
              {replenishmentLogs.length > 0 && (
                <button
                  onClick={handleClearHistoryConfirm}
                  className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-bold py-2 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 self-start lg:self-auto shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar Histórico
                </button>
              )}
            </div>
          </div>

          {/* Chronological Logs Feed */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-bold">Nenhum registro de reposição encontrado.</p>
              <p className="text-slate-400 text-xs mt-1">
                Reposições são geradas automaticamente quando você finaliza compras do mercado ou aumenta o estoque manualmente.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/30">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Origem</th>
                      <th className="py-3 px-4 text-right">Quantidade Reposta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-xs">
                    {filteredLogs.map(log => {
                      const logDate = new Date(log.date);
                      const formattedDate = logDate.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400 dark:text-slate-500 text-[10px]">
                            {formattedDate}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                            {privacyMode ? '••••••' : log.itemName}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[10px]">
                            {log.category || 'Outros'}
                          </td>
                          <td className="py-3 px-4">
                            {log.type === 'purchase' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
                                🛒 Compra
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                                ✍️ Ajuste
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            + {privacyMode ? '••' : log.quantityAdded} <span className="text-[10px] text-slate-400 font-bold">{log.unit || 'un'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal - Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {editingItem ? 'Editar Item no Estoque' : 'Novo Item no Estoque'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Nome do Item *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arroz, Leite, Papel Higiênico..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Qtd Atual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Unidade</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="un">UN</option>
                    <option value="kg">KG</option>
                    <option value="g">G</option>
                    <option value="cx">CX</option>
                    <option value="pct">PCT</option>
                    <option value="L">L</option>
                    <option value="ml">ML</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Categoria</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as ShoppingCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Mínimo para Reposição</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemMinQuantity}
                    onChange={(e) => setItemMinQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Persistência no Estoque</label>
                <select
                  value={itemPersistedMonths}
                  onChange={(e) => setItemPersistedMonths(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>Novo / Sem persistência (&lt; 1 mês)</option>
                  <option value={1}>Persistiu por 1 mês no estoque</option>
                  <option value={2}>Persistiu por 2 meses (Comprar menor %)</option>
                  <option value={3}>Persistiu por 3 ou mais meses (Comprar menor %)</option>
                </select>
                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1.5 ml-1 font-semibold">
                  * Se persistir por pelo menos 2 meses, a lista de compras recomendará automaticamente comprar uma quantidade menor.
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-xs"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
