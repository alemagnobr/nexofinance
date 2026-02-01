
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { AppData, Transaction, Investment, Budget, Debt, ShoppingItem, TransactionStatus, WealthProfile } from '../types';
import { 
  addTransactionFire, updateTransactionFire, deleteTransactionFire,
  addInvestmentFire, updateInvestmentFire, deleteInvestmentFire,
  addBudgetFire, deleteBudgetFire,
  addDebtFire, updateDebtFire, deleteDebtFire,
  addShoppingItemFire, updateShoppingItemFire, deleteShoppingItemFire, clearShoppingListFire,
  unlockBadgeFire, saveWealthProfileFire, subscribeToData
} from '../services/storageService';

const DEFAULT_DATA: AppData = {
    transactions: [],
    investments: [],
    budgets: [],
    debts: [],
    shoppingList: [],
    unlockedBadges: []
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

  // Processamento de Transações Recorrentes (mantido igual)
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
                const existsInCurrentMonth = data.transactions.some(t => {
                    const tDate = new Date(t.date);
                    return t.description === description &&
                          t.amount === template.amount &&
                          tDate.getMonth() === currentMonth &&
                          tDate.getFullYear() === currentYear;
                });

                if (!existsInCurrentMonth) {
                    const tDate = new Date(template.date);
                    const targetDay = tDate.getDate();
                    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const finalDay = Math.min(targetDay, daysInCurrentMonth);
                    const newDateObj = new Date(currentYear, currentMonth, finalDay);
                    
                    newTransactions.push({
                        ...template,
                        id: crypto.randomUUID(),
                        date: newDateObj.toISOString().split('T')[0],
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
    if (user) await updateTransactionFire(user.uid, id, updates);
    else setData(prev => ({ ...prev, transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteTransaction = async (id: string) => {
    if (user) await deleteTransactionFire(user.uid, id);
    else setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  const toggleTransactionStatus = async (id: string) => {
    const targetTransaction = data.transactions.find(t => t.id === id);
    if (!targetTransaction) return;
    
    const newStatus: TransactionStatus = targetTransaction.status === 'paid' ? 'pending' : 'paid';

    if (user) {
        await updateTransactionFire(user.uid, id, { status: newStatus });
        if (targetTransaction.debtId) {
             const debt = data.debts.find(d => d.id === targetTransaction.debtId);
             if (debt) {
                 const newDebtStatus = newStatus === 'paid' ? 'paid' : 'agreement';
                 await updateDebtFire(user.uid, debt.id, { status: newDebtStatus });
             }
        }
    } else {
        setData(prev => {
            const updatedTransactions = prev.transactions.map(t => t.id === id ? { ...t, status: newStatus } : t);
            let updatedDebts = prev.debts;
            if (targetTransaction.debtId) {
                updatedDebts = prev.debts.map(d => {
                    if (d.id === targetTransaction.debtId) {
                         return { ...d, status: newStatus === 'paid' ? 'paid' : 'agreement' };
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

  const updateInvestment = async (id: string, newAmount: number) => {
    if (user) await updateInvestmentFire(user.uid, id, newAmount);
    else setData(prev => ({ ...prev, investments: prev.investments.map(inv => inv.id === id ? { ...inv, amount: newAmount } : inv) }));
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
        deleteBudget,
        addDebt,
        updateDebt,
        deleteDebt,
        addShoppingItem,
        updateShoppingItem,
        deleteShoppingItem,
        clearShoppingList,
        unlockBadge,
        saveWealthProfile
    }
  };
};
