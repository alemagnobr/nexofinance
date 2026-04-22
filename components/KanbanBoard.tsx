
import React, { useState, useEffect } from 'react';
import { KanbanColumn, KanbanCard, Transaction, TransactionType, KanbanBoard as IKanbanBoard, KanbanTag, KanbanComment, KanbanAttachment } from '../types';
import { Plus, X, GripVertical, CheckCircle2, MoreHorizontal, Flag, Wallet, Edit2, Sparkles, Layout, Trash2, ChevronDown, ChevronLeft, ChevronRight, Tag, Calendar, MessageSquare, Clock, Send, AlertCircle, Link as LinkIcon, ExternalLink, ArrowUp, ArrowDown, GripHorizontal, AlignLeft, CheckSquare } from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';

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

  // Edit Card Details State (Title/Amount)
  const [editingCard, setEditingCard] = useState<{ id: string, title: string, amount: string } | null>(null);

  // Card Details State (Date/Comments/Attachments)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');

  // Drag State
  const [draggedCard, setDraggedCard] = useState<{ cardId: string, sourceColId: string } | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Initialize Active Board
  useEffect(() => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
      
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

  const activeExpandedData = (() => {
      if (!activeBoard || !expandedCardId) return null;
      for (const col of activeBoard.columns) {
          const card = col.cards.find(c => c.id === expandedCardId);
          if (card) return { col, card };
      }
      return null;
  })();

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

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = (columnId: string, cardId: string) => {
      if (!activeBoard || !newSubtaskTitle.trim()) return;
      
      const newSubtask = {
          id: crypto.randomUUID(),
          title: newSubtaskTitle.trim(),
          completed: false
      };

      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { ...x, subtasks: [...(x.subtasks || []), newSubtask] } : x) 
          } : c
      );
      saveColumns(newCols);
      setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (columnId: string, cardId: string, subtaskId: string) => {
      if (!activeBoard) return;
      
      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { 
                  ...x, 
                  subtasks: (x.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
              } : x) 
          } : c
      );
      saveColumns(newCols);
  };

  const handleDeleteSubtask = (columnId: string, cardId: string, subtaskId: string) => {
      if (!activeBoard) return;
      
      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { 
                  ...x, 
                  subtasks: (x.subtasks || []).filter(s => s.id !== subtaskId)
              } : x) 
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

  const handleSaveCardDescription = (columnId: string, cardId: string, description: string) => {
      if (!activeBoard) return;
      
      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === cardId ? { 
                  ...x, 
                  description
              } : x) 
          } : c
      );
      saveColumns(newCols);
  };

  const handleSaveCardEdit = (columnId: string) => {
      if (!activeBoard || !editingCard) return;
      
      const newCols = activeBoard.columns.map(c => 
          c.id === columnId ? { 
              ...c, 
              cards: c.cards.map(x => x.id === editingCard.id ? { 
                  ...x, 
                  title: editingCard.title, 
                  amount: parseFloat(editingCard.amount.replace(',', '.')) || 0 
              } : x) 
          } : c
      );
      saveColumns(newCols);
      setEditingCard(null);
  };

  const handleMoveCardUp = (colId: string, cardId: string) => {
      if (!activeBoard) return;
      const col = activeBoard.columns.find(c => c.id === colId);
      if (!col) return;
      
      const cardIndex = col.cards.findIndex(c => c.id === cardId);
      if (cardIndex <= 0) return; // Already at top
      
      const newCards = [...col.cards];
      const temp = newCards[cardIndex];
      newCards[cardIndex] = newCards[cardIndex - 1];
      newCards[cardIndex - 1] = temp;
      
      const newCols = activeBoard.columns.map(c => 
          c.id === colId ? { ...c, cards: newCards } : c
      );
      saveColumns(newCols);
  };

  const handleMoveCardDown = (colId: string, cardId: string) => {
      if (!activeBoard) return;
      const col = activeBoard.columns.find(c => c.id === colId);
      if (!col) return;
      
      const cardIndex = col.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1 || cardIndex >= col.cards.length - 1) return; // Already at bottom
      
      const newCards = [...col.cards];
      const temp = newCards[cardIndex];
      newCards[cardIndex] = newCards[cardIndex + 1];
      newCards[cardIndex + 1] = temp;
      
      const newCols = activeBoard.columns.map(c => 
          c.id === colId ? { ...c, cards: newCards } : c
      );
      saveColumns(newCols);
  };

  const handleMoveCardFallback = (sourceColId: string, targetColId: string, cardId: string) => {
      if (!activeBoard || sourceColId === targetColId) return;

      const sourceCol = activeBoard.columns.find(c => c.id === sourceColId);
      const targetCol = activeBoard.columns.find(c => c.id === targetColId);
      if (!sourceCol || !targetCol) return;

      const cardToMove = sourceCol.cards.find(c => c.id === cardId);
      if (!cardToMove) return;

      const newCols = activeBoard.columns.map(c => {
          if (c.id === sourceColId) {
              return { ...c, cards: c.cards.filter(card => card.id !== cardId) };
          }
          if (c.id === targetColId) {
              return { ...c, cards: [cardToMove, ...c.cards] };
          }
          return c;
      });

      saveColumns(newCols);
      setExpandedCardId(null); // Close details after moving
  };

  // --- DRAG AND DROP LOGIC ---

  const handleMoveColumnLeft = (colId: string) => {
      if (!activeBoard) return;
      const sorted = [...activeBoard.columns].sort((a,b) => a.order - b.order);
      const index = sorted.findIndex(c => c.id === colId);
      if (index > 0) {
          const temp = sorted[index];
          sorted[index] = sorted[index - 1];
          sorted[index - 1] = temp;
          
          const updatedCols = sorted.map((c, idx) => ({ ...c, order: idx }));
          saveColumns(updatedCols);
      }
  };

  const handleMoveColumnRight = (colId: string) => {
      if (!activeBoard) return;
      const sorted = [...activeBoard.columns].sort((a,b) => a.order - b.order);
      const index = sorted.findIndex(c => c.id === colId);
      if (index !== -1 && index < sorted.length - 1) {
          const temp = sorted[index];
          sorted[index] = sorted[index + 1];
          sorted[index + 1] = temp;
          
          const updatedCols = sorted.map((c, idx) => ({ ...c, order: idx }));
          saveColumns(updatedCols);
      }
  };

  const handleColDragStart = (e: React.DragEvent, colId: string) => {
      // Allow only column dragging if no card is being dragged
      if (draggedCard) {
          e.preventDefault();
          return;
      }
      setDraggedColumnId(colId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDragEnd = (e: React.DragEvent) => {
      setDraggedColumnId(null);
  };

  const handleColDrop = (e: React.DragEvent, targetColId: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (draggedCard) {
          handleDrop(e, targetColId);
          return;
      }

      if (!draggedColumnId || draggedColumnId === targetColId || !activeBoard) return;

      const newCols = [...activeBoard.columns].sort((a,b) => a.order - b.order);
      const sourceIdx = newCols.findIndex(c => c.id === draggedColumnId);
      const targetIdx = newCols.findIndex(c => c.id === targetColId);

      if (sourceIdx !== -1 && targetIdx !== -1) {
          const [movedCol] = newCols.splice(sourceIdx, 1);
          newCols.splice(targetIdx, 0, movedCol);
          
          const updatedCols = newCols.map((c, idx) => ({ ...c, order: idx }));
          saveColumns(updatedCols);
      }
      setDraggedColumnId(null);
  };

  const handleDragStart = (e: React.DragEvent, cardId: string, sourceColId: string) => {
      e.stopPropagation();
      setDraggedCard({ cardId, sourceColId });
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
      setDraggedCard(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColId: string, targetCardId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!draggedCard || !activeBoard) return;

      const { cardId, sourceColId } = draggedCard;
      if (cardId === targetCardId) {
          setDraggedCard(null);
          return;
      }

      const sourceCol = activeBoard.columns.find(c => c.id === sourceColId);
      const targetCol = activeBoard.columns.find(c => c.id === targetColId);

      if (sourceCol && targetCol) {
          const card = sourceCol.cards.find(c => c.id === cardId);
          if (card) {
              const newCols = activeBoard.columns.map(c => {
                  if (c.id === sourceColId && sourceColId !== targetColId) {
                      return { ...c, cards: c.cards.filter(x => x.id !== cardId) };
                  }
                  if (c.id === targetColId) {
                      let newCards = [...c.cards];
                      
                      if (sourceColId === targetColId) {
                          // Reordering within the same column
                          const sourceIndex = newCards.findIndex(x => x.id === cardId);
                          newCards.splice(sourceIndex, 1);
                          
                          if (targetCardId) {
                              const targetIndex = newCards.findIndex(x => x.id === targetCardId);
                              // If targetCardId is not found (shouldn't happen), append to end
                              const insertIndex = targetIndex !== -1 ? targetIndex : newCards.length;
                              
                              // Determine if we should insert before or after based on mouse position
                              // For simplicity, we'll just insert at the target index (which shifts it down)
                              // A more advanced implementation would check e.clientY vs element bounding box
                              const rect = (e.target as HTMLElement).closest('.group')?.getBoundingClientRect();
                              const isAfter = rect ? e.clientY > rect.top + rect.height / 2 : false;
                              
                              newCards.splice(isAfter ? insertIndex + 1 : insertIndex, 0, card);
                          } else {
                              // Dropped on the column itself, append to end
                              newCards.push(card);
                          }
                      } else {
                          // Moving to a new column
                          if (targetCardId) {
                              const targetIndex = newCards.findIndex(x => x.id === targetCardId);
                              const insertIndex = targetIndex !== -1 ? targetIndex : newCards.length;
                              
                              const rect = (e.target as HTMLElement).closest('.group')?.getBoundingClientRect();
                              const isAfter = rect ? e.clientY > rect.top + rect.height / 2 : false;
                              
                              newCards.splice(isAfter ? insertIndex + 1 : insertIndex, 0, card);
                          } else {
                              // Dropped on the column itself, prepend to top
                              newCards.unshift(card);
                          }
                      }
                      return { ...c, cards: newCards };
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
                      draggable={!isTouchDevice && editingColumn?.id !== col.id}
                      onDragStart={(e) => handleColDragStart(e, col.id)}
                      onDragEnd={handleColDragEnd}
                      className={`w-72 flex flex-col rounded-xl border backdrop-blur-sm transition-colors ${theme.wrapper} ${draggedCard && draggedCard.sourceColId !== col.id ? 'opacity-50 border-dashed' : 'shadow-sm'} ${draggedColumnId === col.id ? 'opacity-30 border-dashed' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleColDrop(e, col.id)}
                  >
                      {/* Column Header */}
                      <div className={`p-3 border-b flex justify-between items-center group/header rounded-t-xl ${theme.header} ${theme.wrapper.split(' ')[2]} ${!isTouchDevice ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                              <GripHorizontal className="w-4 h-4 text-slate-400 opacity-50 hover:opacity-100 flex-shrink-0 cursor-grab" />
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
                                          className="opacity-100 md:opacity-0 md:group-hover/header:opacity-100 transition-opacity p-1 text-slate-400 hover:text-indigo-500"
                                      >
                                          <Edit2 className="w-3 h-3" />
                                      </button>
                                  </div>
                              )}

                              {editingColumn?.id !== col.id && (() => {
                                  const columnTotal = col.cards.reduce((sum, card) => sum + (card.amount || 0), 0);
                                  return (
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                          {columnTotal > 0 && (
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${theme.count}`}>
                                                  {formatValue(columnTotal)}
                                              </span>
                                          )}
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${theme.count}`} title="Quantidade de cards">
                                              {col.cards.length}
                                          </span>
                                      </div>
                                  );
                              })()}
                          </div>
                          
                          <div className="flex items-center">
                              {index > 0 && (
                                  <button 
                                      onClick={() => handleMoveColumnLeft(col.id)} 
                                      className="text-slate-400 hover:text-indigo-500 mx-0.5 md:opacity-0 md:group-hover/header:opacity-100 transition-opacity bg-white/50 dark:bg-slate-800/50 rounded p-1"
                                      title="Mover para esquerda"
                                  >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                              )}
                              {index < sortedColumns.length - 1 && (
                                  <button 
                                      onClick={() => handleMoveColumnRight(col.id)} 
                                      className="text-slate-400 hover:text-indigo-500 mx-0.5 md:opacity-0 md:group-hover/header:opacity-100 transition-opacity bg-white/50 dark:bg-slate-800/50 rounded p-1"
                                      title="Mover para direita"
                                  >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                              )}
                              {!col.isConclusion && (
                                  <button 
                                      onClick={() => { if(confirm('Excluir coluna?')) onDeleteColumn(col.id) }} 
                                      className="text-slate-400 hover:text-rose-500 ml-1 md:opacity-0 md:group-hover/header:opacity-100 transition-opacity p-1"
                                      title="Excluir Coluna"
                                  >
                                      <X className="w-4 h-4" />
                                  </button>
                              )}
                          </div>
                      </div>

                      {/* Cards Area */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                          {col.cards.map(card => {
                              const colorTheme = COLORS.find(c => c.value === card.color) || COLORS[0];
                              return (
                                  <div 
                                      key={card.id}
                                      draggable={!isTouchDevice}
                                      onDragStart={(e) => handleDragStart(e, card.id, col.id)}
                                      onDragEnd={handleDragEnd}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, col.id, card.id)}
                                      onContextMenu={(e) => e.preventDefault()}
                                      onClick={() => setExpandedCardId(card.id)}
                                      className={`bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 ${!isTouchDevice ? 'cursor-grab active:cursor-grabbing' : ''} hover:shadow-md transition-all group relative border-l-4 select-none [-webkit-touch-callout:none] hover:border-r-indigo-500 ${colorTheme.border.replace('border', 'border-l')}`}
                                      style={{ borderLeftColor: `var(--${card.color}-500)` }} // Fallback
                                  >
                                      {editingCard?.id === card.id ? (
                                          <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                              <input 
                                                  autoFocus
                                                  type="text" 
                                                  value={editingCard.title}
                                                  onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                                                  className="w-full text-sm p-1.5 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                                  placeholder="Título"
                                              />
                                              <CurrencyInput 
                                                  value={editingCard.amount}
                                                  onChangeValue={(val) => setEditingCard({ ...editingCard, amount: val })}
                                                  className="w-full text-sm p-1.5 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                                  placeholder="Valor (R$)"
                                              />
                                              <div className="flex justify-end gap-2 mt-2">
                                                  <button 
                                                      onClick={() => setEditingCard(null)}
                                                      className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                  >
                                                      Cancelar
                                                  </button>
                                                  <button 
                                                      onClick={() => handleSaveCardEdit(col.id)}
                                                      className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                                                  >
                                                      Salvar
                                                  </button>
                                              </div>
                                          </div>
                                      ) : (
                                          <>
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
                                                  <p className="font-semibold text-slate-800 dark:text-white text-sm pr-2">{card.title}</p>
                                                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                                      <button 
                                                          onClick={(e) => { e.stopPropagation(); handleMoveCardUp(col.id, card.id); }}
                                                          className="text-slate-400 hover:text-indigo-500 p-0.5"
                                                          title="Mover para cima"
                                                      >
                                                          <ArrowUp className="w-3 h-3" />
                                                      </button>
                                                      <button 
                                                          onClick={(e) => { e.stopPropagation(); handleMoveCardDown(col.id, card.id); }}
                                                          className="text-slate-400 hover:text-indigo-500 p-0.5"
                                                          title="Mover para baixo"
                                                      >
                                                          <ArrowDown className="w-3 h-3" />
                                                      </button>
                                                      <button 
                                                          onClick={(e) => { e.stopPropagation(); setEditingCard({ id: card.id, title: card.title, amount: card.amount.toString() }); }}
                                                          className="text-slate-400 hover:text-indigo-500 p-0.5"
                                                          title="Editar Titulo do Card"
                                                      >
                                                          <Edit2 className="w-3 h-3" />
                                                      </button>
                                                      <button 
                                                          onClick={(e) => { e.stopPropagation(); handleDeleteCard(col.id, card.id); }}
                                                          className="text-slate-400 hover:text-rose-500 p-0.5"
                                                          title="Excluir Card"
                                                      >
                                                          <X className="w-3 h-3" />
                                                      </button>
                                                  </div>
                                              </div>
                                              
                                              <div className="mt-2 flex justify-between items-center">
                                                  <div className="flex items-center gap-2">
                                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${colorTheme.bg} ${colorTheme.text}`}>
                                                          {card.amount > 0 ? formatValue(card.amount) : 'R$ -'}
                                                      </span>
                                                      
                                                      <button 
                                                          onClick={(e) => { e.stopPropagation(); setExpandedCardId(card.id); setTimeout(() => setEditingCardTags(card.id), 50); }}
                                                          className="p-1 rounded transition-colors text-slate-300 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-600"
                                                          title="Adicionar Etiqueta"
                                                      >
                                                          <Tag className="w-3 h-3" />
                                                      </button>

                                                      <button 
                                                          onClick={(e) => { e.stopPropagation(); setExpandedCardId(expandedCardId === card.id ? null : card.id); }}
                                                          className={`p-1 rounded transition-colors ${expandedCardId === card.id ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-300 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                                          title="Detalhes"
                                                      >
                                                          <MoreHorizontal className="w-3 h-3" />
                                                      </button>
                                                  </div>
                                                  
                                                  <div className="flex items-center gap-2">
                                                      {card.subtasks && card.subtasks.length > 0 && (
                                                          <div className={`flex items-center gap-1 text-[10px] font-medium ${card.subtasks.filter(s => s.completed).length === card.subtasks.length ? 'text-emerald-500' : 'text-slate-400'}`} title="Tarefas">
                                                              <CheckCircle2 className="w-3 h-3" />
                                                              {card.subtasks.filter(s => s.completed).length}/{card.subtasks.length}
                                                          </div>
                                                      )}
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

                                              {/* Move to Column (Always Visible) */}
                                              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-600">
                                                  <select 
                                                      value={col.id}
                                                      onChange={(e) => handleMoveCardFallback(col.id, e.target.value, card.id)}
                                                      className="w-full text-[10px] p-1 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 outline-none focus:border-indigo-500 cursor-pointer"
                                                  >
                                                      {activeBoard?.columns.map(c => (
                                                          <option key={c.id} value={c.id} disabled={c.id === col.id}>
                                                              {c.id === col.id ? `Mover para...` : c.title}
                                                          </option>
                                                      ))}
                                                  </select>
                                              </div>
                                          </>
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
                                      <CurrencyInput 
                                          className="w-20 p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                          placeholder="R$"
                                          value={newCardAmount}
                                          onChangeValue={val => setNewCardAmount(val)}
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

      {/* Trello-like Card Modal */}
      {activeExpandedData && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 py-10 md:p-10 overflow-y-auto" onClick={() => setExpandedCardId(null)}>
              <div 
                  className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl my-auto shadow-2xl relative animate-scale-in"
                  onClick={e => e.stopPropagation()}
              >
                  {/* Header */}
                  <div className="p-6 pb-4 md:px-8 md:pt-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-t-xl border-b border-slate-100 dark:border-slate-800">
                      <button onClick={() => setExpandedCardId(null)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 shadow-sm">
                          <X className="w-5 h-5" />
                      </button>

                      <div className="flex items-start gap-4">
                          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${COLORS.find(c => c.value === activeExpandedData.card.color)?.border || ''} ${COLORS.find(c => c.value === activeExpandedData.card.color)?.bg || ''}`}>
                              <Layout className="w-4 h-4" />
                          </div>
                          <div className="flex-1 pr-8">
                              {editingCard?.id === activeExpandedData.card.id ? (
                                  <input 
                                      autoFocus 
                                      className="w-full text-xl font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-white p-1 rounded-lg border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900 outline-none transition-all"
                                      value={editingCard.title} 
                                      onChange={e => setEditingCard({...editingCard, title: e.target.value})} 
                                      onBlur={() => handleSaveCardEdit(activeExpandedData.col.id)} 
                                      onKeyDown={e => e.key === 'Enter' && handleSaveCardEdit(activeExpandedData.col.id)}
                                  />
                              ) : (
                                  <h2 onClick={() => setEditingCard({ id: activeExpandedData.card.id, title: activeExpandedData.card.title, amount: activeExpandedData.card.amount.toString() })} className="text-xl font-black text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 p-1 -ml-1 rounded cursor-pointer transition-colors max-w-fit">{activeExpandedData.card.title}</h2>
                              )}
                              
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 ml-1">
                                  Na lista <span className="font-semibold underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 cursor-pointer">{activeExpandedData.col.title}</span>
                              </p>
                          </div>
                      </div>

                      {/* Action Buttons (Horizontal) */}
                      <div className="flex flex-wrap gap-2 mt-5 ml-12">
                          <button 
                              onClick={() => setEditingCardTags(editingCardTags === activeExpandedData.card.id ? null : activeExpandedData.card.id)} 
                              className={`px-3 py-1.5 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors ${editingCardTags === activeExpandedData.card.id ? 'bg-indigo-100 text-indigo-700 shadow-inner dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                          >
                              <Tag className="w-3.5 h-3.5" /> Etiquetas
                          </button>
                          
                          <div className="relative group/date">
                              <button className="px-3 py-1.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors">
                                  <Clock className="w-3.5 h-3.5" /> Datas
                              </button>
                              <input 
                                  type="date" 
                                  value={activeExpandedData.card.dueDate || ''}
                                  onChange={(e) => handleSetDueDate(activeExpandedData.col.id, activeExpandedData.card.id, e.target.value)}
                                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                              />
                          </div>

                          <button 
                              onClick={() => {
                                  const input = document.getElementById('subtask-input');
                                  input?.focus();
                              }}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors"
                          >
                              <CheckSquare className="w-3.5 h-3.5" /> Checklist
                          </button>

                          <button 
                              onClick={() => {
                                  const input = document.getElementById('attachment-input');
                                  input?.focus();
                              }}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors"
                          >
                              <LinkIcon className="w-3.5 h-3.5" /> Anexos
                          </button>
                      </div>

                      {/* Expanding Inline Tag Selector */}
                      {editingCardTags === activeExpandedData.card.id && (
                          <div className="mt-4 ml-12 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in relative">
                              <span className="absolute -top-2 left-6 w-4 h-4 bg-white dark:bg-slate-800 border-t border-l border-slate-200 dark:border-slate-700 rotate-45"></span>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 relative z-10">Adicionar Etiqueta</p>
                              <div className="flex flex-wrap gap-2 relative z-10">
                                  {AVAILABLE_TAGS.map(tag => {
                                      const isSelected = activeExpandedData.card.tags?.some(t => t.id === tag.id);
                                      const tagColor = COLORS.find(c => c.value === tag.color) || COLORS[0];
                                      return (
                                          <button
                                              key={tag.id}
                                              onClick={() => handleToggleTag(activeExpandedData.col.id, activeExpandedData.card.id, tag)}
                                              className={`text-xs px-3 py-1.5 rounded font-medium border transition-all flex items-center gap-2 ${isSelected ? `${tagColor.bg} ${tagColor.text} ${tagColor.border} shadow-sm ring-2 ring-offset-1 ring-${tagColor.value}-500/30` : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'}`}
                                          >
                                              {tag.name}
                                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 md:p-8 space-y-10">
                      
                      {/* Tags (if any exist) */}
                      {activeExpandedData.card.tags && activeExpandedData.card.tags.length > 0 && (
                          <div className="ml-12 flex flex-wrap gap-2">
                              {activeExpandedData.card.tags.map(tag => {
                                  const tagColor = COLORS.find(c => c.value === tag.color) || COLORS[0];
                                  return (
                                      <span key={tag.id} className={`text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider ${tagColor.bg} ${tagColor.text}`}>
                                          {tag.name}
                                      </span>
                                  );
                              })}
                          </div>
                      )}

                      {/* Description */}
                      <div className="flex items-start gap-4">
                          <AlignLeft className="w-6 h-6 text-slate-400 mt-1" />
                          <div className="flex-1">
                              <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-lg">Descrição</h3>
                              <textarea 
                                  className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 p-4 rounded-xl border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors outline-none resize-y min-h-[140px] text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                                  placeholder="Adicione uma descrição mais detalhada..."
                                  value={activeExpandedData.card.description || ''}
                                  onChange={(e) => handleSaveCardDescription(activeExpandedData.col.id, activeExpandedData.card.id, e.target.value)}
                              />
                          </div>
                      </div>

                      {/* Subtasks */}
                      <div className="flex items-start gap-4">
                          <CheckSquare className="w-6 h-6 text-slate-400 mt-1" />
                          <div className="flex-1 w-full overflow-hidden">
                              <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">Checklist</h3>
                                  <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                      {activeExpandedData.card.subtasks?.filter(s => s.completed).length || 0}/{activeExpandedData.card.subtasks?.length || 0}
                                  </span>
                              </div>

                              {/* Progress bar */}
                              {activeExpandedData.card.subtasks && activeExpandedData.card.subtasks.length > 0 && (
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-5 overflow-hidden">
                                      <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(activeExpandedData.card.subtasks.filter(s => s.completed).length / activeExpandedData.card.subtasks.length) * 100}%` }}></div>
                                  </div>
                              )}
                              
                              <div className="space-y-1.5 mb-4">
                                  {activeExpandedData.card.subtasks?.map(subtask => (
                                      <div key={subtask.id} className="flex items-start gap-3 group/subtask transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30 p-2 -mx-2 rounded-lg">
                                          <input 
                                              type="checkbox" 
                                              checked={subtask.completed}
                                              onChange={() => handleToggleSubtask(activeExpandedData.col.id, activeExpandedData.card.id, subtask.id)}
                                              className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                          />
                                          <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                              {subtask.title}
                                          </span>
                                          <button 
                                              onClick={() => handleDeleteSubtask(activeExpandedData.col.id, activeExpandedData.card.id, subtask.id)}
                                              className="text-slate-400 hover:text-rose-500 opacity-100 md:opacity-0 md:group-hover/subtask:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                              title="Excluir"
                                          >
                                              <X className="w-4 h-4" />
                                          </button>
                                      </div>
                                  ))}
                              </div>

                              <div className="flex gap-2">
                                  <input 
                                      id="subtask-input"
                                      type="text" 
                                      placeholder="Adicionar um item..." 
                                      value={newSubtaskTitle}
                                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(activeExpandedData.col.id, activeExpandedData.card.id)}
                                      className="flex-1 text-sm px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all placeholder:text-slate-400"
                                  />
                                  <button 
                                      onClick={() => handleAddSubtask(activeExpandedData.col.id, activeExpandedData.card.id)}
                                      disabled={!newSubtaskTitle.trim()}
                                      className="bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded hover:bg-indigo-600 hover:text-white dark:hover:text-white disabled:opacity-50 font-semibold text-sm transition-colors"
                                  >
                                      Adicionar
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* Attachments Section */}
                      <div className="flex items-start gap-4">
                          <LinkIcon className="w-6 h-6 text-slate-400 mt-1" />
                          <div className="flex-1 w-full overflow-hidden">
                              <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">Anexos</h3>
                                  <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                      {activeExpandedData.card.attachments?.length || 0}
                                  </span>
                              </div>
                              
                              {/* Attachment List */}
                              {activeExpandedData.card.attachments && activeExpandedData.card.attachments.length > 0 && (
                                  <div className="grid gap-2 mb-4">
                                      {activeExpandedData.card.attachments.map(att => (
                                          <div key={att.id} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 p-3 rounded-lg text-sm group/att transition-colors border border-slate-100 dark:border-slate-800">
                                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium truncate flex-1 leading-none">
                                                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                                                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                                  </div>
                                                  <span className="truncate">{att.name}</span>
                                              </a>
                                              <button 
                                                  onClick={() => handleDeleteAttachment(activeExpandedData.col.id, activeExpandedData.card.id, att.id)}
                                                  className="text-slate-400 hover:text-rose-500 opacity-100 md:opacity-0 md:group-hover/att:opacity-100 transition-opacity p-2 rounded hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {/* Add Attachment Inputs */}
                              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800">
                                  <input 
                                      id="attachment-input"
                                      type="text" 
                                      placeholder="Nome do arquivo ou link (ex: Orçamento.pdf)" 
                                      value={newAttachmentName}
                                      onChange={(e) => setNewAttachmentName(e.target.value)}
                                      className="w-full text-sm px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                                  />
                                  <div className="flex gap-2">
                                      <input 
                                          type="url" 
                                          placeholder="https://..." 
                                          value={newAttachmentUrl}
                                          onChange={(e) => setNewAttachmentUrl(e.target.value)}
                                          className="flex-1 text-sm px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                                      />
                                      <button 
                                          onClick={() => handleAddAttachment(activeExpandedData.col.id, activeExpandedData.card.id)}
                                          disabled={!newAttachmentUrl.trim()}
                                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold text-sm transition-colors"
                                      >
                                          Anexar
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Comments Section */}
                      <div className="flex items-start gap-4">
                          <MessageSquare className="w-6 h-6 text-slate-400 mt-1" />
                          <div className="flex-1 w-full overflow-hidden">
                              <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4">Atividades & Comentários</h3>
                              
                              {/* Add Comment Input */}
                              <div className="flex gap-3 mb-6 relative">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 flex-shrink-0">
                                      eu
                                  </div>
                                  <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-sm">
                                      <textarea 
                                          placeholder="Escreva um comentário..." 
                                          value={newCommentText}
                                          onChange={(e) => setNewCommentText(e.target.value)}
                                          onKeyDown={(e) => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                  e.preventDefault();
                                                  handleAddComment(activeExpandedData.col.id, activeExpandedData.card.id);
                                              }
                                          }}
                                          className="w-full text-sm p-3 min-h-[80px] bg-transparent text-slate-800 dark:text-white outline-none resize-y placeholder:text-slate-400"
                                      />
                                      <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                          <button 
                                              onClick={() => handleAddComment(activeExpandedData.col.id, activeExpandedData.card.id)}
                                              disabled={!newCommentText.trim()}
                                              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold text-sm transition-colors"
                                          >
                                              Salvar
                                          </button>
                                      </div>
                                  </div>
                              </div>

                              {/* Comment List */}
                              <div className="space-y-4">
                                  {activeExpandedData.card.comments?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(comment => (
                                      <div key={comment.id} className="flex gap-3 group/comment animate-fade-in relative">
                                          {/* Timeline line */}
                                          <div className="absolute top-8 left-4 w-px h-full bg-slate-200 dark:bg-slate-700 -z-10 group-last/comment:hidden"></div>
                                          
                                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 flex-shrink-0 relative z-10 border-2 border-white dark:border-slate-900">
                                              :)
                                          </div>
                                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl rounded-tl-none border border-slate-200 dark:border-slate-800">
                                              <div className="flex justify-between items-baseline mb-1">
                                                  <span className="font-bold text-sm text-slate-800 dark:text-white">Usuário</span>
                                                  <span className="text-[11px] text-slate-500 font-medium">
                                                      {new Date(comment.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                  </span>
                                              </div>
                                              <p className="text-slate-700 dark:text-slate-300 text-sm break-words whitespace-pre-wrap">{comment.text}</p>
                                              <button 
                                                  onClick={() => handleDeleteComment(activeExpandedData.col.id, activeExpandedData.card.id, comment.id)}
                                                  className="absolute top-3 right-0 -mr-2 text-slate-400 hover:text-rose-500 opacity-0 md:group-hover/comment:opacity-100 transition-opacity bg-white dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-700 shadow-sm"
                                                  title="Excluir"
                                              >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                                  {(!activeExpandedData.card.comments || activeExpandedData.card.comments.length === 0) && (
                                      <p className="text-sm text-slate-500 text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                          Nenhuma atividade recente.
                                      </p>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
