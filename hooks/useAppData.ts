
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { AppData, Transaction, Investment, Budget, Debt, ShoppingItem, TransactionStatus, WealthProfile, KanbanColumn, KanbanBoard, Note, Category } from '../types';
import { 
  addTransactionFire, updateTransactionFire, deleteTransactionFire,
  addInvestmentFire, updateInvestmentFire, deleteInvestmentFire,
  addBudgetFire, deleteBudgetFire, updateBudgetFire,
  addDebtFire, updateDebtFire, deleteDebtFire,
  addShoppingItemFire, updateShoppingItemFire, deleteShoppingItemFire, clearShoppingListFire, updateShoppingBudgetFire,
  saveKanbanColumnFire, deleteKanbanColumnFire, saveKanbanBoardFire, deleteKanbanBoardFire,
  addNoteFire, updateNoteFire, deleteNoteFire,
  addCategoryFire, deleteCategoryFire,
  unlockBadgeFire, saveWealthProfileFire, subscribeToData, recalculateBalanceFire,
  DEFAULT_CATEGORIES
} from '../services/storageService';
import { deleteCalendarEvent, updateCalendarEvent } from '../services/calendarService';

const DEFAULT_DATA: AppData = {
    transactions: [],
    investments: [],
    budgets: [],
    debts: [],
    shoppingList: [],
    shoppingBudget: 0,
    kanbanColumns: [],
    kanbanBoards: [],
    notes: [],
    unlockedBadges: [],
    walletBalance: 0,
    categories: DEFAULT_CATEGORIES // Initial defaults
};

export const useAppData = (user: User | null, isGuest: boolean) => {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);

  // Sincronização com Firestore
  useEffect(() => {
    if (user && !isGuest) {
        const unsub = subscribeToData(user.uid, (newData) => {
            setData(prev => ({ ...prev, ...newData }));
        });
        return () => unsub();
    }
  }, [user, isGuest]);

  // Migração de Saldo (One-time check)
  useEffect(() => {
      if (user && !isGuest && data.transactions.length > 0 && data.walletBalance === undefined) {
          // Se carregou transações mas não tem saldo salvo, recalcula no banco
          console.log("Migrando para sistema de Saldo Otimizado...");
          recalculateBalanceFire(user.uid);
      }
  }, [user, isGuest, data.transactions.length, data.walletBalance]);

  // Processamento de Lançamento Automático (Auto Pay)
  useEffect(() => {
      if (user || isGuest) {
          const processAutoPay = async () => {
              // Obtém a data local no formato YYYY-MM-DD
              const d = new Date();
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const todayLocal = `${year}-${month}-${day}`;

              const toPay = data.transactions.filter(t => 
                  t.status === 'pending' && 
                  t.autoPay && 
                  t.date <= todayLocal
              );

              if (toPay.length > 0) {
                  if (user) {
                      for (const t of toPay) {
                          await updateTransactionFire(user.uid, t.id, { status: 'paid' });
                      }
                  } else {
                      setData(prev => ({
                          ...prev,
                          transactions: prev.transactions.map(t => 
                              (t.status === 'pending' && t.autoPay && t.date <= todayLocal)
                              ? { ...t, status: 'paid' }
                              : t
                          )
                      }));
                  }
              }
          };
          
          // Delay curto para garantir que os dados iniciais foram carregados
          const timer = setTimeout(processAutoPay, 2000);
          return () => clearTimeout(timer);
      }
  }, [user, isGuest, data.transactions]);

  // Processamento de Transações Recorrentes
  useEffect(() => {
    if (user || isGuest) {
        const processRecurring = async () => {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            const recurringTemplates = new Map<string, Transaction>();
            
            data.transactions.forEach(t => {
                if (t.isRecurring) {
                    const existing = recurringTemplates.get(t.description);
                    if (!existing || new Date(t.date) > new Date(existing.date)) {
                        recurringTemplates.set(t.description, t);
                    }
                }
            });

            const newTransactions: Transaction[] = [];

            recurringTemplates.forEach((template, description) => {
                // CORREÇÃO: Verifica se a data de início da recorrência é futura em relação ao mês atual
                const [tStartYear, tStartMonth] = template.date.split('-').map(Number);
                
                // Cria datas comparáveis (Dia 1 de cada mês para ignorar o dia específico)
                const processingMonthDate = new Date(currentYear, currentMonth, 1);
                const recurrenceStartDate = new Date(tStartYear, tStartMonth - 1, 1);

                // Se o mês atual é anterior ao mês de início da transação, ignora
                if (processingMonthDate < recurrenceStartDate) {
                    return;
                }

                const existsInCurrentMonth = data.transactions.some(t => {
                    const tDate = new Date(t.date);
                    return t.description === description &&
                          t.amount === template.amount &&
                          tDate.getMonth() === currentMonth &&
                          tDate.getFullYear() === currentYear;
                });

                if (!existsInCurrentMonth) {
                    const tDate = new Date(template.date + 'T00:00:00'); // Garante leitura correta da data local
                    const targetDay = tDate.getDate();
                    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const finalDay = Math.min(targetDay, daysInCurrentMonth);
                    // Formata a data manualmente para evitar problemas de timezone UTC
                    const newMonthStr = String(currentMonth + 1).padStart(2, '0');
                    const newDayStr = String(finalDay).padStart(2, '0');
                    const newDateIso = `${currentYear}-${newMonthStr}-${newDayStr}`;
                    
                    newTransactions.push({
                        ...template,
                        id: crypto.randomUUID(),
                        date: newDateIso,
                        status: 'pending',
                        isRecurring: true
                    });
                }
            });

            if (newTransactions.length > 0) {
                if (user) {
                    for (const t of newTransactions) {
                        await addTransactionFire(user.uid, t);
                    }
                } else {
                    setData(prev => ({
                        ...prev,
                        transactions: [...prev.transactions, ...newTransactions]
                    }));
                }
            }
        };
        processRecurring();
    }
  }, [user, isGuest, data.transactions]); 

  // --- ACTIONS ---

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...t, id: crypto.randomUUID() };
    if (user) await addTransactionFire(user.uid, newTransaction);
    else setData(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    // 1. Google Calendar Integration: Update event if connected
    const currentTransaction = data.transactions.find(t => t.id === id);
    if (currentTransaction && currentTransaction.googleEventId && user) {
        // Se a data, valor ou descrição mudaram, atualiza no Google
        if (updates.date || updates.amount || updates.description || updates.category) {
            const updatedTx = { ...currentTransaction, ...updates };
            // Fire and forget (não espera terminar para atualizar UI)
            updateCalendarEvent(updatedTx, currentTransaction.googleEventId)
                .catch(err => console.warn("Falha ao atualizar Google Agenda:", err));
        }
    }

    if (user) await updateTransactionFire(user.uid, id, updates);
    else setData(prev => ({ ...prev, transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteTransaction = async (id: string) => {
    // 1. Google Calendar Integration: Delete event if connected
    const transactionToDelete = data.transactions.find(t => t.id === id);
    if (transactionToDelete && transactionToDelete.googleEventId && user) {
        // Fire and forget
        deleteCalendarEvent(transactionToDelete.googleEventId)
            .catch(err => console.warn("Falha ao remover do Google Agenda:", err));
    }

    if (user) await deleteTransactionFire(user.uid, id);
    else setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  const toggleTransactionStatus = async (id: string) => {
    const targetTransaction = data.transactions.find(t => t.id === id);
    if (!targetTransaction) return;
    
    const newStatus: TransactionStatus = targetTransaction.status === 'paid' ? 'pending' : 'paid';

    if (user) {
        await updateTransactionFire(user.uid, id, { status: newStatus });
        
        // Debt Sync Logic
        if (targetTransaction.debtId) {
             const debt = data.debts.find(d => d.id === targetTransaction.debtId);
             if (debt) {
                 const relatedTransactions = data.transactions.filter(t => t.debtId === targetTransaction.debtId);
                 const allPaid = relatedTransactions.every(t => {
                     if (t.id === id) return newStatus === 'paid';
                     return t.status === 'paid';
                 });

                 const newDebtStatus = allPaid ? 'paid' : 'agreement';
                 
                 if (debt.status !== newDebtStatus) {
                    await updateDebtFire(user.uid, debt.id, { status: newDebtStatus });
                 }
             }
        }
    } else {
        setData(prev => {
            const updatedTransactions = prev.transactions.map(t => t.id === id ? { ...t, status: newStatus } : t);
            
            let updatedDebts = prev.debts;
            if (targetTransaction.debtId) {
                const relatedTransactions = updatedTransactions.filter(t => t.debtId === targetTransaction.debtId);
                const allPaid = relatedTransactions.every(t => t.status === 'paid');
                const newDebtStatus = allPaid ? 'paid' : 'agreement';

                updatedDebts = prev.debts.map(d => {
                    if (d.id === targetTransaction.debtId) {
                         return { ...d, status: newDebtStatus };
                    }
                    return d;
                });
            }
            return { ...prev, transactions: updatedTransactions, debts: updatedDebts };
        });
    }
  };

  const addInvestment = async (inv: Omit<Investment, 'id'>) => {
    const newInvestment: Investment = { ...inv, id: crypto.randomUUID() };
    if (user) await addInvestmentFire(user.uid, newInvestment);
    else setData(prev => ({ ...prev, investments: [...prev.investments, newInvestment] }));
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    if (user) await updateInvestmentFire(user.uid, id, updates);
    else setData(prev => ({ ...prev, investments: prev.investments.map(inv => inv.id === id ? { ...inv, ...updates } : inv) }));
  };

  const deleteInvestment = async (id: string) => {
    if (user) await deleteInvestmentFire(user.uid, id);
    else setData(prev => ({ ...prev, investments: prev.investments.filter(i => i.id !== id) }));
  };

  const addBudget = async (b: Omit<Budget, 'id'>) => {
    const newBudget: Budget = { ...b, id: crypto.randomUUID() };
    if (user) await addBudgetFire(user.uid, newBudget);
    else setData(prev => ({ ...prev, budgets: [...(prev.budgets || []), newBudget] }));
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (user) await updateBudgetFire(user.uid, id, updates);
    else setData(prev => ({ ...prev, budgets: prev.budgets.map(b => b.id === id ? { ...b, ...updates } : b) }));
  };

  const deleteBudget = async (id: string) => {
    if (user) await deleteBudgetFire(user.uid, id);
    else setData(prev => ({ ...prev, budgets: prev.budgets.filter(b => b.id !== id) }));
  };

  const addDebt = async (d: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...d, id: crypto.randomUUID() };
    if (user) await addDebtFire(user.uid, newDebt);
    else setData(prev => ({ ...prev, debts: [...(prev.debts || []), newDebt] }));
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    if (user) await updateDebtFire(user.uid, id, updates);
    else setData(prev => ({ ...prev, debts: prev.debts.map(d => d.id === id ? { ...d, ...updates } : d) }));
  };

  const deleteDebt = async (id: string) => {
    if (user) await deleteDebtFire(user.uid, id);
    else setData(prev => ({ ...prev, debts: prev.debts.filter(d => d.id !== id) }));
  };

  const addShoppingItem = async (item: Omit<ShoppingItem, 'id'>) => {
    const newItem: ShoppingItem = { ...item, id: crypto.randomUUID() };
    if (user) await addShoppingItemFire(user.uid, newItem);
    else setData(prev => ({ ...prev, shoppingList: [...(prev.shoppingList || []), newItem] }));
  };

  const updateShoppingItem = async (id: string, updates: Partial<ShoppingItem>) => {
    if (user) await updateShoppingItemFire(user.uid, id, updates);
    else setData(prev => ({ ...prev, shoppingList: prev.shoppingList.map(item => item.id === id ? { ...item, ...updates } : item) }));
  };

  const deleteShoppingItem = async (id: string) => {
    if (user) await deleteShoppingItemFire(user.uid, id);
    else setData(prev => ({ ...prev, shoppingList: prev.shoppingList.filter(item => item.id !== id) }));
  };

  const clearShoppingList = async () => {
    if (user) await clearShoppingListFire(user.uid);
    else setData(prev => ({ ...prev, shoppingList: [] }));
  };

  const setShoppingBudget = async (amount: number) => {
    if (user) await updateShoppingBudgetFire(user.uid, amount);
    else setData(prev => ({ ...prev, shoppingBudget: amount }));
  };

  // --- KANBAN ACTIONS ---
  const saveKanbanBoard = async (board: KanbanBoard) => {
      if (user) await saveKanbanBoardFire(user.uid, board);
      else setData(prev => {
          const exists = prev.kanbanBoards.some(b => b.id === board.id);
          if (exists) {
              return { ...prev, kanbanBoards: prev.kanbanBoards.map(b => b.id === board.id ? board : b) };
          }
          return { ...prev, kanbanBoards: [...prev.kanbanBoards, board] };
      });
  };

  const deleteKanbanBoard = async (id: string) => {
      if (user) await deleteKanbanBoardFire(user.uid, id);
      else setData(prev => ({ ...prev, kanbanBoards: prev.kanbanBoards.filter(b => b.id !== id) }));
  };

  // Legacy support for single column actions (optional, or redirect to board logic)
  const saveKanbanColumn = async (column: KanbanColumn) => {
      // This is now deprecated in favor of board-level saving, but kept for compatibility if needed
      if (user) await saveKanbanColumnFire(user.uid, column);
      else setData(prev => {
          const exists = prev.kanbanColumns.some(c => c.id === column.id);
          if (exists) {
              return { ...prev, kanbanColumns: prev.kanbanColumns.map(c => c.id === column.id ? column : c) };
          }
          return { ...prev, kanbanColumns: [...prev.kanbanColumns, column] };
      });
  };

  const deleteKanbanColumn = async (id: string) => {
      if (user) await deleteKanbanColumnFire(user.uid, id);
      else setData(prev => ({ ...prev, kanbanColumns: prev.kanbanColumns.filter(c => c.id !== id) }));
  };

  // --- NOTES ACTIONS ---
  const addNote = async (note: Omit<Note, 'id'>) => {
      const newNote: Note = { ...note, id: crypto.randomUUID() };
      if (user) await addNoteFire(user.uid, newNote);
      else setData(prev => ({ ...prev, notes: [newNote, ...prev.notes] }));
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
      if (user) await updateNoteFire(user.uid, id, updates);
      else setData(prev => ({ ...prev, notes: prev.notes.map(n => n.id === id ? { ...n, ...updates } : n) }));
  };

  const deleteNote = async (id: string) => {
      if (user) await deleteNoteFire(user.uid, id);
      else setData(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
  };

  // --- CATEGORY ACTIONS ---
  const addCategory = async (cat: Category) => {
      if (user) await addCategoryFire(user.uid, cat);
      else setData(prev => ({ ...prev, categories: [...(prev.categories || []), cat] }));
  };

  const deleteCategory = async (id: string) => {
      if (user) await deleteCategoryFire(user.uid, id);
      else setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  };

  const unlockBadge = (badgeId: string) => {
    if (!data.unlockedBadges.includes(badgeId)) {
      if (user) unlockBadgeFire(user.uid, badgeId, data.unlockedBadges);
      else setData(prev => ({ ...prev, unlockedBadges: [...prev.unlockedBadges, badgeId] }));
    }
  };

  const saveWealthProfile = async (profile: WealthProfile) => {
      if (user) {
          await saveWealthProfileFire(user.uid, profile);
      } else {
          setData(prev => ({ ...prev, wealthProfile: profile }));
      }
  };

  return {
    data,
    setData,
    actions: {
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleTransactionStatus,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addBudget,
        updateBudget,
        deleteBudget,
        addDebt,
        updateDebt,
        deleteDebt,
        addShoppingItem,
        updateShoppingItem,
        deleteShoppingItem,
        clearShoppingList,
        setShoppingBudget,
        saveKanbanColumn,
        deleteKanbanColumn,
        saveKanbanBoard,
        deleteKanbanBoard,
        addNote,
        updateNote,
        deleteNote,
        addCategory,
        deleteCategory,
        unlockBadge,
        saveWealthProfile
    }
  };
};
