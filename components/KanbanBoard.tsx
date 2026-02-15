
import React, { useState, useEffect } from 'react';
import { KanbanColumn, KanbanCard, Transaction, TransactionType } from '../types';
import { Plus, X, GripVertical, CheckCircle2, MoreHorizontal, Flag, Wallet, Edit2, Sparkles } from 'lucide-react';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onSaveColumn: (col: KanbanColumn) => void;
  onDeleteColumn: (id: string) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  privacyMode: boolean;
}

const COLORS = [
    { label: 'Azul', value: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
    { label: 'Verde', value: 'green', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Roxo', value: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' },
    { label: 'Rosa', value: 'rose', bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300' },
    { label: 'Amarelo', value: 'yellow', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
];

const COLUMN_THEMES = [
    { // Index 0: Indigo (Ideias)
        wrapper: 'bg-indigo-50/80 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800',
        header: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
        title: 'text-indigo-900 dark:text-indigo-100',
        count: 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200',
        button: 'text-indigo-600 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-900/30',
        addButtonBg: 'bg-indigo-600 hover:bg-indigo-700'
    },
    { // Index 1: Cyan (Pesquisa)
        wrapper: 'bg-cyan-50/80 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800',
        header: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
        title: 'text-cyan-900 dark:text-cyan-100',
        count: 'bg-cyan-200 dark:bg-cyan-800 text-cyan-700 dark:text-cyan-200',
        button: 'text-cyan-600 hover:bg-cyan-100 dark:text-cyan-300 dark:hover:bg-cyan-900/30',
        addButtonBg: 'bg-cyan-600 hover:bg-cyan-700'
    },
    { // Index 2: Amber (Prioridade)
        wrapper: 'bg-amber-50/80 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
        header: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
        title: 'text-amber-900 dark:text-amber-100',
        count: 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200',
        button: 'text-amber-600 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30',
        addButtonBg: 'bg-amber-600 hover:bg-amber-700'
    },
    { // Index 3: Emerald (Concluído)
        wrapper: 'bg-emerald-50/80 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800',
        header: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
        title: 'text-emerald-900 dark:text-emerald-100',
        count: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200',
        button: 'text-emerald-600 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/30',
        addButtonBg: 'bg-emerald-600 hover:bg-emerald-700'
    },
    { // Index 4: Purple (Extra)
        wrapper: 'bg-purple-50/80 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800',
        header: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
        title: 'text-purple-900 dark:text-purple-100',
        count: 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200',
        button: 'text-purple-600 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/30',
        addButtonBg: 'bg-purple-600 hover:bg-purple-700'
    },
    { // Index 5: Rose (Extra)
        wrapper: 'bg-rose-50/80 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800',
        header: 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800',
        title: 'text-rose-900 dark:text-rose-100',
        count: 'bg-rose-200 dark:bg-rose-800 text-rose-700 dark:text-rose-200',
        button: 'text-rose-600 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-900/30',
        addButtonBg: 'bg-rose-600 hover:bg-rose-700'
    }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, onSaveColumn, onDeleteColumn, onAddTransaction, privacyMode }) => {
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(null);
  
  // New Card State
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardAmount, setNewCardAmount] = useState('');
  const [newCardColor, setNewCardColor] = useState('blue');

  // Edit Column Title State
  const [editingColumn, setEditingColumn] = useState<{ id: string, title: string } | null>(null);

  // Drag State
  const [draggedCard, setDraggedCard] = useState<{ cardId: string, sourceColId: string } | null>(null);

  // Initialize Default Columns if Empty
  useEffect(() => {
      if (columns.length === 0) {
          const defaultCols: KanbanColumn[] = [
              { id: 'col-1', title: 'Ideias / Sonhos', order: 0, cards: [] },
              { id: 'col-2', title: 'Pesquisando Preço', order: 1, cards: [] },
              { id: 'col-3', title: 'Prioridade / Próxima', order: 2, cards: [] },
              { id: 'col-4', title: 'Concluído / Pago', order: 3, isConclusion: true, cards: [] },
          ];
          defaultCols.forEach(c => onSaveColumn(c));
      }
  }, [columns.length]); // Only run if empty length changes (initial load)

  const handleAddColumn = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newColumnTitle.trim()) return;
      
      const newCol: KanbanColumn = {
          id: crypto.randomUUID(),
          title: newColumnTitle,
          order: columns.length,
          cards: []
      };
      onSaveColumn(newCol);
      setNewColumnTitle('');
  };

  const startEditingColumn = (col: KanbanColumn) => {
      setEditingColumn({ id: col.id, title: col.title });
  };

  const saveColumnTitle = () => {
      if (!editingColumn) return;
      const col = columns.find(c => c.id === editingColumn.id);
      if (col && editingColumn.title.trim()) {
          onSaveColumn({ ...col, title: editingColumn.title });
      }
      setEditingColumn(null);
  };

  const handleAddCard = (columnId: string) => {
      const col = columns.find(c => c.id === columnId);
      if (!col) return;

      const newCard: KanbanCard = {
          id: crypto.randomUUID(),
          title: newCardTitle || 'Novo Item',
          amount: parseFloat(newCardAmount) || 0,
          color: newCardColor
      };

      onSaveColumn({
          ...col,
          cards: [...col.cards, newCard]
      });

      setAddingCardToColumn(null);
      setNewCardTitle('');
      setNewCardAmount('');
      setNewCardColor('blue');
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
      const col = columns.find(c => c.id === columnId);
      if (!col) return;
      
      onSaveColumn({
          ...col,
          cards: col.cards.filter(c => c.id !== cardId)
      });
  };

  // --- DRAG AND DROP LOGIC ---

  const handleDragStart = (e: React.DragEvent, cardId: string, sourceColId: string) => {
      setDraggedCard({ cardId, sourceColId });
      e.dataTransfer.effectAllowed = 'move';
      // Hack to make ghost image look better (optional)
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
      e.preventDefault();
      if (!draggedCard) return;

      const { cardId, sourceColId } = draggedCard;
      if (sourceColId === targetColId) {
          setDraggedCard(null);
          return; // Same column reordering not implemented for simplicity, but moving between cols works
      }

      const sourceCol = columns.find(c => c.id === sourceColId);
      const targetCol = columns.find(c => c.id === targetColId);

      if (sourceCol && targetCol) {
          const card = sourceCol.cards.find(c => c.id === cardId);
          if (card) {
              // 1. Remove from Source
              onSaveColumn({
                  ...sourceCol,
                  cards: sourceCol.cards.filter(c => c.id !== cardId)
              });

              // 2. Add to Target
              onSaveColumn({
                  ...targetCol,
                  cards: [...targetCol.cards, card]
              });
          }
      }
      setDraggedCard(null);
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-4 shrink-0">
          <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Wallet className="w-7 h-7 text-indigo-600" />
                  NEXO Flow
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Organize seus planos: Sonhe, Pesquise, Priorize e Compre.</p>
          </div>
          
          <form onSubmit={handleAddColumn} className="flex gap-2">
              <input 
                  type="text" 
                  placeholder="Nova Coluna..." 
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button type="submit" className="bg-slate-800 dark:bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors">
                  <Plus className="w-5 h-5" />
              </button>
          </form>
      </div>

      {/* Custom Styles for Scrollbar Visibility */}
      <style>{`
        .kanban-scroll::-webkit-scrollbar {
            height: 12px;
        }
        .kanban-scroll::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
            border-radius: 10px;
            margin: 0 10px;
        }
        .kanban-scroll::-webkit-scrollbar-thumb {
            background-color: #94a3b8;
            border-radius: 10px;
            border: 3px solid transparent;
            background-clip: content-box;
        }
        .kanban-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #64748b;
        }
        .dark .kanban-scroll::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
        }
        .dark .kanban-scroll::-webkit-scrollbar-thumb {
            background-color: #475569;
        }
        .dark .kanban-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8;
        }
      `}</style>

      {/* BOARD CONTAINER */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 kanban-scroll">
          <div className="flex h-full gap-4 min-w-max px-2">
              
              {sortedColumns.map((col, index) => {
                  // Determine Theme
                  let themeIndex = index % COLUMN_THEMES.length;
                  if (col.isConclusion) themeIndex = 3; // Force Emerald for conclusion
                  const theme = COLUMN_THEMES[themeIndex];

                  return (
                  <div 
                      key={col.id} 
                      className={`w-72 flex flex-col rounded-xl border backdrop-blur-sm transition-colors ${theme.wrapper} ${draggedCard && draggedCard.sourceColId !== col.id ? 'opacity-50 border-dashed' : 'shadow-sm'}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.id)}
                  >
                      {/* Column Header */}
                      <div className={`p-3 border-b flex justify-between items-center group/header rounded-t-xl ${theme.header} ${theme.wrapper.split(' ')[2]}`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                              {col.isConclusion && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                              
                              {editingColumn?.id === col.id ? (
                                  <input 
                                      autoFocus
                                      className={`w-full bg-white dark:bg-slate-900 border rounded px-1 py-0.5 text-sm font-bold outline-none ${theme.title}`}
                                      value={editingColumn.title}
                                      onChange={(e) => setEditingColumn({ ...editingColumn, title: e.target.value })}
                                      onBlur={saveColumnTitle}
                                      onKeyDown={(e) => e.key === 'Enter' && saveColumnTitle()}
                                  />
                              ) : (
                                  <div className="flex items-center gap-2 overflow-hidden w-full">
                                      <h3 
                                          className={`font-bold text-sm uppercase tracking-wide truncate cursor-pointer transition-colors ${theme.title}`}
                                          onDoubleClick={() => startEditingColumn(col)}
                                          title="Duplo clique para renomear"
                                      >
                                          {col.title}
                                      </h3>
                                      <button 
                                          onClick={() => startEditingColumn(col)}
                                          className="opacity-0 group-hover/header:opacity-100 transition-opacity p-1 text-slate-400 hover:text-indigo-500"
                                      >
                                          <Edit2 className="w-3 h-3" />
                                      </button>
                                  </div>
                              )}

                              {editingColumn?.id !== col.id && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${theme.count}`}>
                                    {col.cards.length}
                                </span>
                              )}
                          </div>
                          
                          {!col.isConclusion && (
                              <button 
                                  onClick={() => { if(confirm('Excluir coluna?')) onDeleteColumn(col.id) }} 
                                  className="text-slate-400 hover:text-rose-500 ml-2"
                                  title="Excluir Coluna"
                              >
                                  <X className="w-4 h-4" />
                              </button>
                          )}
                      </div>

                      {/* Cards Area */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                          {col.cards.map(card => {
                              const colorTheme = COLORS.find(c => c.value === card.color) || COLORS[0];
                              return (
                                  <div 
                                      key={card.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, card.id, col.id)}
                                      className={`bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative border-l-4 ${colorTheme.border.replace('border', 'border-l')}`}
                                      style={{ borderLeftColor: `var(--${card.color}-500)` }} // Fallback
                                  >
                                      <div className="flex justify-between items-start">
                                          <p className="font-semibold text-slate-800 dark:text-white text-sm">{card.title}</p>
                                          <button 
                                              onClick={() => handleDeleteCard(col.id, card.id)}
                                              className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <X className="w-3 h-3" />
                                          </button>
                                      </div>
                                      
                                      <div className="mt-2 flex justify-between items-center">
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${colorTheme.bg} ${colorTheme.text}`}>
                                              {card.amount > 0 ? formatValue(card.amount) : 'R$ -'}
                                          </span>
                                          <GripVertical className="w-3 h-3 text-slate-300" />
                                      </div>
                                  </div>
                              );
                          })}
                      </div>

                      {/* Footer / Add Card */}
                      <div className={`p-2 border-t rounded-b-xl bg-white/40 dark:bg-slate-900/20 ${theme.wrapper.split(' ')[2]}`}>
                          {addingCardToColumn === col.id ? (
                              <div className="space-y-2 p-1 animate-scale-in">
                                  <input 
                                      autoFocus
                                      className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                      placeholder="Título..."
                                      value={newCardTitle}
                                      onChange={e => setNewCardTitle(e.target.value)}
                                  />
                                  <div className="flex gap-1">
                                      <input 
                                          type="number" 
                                          className="w-20 p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                          placeholder="R$"
                                          value={newCardAmount}
                                          onChange={e => setNewCardAmount(e.target.value)}
                                      />
                                      <div className="flex-1 flex justify-end gap-1">
                                          {COLORS.map(c => (
                                              <button 
                                                  key={c.value} 
                                                  onClick={() => setNewCardColor(c.value)}
                                                  className={`w-6 h-6 rounded-full border-2 ${newCardColor === c.value ? 'border-slate-500 scale-110' : 'border-transparent'} ${c.bg.split(' ')[0]}`}
                                              ></button>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => setAddingCardToColumn(null)} className="flex-1 py-1 text-xs text-slate-500 bg-slate-200 rounded">Cancelar</button>
                                      <button onClick={() => handleAddCard(col.id)} className={`flex-1 py-1 text-xs text-white rounded font-bold ${theme.addButtonBg}`}>Adicionar</button>
                                  </div>
                              </div>
                          ) : (
                              <button 
                                  onClick={() => setAddingCardToColumn(col.id)}
                                  className={`w-full py-2 flex items-center justify-center gap-1 rounded-lg transition-colors text-sm font-medium ${theme.button}`}
                              >
                                  <Plus className="w-4 h-4" /> Adicionar Card
                              </button>
                          )}
                      </div>
                  </div>
              )})}

          </div>
      </div>
    </div>
  );
};
