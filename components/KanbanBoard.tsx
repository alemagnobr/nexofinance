
import React, { useState, useEffect } from 'react';
import { KanbanColumn, KanbanCard, Transaction, TransactionType, KanbanBoard as IKanbanBoard, KanbanTag, KanbanComment, KanbanAttachment } from '../types';
import { Plus, X, GripVertical, CheckCircle2, MoreHorizontal, Flag, Wallet, Edit2, Sparkles, Layout, Trash2, ChevronDown, Tag, Calendar, MessageSquare, Clock, Send, AlertCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface KanbanBoardProps {
  boards: IKanbanBoard[];
  onSaveBoard: (board: IKanbanBoard) => void;
  onDeleteBoard: (id: string) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  privacyMode: boolean;
}

const COLORS = [
    { label: 'Azul', value: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
    { label: 'Verde', value: 'green', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Roxo', value: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' },
    { label: 'Rosa', value: 'rose', bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300' },
    { label: 'Amarelo', value: 'yellow', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
    { label: 'Cinza', value: 'slate', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300' },
];

const AVAILABLE_TAGS: KanbanTag[] = [
    { id: 'tag-progress', name: 'Em andamento', color: 'blue' },
    { id: 'tag-done', name: 'Concluído', color: 'green' },
    { id: 'tag-pending', name: 'Pendente', color: 'slate' },
    { id: 'tag-urgent', name: 'Urgente', color: 'rose' },
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

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ boards, onSaveBoard, onDeleteBoard, onAddTransaction, privacyMode }) => {
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(null);
  
  // New Card State
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardAmount, setNewCardAmount] = useState('');
  const [newCardColor, setNewCardColor] = useState('blue');

  // Edit Column Title State
  const [editingColumn, setEditingColumn] = useState<{ id: string, title: string } | null>(null);

  // Edit Card Tags State
  const [editingCardTags, setEditingCardTags] = useState<string | null>(null);

  // Card Details State (Date/Comments/Attachments)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');

  // Drag State
  const [draggedCard, setDraggedCard] = useState<{ cardId: string, sourceColId: string } | null>(null);

  // Initialize Active Board
  useEffect(() => {
      if (boards.length > 0 && !activeBoardId) {
          setActiveBoardId(boards[0].id);
      } else if (boards.length === 0 && !activeBoardId) {
          // No boards exist, maybe prompt to create or create default?
          // Let's create a default one if none exist
          const defaultBoard: IKanbanBoard = {
              id: crypto.randomUUID(),
              title: 'Meu Projeto',
              columns: [
                  { id: 'col-1', title: 'Backlog', order: 0, cards: [] },
                  { id: 'col-2', title: 'Em andamento', order: 1, cards: [] },
                  { id: 'col-3', title: 'Em revisão', order: 2, cards: [] },
                  { id: 'col-4', title: 'Concluído', order: 3, isConclusion: true, cards: [] },
              ]
          };
          onSaveBoard(defaultBoard);
          setActiveBoardId(defaultBoard.id);
      }
  }, [boards, activeBoardId]);

  const activeBoard = boards.find(b => b.id === activeBoardId);

  const handleCreateBoard = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBoardTitle.trim()) return;

      const newBoard: IKanbanBoard = {
          id: crypto.randomUUID(),
          title: newBoardTitle,
          columns: [
              { id: crypto.randomUUID(), title: 'Backlog', order: 0, cards: [] },
              { id: crypto.randomUUID(), title: 'Em andamento', order: 1, cards: [] },
              { id: crypto.randomUUID(), title: 'Em revisão', order: 2, cards: [] },
              { id: crypto.randomUUID(), title: 'Concluído', order: 3, isConclusion: true, cards: [] },
          ]
      };
      onSaveBoard(newBoard);
      setActiveBoardId(newBoard.id);
      setNewBoardTitle('');
      setIsCreatingBoard(false);
  };

  const handleDeleteBoard = () => {
      if (!activeBoardId) return;
      if (confirm('Tem certeza que deseja excluir este quadro?')) {
          onDeleteBoard(activeBoardId);
          setActiveBoardId(null); // Will trigger useEffect to select another
      }
  };

  // --- COLUMN ACTIONS (Proxy to Board Save) ---

  const saveColumns = (newColumns: KanbanColumn[]) => {
      if (!activeBoard) return;
      onSaveBoard({ ...activeBoard, columns: newColumns });
  };

  const handleAddColumn = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newColumnTitle.trim() || !activeBoard) return;
      
      const newCol: KanbanColumn = {
          id: crypto.randomUUID(),
          title: newColumnTitle,
          order: activeBoard.columns.length,
          cards: []
      };
      saveColumns([...activeBoard.columns, newCol]);
      setNewColumnTitle('');
  };

  const onDeleteColumn = (colId: string) => {
      if (!activeBoard) return;
      saveColumns(activeBoard.columns.filter(c => c.id !== colId));
  };

  const startEditingColumn = (col: KanbanColumn) => {
      setEditingColumn({ id: col.id, title: col.title });
  };

  const saveColumnTitle = () => {
      if (!editingColumn || !activeBoard) return;
      const newCols = activeBoard.columns.map(c => 
          c.id === editingColumn.id ? { ...c, title: editingColumn.title } : c
      );
      saveColumns(newCols);
      setEditingColumn(null);
  };

  const handleAddCard = (columnId: string) => {
      if (!activeBoard) return;
      const col = activeBoard.columns.find(c => c.id === columnId);
      if (!col) return;

      const newCard: KanbanCard = {
          id: crypto.randomUUID(),
          title: newCardTitle || 'Novo Item',
          amount: parseFloat(newCardAmount) || 0,
          color: newCardColor
      };

      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { ...c, cards: [...c.cards, newCard] } : c
      );
      saveColumns(newCols);

      setAddingCardToColumn(null);
      setNewCardTitle('');
      setNewCardAmount('');
      setNewCardColor('blue');
  };

  const handleToggleTag = (columnId: string, cardId: string, tag: KanbanTag) => {
      if (!activeBoard) return;
      const col = activeBoard.columns.find(c => c.id === columnId);
      if (!col) return;

      const card = col.cards.find(c => c.id === cardId);
      if (!card) return;

      const currentTags = card.tags || [];
      const hasTag = currentTags.some(t => t.id === tag.id);
      
      let newTags;
      if (hasTag) {
          newTags = currentTags.filter(t => t.id !== tag.id);
      } else {
          newTags = [...currentTags, tag];
      }

      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { ...x, tags: newTags } : x) 
          } : c
      );
      saveColumns(newCols);
  };

  const handleSetDueDate = (columnId: string, cardId: string, date: string) => {
      if (!activeBoard) return;
      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { ...x, dueDate: date } : x) 
          } : c
      );
      saveColumns(newCols);
  };

  const handleAddComment = (columnId: string, cardId: string) => {
      if (!activeBoard || !newCommentText.trim()) return;
      
      const newComment: KanbanComment = {
          id: crypto.randomUUID(),
          text: newCommentText,
          createdAt: new Date().toISOString()
      };

      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { ...x, comments: [...(x.comments || []), newComment] } : x) 
          } : c
      );
      saveColumns(newCols);
      setNewCommentText('');
  };

  const handleDeleteComment = (columnId: string, cardId: string, commentId: string) => {
      if (!activeBoard) return;
      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { ...x, comments: (x.comments || []).filter(cm => cm.id !== commentId) } : x) 
          } : c
      );
      saveColumns(newCols);
  };

  const handleAddAttachment = (columnId: string, cardId: string) => {
      if (!activeBoard || !newAttachmentUrl.trim()) return;
      
      const newAttachment: KanbanAttachment = {
          id: crypto.randomUUID(),
          url: newAttachmentUrl,
          name: newAttachmentName || newAttachmentUrl
      };

      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { ...x, attachments: [...(x.attachments || []), newAttachment] } : x) 
          } : c
      );
      saveColumns(newCols);
      setNewAttachmentUrl('');
      setNewAttachmentName('');
  };

  const handleDeleteAttachment = (columnId: string, cardId: string, attachmentId: string) => {
      if (!activeBoard) return;
      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { ...x, attachments: (x.attachments || []).filter(at => at.id !== attachmentId) } : x) 
          } : c
      );
      saveColumns(newCols);
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
      if (!activeBoard) return;
      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { ...c, cards: c.cards.filter(card => card.id !== cardId) } : c
      );
      saveColumns(newCols);
  };

  // --- DRAG AND DROP LOGIC ---

  const handleDragStart = (e: React.DragEvent, cardId: string, sourceColId: string) => {
      setDraggedCard({ cardId, sourceColId });
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
      e.preventDefault();
      if (!draggedCard || !activeBoard) return;

      const { cardId, sourceColId } = draggedCard;
      if (sourceColId === targetColId) {
          setDraggedCard(null);
          return; 
      }

      const sourceCol = activeBoard.columns.find(c => c.id === sourceColId);
      const targetCol = activeBoard.columns.find(c => c.id === targetColId);

      if (sourceCol && targetCol) {
          const card = sourceCol.cards.find(c => c.id === cardId);
          if (card) {
              const newCols = activeBoard.columns.map(c => {
                  if (c.id === sourceColId) {
                      return { ...c, cards: c.cards.filter(x => x.id !== cardId) };
                  }
                  if (c.id === targetColId) {
                      return { ...c, cards: [...c.cards, card] };
                  }
                  return c;
              });
              saveColumns(newCols);
          }
      }
      setDraggedCard(null);
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const sortedColumns = activeBoard ? [...activeBoard.columns].sort((a, b) => a.order - b.order) : [];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      
      {/* HEADER: Title & Global Actions */}
      <div className="flex justify-between items-center mb-4 shrink-0">
          <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Wallet className="w-7 h-7 text-indigo-600" />
                  NEXO Flow
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Organize seus planos: Sonhe, Pesquise, Priorize e Compre.</p>
          </div>

          {activeBoardId && (
              <button 
                  onClick={handleDeleteBoard}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  title="Excluir Quadro Atual"
              >
                  <Trash2 className="w-5 h-5" />
              </button>
          )}
      </div>

      {/* TABS BAR: Projects */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 kanban-scroll">
          {boards.map(b => (
              <button
                  key={b.id}
                  onClick={() => setActiveBoardId(b.id)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                      activeBoardId === b.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                  <Layout className="w-4 h-4" />
                  {b.title}
              </button>
          ))}

          {/* NEW BOARD BUTTON / FORM */}
          {isCreatingBoard ? (
              <form onSubmit={handleCreateBoard} className="flex items-center gap-2 animate-fade-in bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <input 
                      autoFocus
                      type="text" 
                      placeholder="Nome do Projeto..." 
                      value={newBoardTitle}
                      onChange={(e) => setNewBoardTitle(e.target.value)}
                      className="w-40 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <button type="submit" className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                      <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setIsCreatingBoard(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                      <X className="w-4 h-4" />
                  </button>
              </form>
          ) : (
              <button 
                  onClick={() => setIsCreatingBoard(true)}
                  className="px-3 py-2 rounded-xl font-bold text-sm whitespace-nowrap bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
              >
                  <Plus className="w-4 h-4" /> Novo Quadro
              </button>
          )}
      </div>

      {/* TOOLBAR: Add Column */}
      <div className="mb-4">
          <form onSubmit={handleAddColumn} className="flex gap-2">
              <input 
                  type="text" 
                  placeholder="Nova Coluna..." 
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-full md:w-64 shadow-sm"
              />
              <button type="submit" className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm">
                  <Plus className="w-4 h-4" /> Adicionar Coluna
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
                                      {/* Tags Display */}
                                      {card.tags && card.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mb-2">
                                              {card.tags.map(tag => {
                                                  const tagColor = COLORS.find(c => c.value === tag.color) || COLORS[0];
                                                  return (
                                                      <span key={tag.id} className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${tagColor.bg} ${tagColor.text}`}>
                                                          {tag.name}
                                                      </span>
                                                  );
                                              })}
                                          </div>
                                      )}

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
                                          <div className="flex items-center gap-2">
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${colorTheme.bg} ${colorTheme.text}`}>
                                                  {card.amount > 0 ? formatValue(card.amount) : 'R$ -'}
                                              </span>
                                              
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); setEditingCardTags(editingCardTags === card.id ? null : card.id); }}
                                                  className={`p-1 rounded transition-colors ${editingCardTags === card.id ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-300 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                                  title="Adicionar Etiqueta"
                                              >
                                                  <Tag className="w-3 h-3" />
                                              </button>

                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); setExpandedCardId(expandedCardId === card.id ? null : card.id); }}
                                                  className={`p-1 rounded transition-colors ${expandedCardId === card.id ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-300 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                                  title="Detalhes (Data e Comentários)"
                                              >
                                                  <MoreHorizontal className="w-3 h-3" />
                                              </button>
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
                                              {card.dueDate && (
                                                  <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(card.dueDate) < new Date() ? 'text-rose-500' : 'text-slate-400'}`} title="Data de Vencimento">
                                                      <Clock className="w-3 h-3" />
                                                      {new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                  </div>
                                              )}
                                              {card.comments && card.comments.length > 0 && (
                                                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400" title="Comentários">
                                                      <MessageSquare className="w-3 h-3" />
                                                      {card.comments.length}
                                                  </div>
                                              )}
                                              {card.attachments && card.attachments.length > 0 && (
                                                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400" title="Anexos">
                                                      <LinkIcon className="w-3 h-3" />
                                                      {card.attachments.length}
                                                  </div>
                                              )}
                                          </div>
                                      </div>

                                      {/* Inline Tag Selector */}
                                      {editingCardTags === card.id && (
                                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-600 animate-fade-in">
                                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Adicionar Etiqueta:</p>
                                              <div className="flex flex-wrap gap-1.5">
                                                  {AVAILABLE_TAGS.map(tag => {
                                                      const isSelected = card.tags?.some(t => t.id === tag.id);
                                                      const tagColor = COLORS.find(c => c.value === tag.color) || COLORS[0];
                                                      return (
                                                          <button
                                                              key={tag.id}
                                                              onClick={() => handleToggleTag(col.id, card.id, tag)}
                                                              className={`text-[10px] px-2 py-1 rounded border transition-all flex items-center gap-1 ${isSelected ? `${tagColor.bg} ${tagColor.text} ${tagColor.border}` : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}
                                                          >
                                                              {tag.name}
                                                              {isSelected && <CheckCircle2 className="w-2.5 h-2.5" />}
                                                          </button>
                                                      );
                                                  })}
                                              </div>
                                          </div>
                                      )}

                                      {/* Expanded Details (Date & Comments & Attachments) */}
                                      {expandedCardId === card.id && (
                                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-600 animate-fade-in space-y-3">
                                              
                                              {/* Date Picker */}
                                              <div>
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                      <Calendar className="w-3 h-3" /> Data de Vencimento
                                                  </label>
                                                  <input 
                                                      type="date" 
                                                      value={card.dueDate || ''}
                                                      onChange={(e) => handleSetDueDate(col.id, card.id, e.target.value)}
                                                      className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                                  />
                                              </div>

                                              {/* Attachments Section */}
                                              <div>
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                      <LinkIcon className="w-3 h-3" /> Anexos ({card.attachments?.length || 0})
                                                  </label>
                                                  
                                                  {/* Attachment List */}
                                                  <div className="space-y-1 mb-2">
                                                      {card.attachments?.map(att => (
                                                          <div key={att.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-1.5 rounded text-xs group/att">
                                                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline truncate flex-1">
                                                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                                  <span className="truncate">{att.name}</span>
                                                              </a>
                                                              <button 
                                                                  onClick={() => handleDeleteAttachment(col.id, card.id, att.id)}
                                                                  className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/att:opacity-100 transition-opacity p-0.5"
                                                              >
                                                                  <X className="w-3 h-3" />
                                                              </button>
                                                          </div>
                                                      ))}
                                                  </div>

                                                  {/* Add Attachment Inputs */}
                                                  <div className="space-y-1">
                                                      <input 
                                                          type="text" 
                                                          placeholder="Nome do arquivo (opcional)" 
                                                          value={newAttachmentName}
                                                          onChange={(e) => setNewAttachmentName(e.target.value)}
                                                          className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                                      />
                                                      <div className="flex gap-1">
                                                          <input 
                                                              type="text" 
                                                              placeholder="https://..." 
                                                              value={newAttachmentUrl}
                                                              onChange={(e) => setNewAttachmentUrl(e.target.value)}
                                                              className="flex-1 text-xs p-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                                          />
                                                          <button 
                                                              onClick={() => handleAddAttachment(col.id, card.id)}
                                                              disabled={!newAttachmentUrl.trim()}
                                                              className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                          >
                                                              <Plus className="w-3 h-3" />
                                                          </button>
                                                      </div>
                                                  </div>
                                              </div>

                                              {/* Comments Section */}
                                              <div>
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                      <MessageSquare className="w-3 h-3" /> Comentários ({card.comments?.length || 0})
                                                  </label>
                                                  
                                                  {/* Comment List */}
                                                  <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                                                      {card.comments?.map(comment => (
                                                          <div key={comment.id} className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs relative group/comment">
                                                              <p className="text-slate-700 dark:text-slate-300 pr-4 break-words">{comment.text}</p>
                                                              <span className="text-[9px] text-slate-400 mt-1 block">
                                                                  {new Date(comment.createdAt).toLocaleString('pt-BR')}
                                                              </span>
                                                              <button 
                                                                  onClick={() => handleDeleteComment(col.id, card.id, comment.id)}
                                                                  className="absolute top-1 right-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                                              >
                                                                  <X className="w-3 h-3" />
                                                              </button>
                                                          </div>
                                                      ))}
                                                      {(!card.comments || card.comments.length === 0) && (
                                                          <p className="text-xs text-slate-400 italic">Nenhum comentário ainda.</p>
                                                      )}
                                                  </div>

                                                  {/* Add Comment Input */}
                                                  <div className="flex gap-1">
                                                      <input 
                                                          type="text" 
                                                          placeholder="Escreva um comentário..." 
                                                          value={newCommentText}
                                                          onChange={(e) => setNewCommentText(e.target.value)}
                                                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(col.id, card.id)}
                                                          className="flex-1 text-xs p-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                                      />
                                                      <button 
                                                          onClick={() => handleAddComment(col.id, card.id)}
                                                          disabled={!newCommentText.trim()}
                                                          className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                      >
                                                          <Send className="w-3 h-3" />
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      )}
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
