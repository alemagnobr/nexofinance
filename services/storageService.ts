
import { AppData, Transaction, Investment, Budget, Debt, ShoppingItem, WealthProfile, KanbanColumn } from '../types';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  getDocs,
  writeBatch,
  runTransaction,
  limit,
  orderBy
} from 'firebase/firestore';

// --- LOCAL STORAGE (LEGACY / GUEST MODE) ---
const BASE_STORAGE_KEY = 'finansmart_data_v2';

const DEFAULT_DATA: AppData = {
  transactions: [],
  investments: [],
  budgets: [],
  debts: [],
  shoppingList: [],
  shoppingBudget: 0,
  kanbanColumns: [],
  unlockedBadges: [],
  walletBalance: 0
};

const getStorageKey = (userId?: string) => {
  if (!userId) return BASE_STORAGE_KEY; 
  return `${BASE_STORAGE_KEY}_${userId}`;
};

export const loadData = (userId?: string): AppData => {
  try {
    const key = getStorageKey(userId);
    const serialized = localStorage.getItem(key);
    
    if (!serialized) return DEFAULT_DATA;
    
    const data = JSON.parse(serialized);
    
    // Migrações de segurança para garantir arrays
    if (!data.transactions) data.transactions = [];
    if (!data.investments) data.investments = [];
    if (!data.unlockedBadges) data.unlockedBadges = [];
    if (!data.debts) data.debts = [];
    if (!data.shoppingList) data.shoppingList = [];
    if (!data.kanbanColumns) data.kanbanColumns = [];
    if (data.shoppingBudget === undefined) data.shoppingBudget = 0;
    
    if (!data.budgets) {
      data.budgets = [];
    } else {
      data.budgets = data.budgets.map((b: any) => ({
        ...b,
        isRecurring: b.isRecurring !== undefined ? b.isRecurring : true,
        month: b.month || undefined
      }));
    }

    // Calcula saldo inicial se não existir (para guest mode)
    if (data.walletBalance === undefined) {
        data.walletBalance = data.transactions.reduce((acc: number, t: Transaction) => {
            if (t.status === 'paid') {
                return acc + (t.type === 'income' ? t.amount : -t.amount);
            }
            return acc;
        }, 0);
    }
    
    return data;
  } catch (e) {
    console.error("Failed to load data", e);
    return DEFAULT_DATA;
  }
};

export const saveData = (data: AppData, userId?: string): void => {
  try {
    const key = getStorageKey(userId);
    // Recalcula saldo antes de salvar para garantir consistência no Guest Mode
    const calculatedBalance = data.transactions.reduce((acc: number, t: Transaction) => {
        if (t.status === 'paid') {
            return acc + (t.type === 'income' ? t.amount : -t.amount);
        }
        return acc;
    }, 0);
    const dataToSave = { ...data, walletBalance: calculatedBalance };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

// --- FIRESTORE SERVICE (CLOUD MODE) ---

// Helper: Calcula impacto de uma transação no saldo
const getTransactionImpact = (t: Transaction): number => {
    if (t.status === 'pending') return 0;
    return t.type === 'income' ? t.amount : -t.amount;
};

// 1. LISTENERS (Escuta em tempo real OTIMIZADA)
export const subscribeToData = (uid: string, onUpdate: (data: Partial<AppData>) => void) => {
  // Otimização: Baixa apenas as últimas 300 transações
  const qTransactions = query(
      collection(db, 'users', uid, 'transactions'),
      orderBy('date', 'desc'),
      limit(300)
  );

  const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
    const transactions = snapshot.docs.map(doc => doc.data() as Transaction);
    onUpdate({ transactions });
  });

  const unsubInvestments = onSnapshot(collection(db, 'users', uid, 'investments'), (snapshot) => {
    const investments = snapshot.docs.map(doc => doc.data() as Investment);
    onUpdate({ investments });
  });

  const unsubBudgets = onSnapshot(collection(db, 'users', uid, 'budgets'), (snapshot) => {
    const budgets = snapshot.docs.map(doc => doc.data() as Budget);
    onUpdate({ budgets });
  });

  const unsubDebts = onSnapshot(collection(db, 'users', uid, 'debts'), (snapshot) => {
    const debts = snapshot.docs.map(doc => doc.data() as Debt);
    onUpdate({ debts });
  });

  const unsubShopping = onSnapshot(collection(db, 'users', uid, 'shopping_list'), (snapshot) => {
    const shoppingList = snapshot.docs.map(doc => doc.data() as ShoppingItem);
    onUpdate({ shoppingList });
  });

  // NEW: Kanban Listener
  const unsubKanban = onSnapshot(query(collection(db, 'users', uid, 'kanban_columns'), orderBy('order')), (snapshot) => {
    const kanbanColumns = snapshot.docs.map(doc => doc.data() as KanbanColumn);
    onUpdate({ kanbanColumns });
  });
  
  // Escuta documento do usuário para saldo e configurações
  const unsubUserDoc = onSnapshot(doc(db, 'users', uid), (doc) => {
      if (doc.exists()) {
          const data = doc.data();
          const updates: Partial<AppData> = {};
          
          if (data.unlockedBadges) updates.unlockedBadges = data.unlockedBadges;
          if (data.wealthProfile) updates.wealthProfile = data.wealthProfile;
          if (data.shoppingBudget !== undefined) updates.shoppingBudget = data.shoppingBudget;
          if (data.walletBalance !== undefined) updates.walletBalance = data.walletBalance;
          
          if (Object.keys(updates).length > 0) onUpdate(updates);
      }
  });

  return () => {
    unsubTransactions();
    unsubInvestments();
    unsubBudgets();
    unsubDebts();
    unsubShopping();
    unsubKanban();
    unsubUserDoc();
  };
};

// 2. WRITERS (Escrita Atômica com Atualização de Saldo)

// TRANSACTIONS
export const addTransactionFire = async (uid: string, item: Transaction) => {
  await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userDoc = await transaction.get(userRef);
      const currentBalance = userDoc.data()?.walletBalance || 0;
      
      const impact = getTransactionImpact(item);
      
      const transRef = doc(db, 'users', uid, 'transactions', item.id);
      transaction.set(transRef, item);
      transaction.update(userRef, { walletBalance: currentBalance + impact });
  });
};

export const updateTransactionFire = async (uid: string, id: string, newData: Partial<Transaction>) => {
  await runTransaction(db, async (transaction) => {
      const transRef = doc(db, 'users', uid, 'transactions', id);
      const userRef = doc(db, 'users', uid);
      
      const transDoc = await transaction.get(transRef);
      if (!transDoc.exists()) throw new Error("Transaction not found");
      
      const oldData = transDoc.data() as Transaction;
      const userDoc = await transaction.get(userRef);
      const currentBalance = userDoc.data()?.walletBalance || 0;

      // Reverte impacto antigo e aplica novo
      const oldImpact = getTransactionImpact(oldData);
      const newTransactionFull = { ...oldData, ...newData };
      const newImpact = getTransactionImpact(newTransactionFull);
      
      transaction.update(transRef, newData);
      transaction.update(userRef, { walletBalance: currentBalance - oldImpact + newImpact });
  });
};

export const deleteTransactionFire = async (uid: string, id: string) => {
    await runTransaction(db, async (transaction) => {
        const transRef = doc(db, 'users', uid, 'transactions', id);
        const userRef = doc(db, 'users', uid);
        
        const transDoc = await transaction.get(transRef);
        if (!transDoc.exists()) throw new Error("Transaction not found");
        
        const oldData = transDoc.data() as Transaction;
        const userDoc = await transaction.get(userRef);
        const currentBalance = userDoc.data()?.walletBalance || 0;
        
        const impact = getTransactionImpact(oldData);
        
        transaction.delete(transRef);
        transaction.update(userRef, { walletBalance: currentBalance - impact });
    });
};

export const recalculateBalanceFire = async (uid: string) => {
    const q = query(collection(db, 'users', uid, 'transactions'));
    const snapshot = await getDocs(q);
    let total = 0;
    
    snapshot.forEach(doc => {
        const t = doc.data() as Transaction;
        total += getTransactionImpact(t);
    });
    
    await updateDoc(doc(db, 'users', uid), { walletBalance: total });
    return total;
};


// INVESTMENTS
export const addInvestmentFire = async (uid: string, item: Investment) => {
  await setDoc(doc(db, 'users', uid, 'investments', item.id), item);
};
export const updateInvestmentFire = async (uid: string, id: string, data: Partial<Investment>) => {
  await updateDoc(doc(db, 'users', uid, 'investments', id), data);
};
export const deleteInvestmentFire = async (uid: string, id: string) => {
  await deleteDoc(doc(db, 'users', uid, 'investments', id));
};

// BUDGETS
export const addBudgetFire = async (uid: string, item: Budget) => {
  await setDoc(doc(db, 'users', uid, 'budgets', item.id), item);
};
export const updateBudgetFire = async (uid: string, id: string, data: Partial<Budget>) => {
  await updateDoc(doc(db, 'users', uid, 'budgets', id), data);
};
export const deleteBudgetFire = async (uid: string, id: string) => {
  await deleteDoc(doc(db, 'users', uid, 'budgets', id));
};

// DEBTS
export const addDebtFire = async (uid: string, item: Debt) => {
  await setDoc(doc(db, 'users', uid, 'debts', item.id), item);
};
export const updateDebtFire = async (uid: string, id: string, data: Partial<Debt>) => {
  await updateDoc(doc(db, 'users', uid, 'debts', id), data);
};
export const deleteDebtFire = async (uid: string, id: string) => {
  await deleteDoc(doc(db, 'users', uid, 'debts', id));
};

// SHOPPING LIST
export const addShoppingItemFire = async (uid: string, item: ShoppingItem) => {
  await setDoc(doc(db, 'users', uid, 'shopping_list', item.id), item);
};
export const updateShoppingItemFire = async (uid: string, id: string, data: Partial<ShoppingItem>) => {
  await updateDoc(doc(db, 'users', uid, 'shopping_list', id), data);
};
export const deleteShoppingItemFire = async (uid: string, id: string) => {
  await deleteDoc(doc(db, 'users', uid, 'shopping_list', id));
};
export const clearShoppingListFire = async (uid: string) => {
  const q = query(collection(db, 'users', uid, 'shopping_list'));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

// SHOPPING BUDGET
export const updateShoppingBudgetFire = async (uid: string, amount: number) => {
    await setDoc(doc(db, 'users', uid), { 
        shoppingBudget: amount 
    }, { merge: true });
};

// KANBAN
export const saveKanbanColumnFire = async (uid: string, column: KanbanColumn) => {
    await setDoc(doc(db, 'users', uid, 'kanban_columns', column.id), column);
};
export const deleteKanbanColumnFire = async (uid: string, id: string) => {
    await deleteDoc(doc(db, 'users', uid, 'kanban_columns', id));
};


// BADGES & WEALTH PROFILE
export const unlockBadgeFire = async (uid: string, badgeId: string, currentBadges: string[]) => {
    if (!currentBadges.includes(badgeId)) {
        await setDoc(doc(db, 'users', uid), { 
            unlockedBadges: [...currentBadges, badgeId] 
        }, { merge: true });
    }
};

export const saveWealthProfileFire = async (uid: string, profile: WealthProfile) => {
    await setDoc(doc(db, 'users', uid), { 
        wealthProfile: profile 
    }, { merge: true });
};

export const migrateLocalToCloud = async (uid: string, localData: AppData) => {
    const batch = writeBatch(db);
    
    let calculatedBalance = 0;

    localData.transactions.forEach(t => {
        const ref = doc(db, 'users', uid, 'transactions', t.id);
        batch.set(ref, t);
        calculatedBalance += getTransactionImpact(t);
    });
    
    localData.investments.forEach(i => {
        const ref = doc(db, 'users', uid, 'investments', i.id);
        batch.set(ref, i);
    });

    localData.budgets.forEach(b => {
        const ref = doc(db, 'users', uid, 'budgets', b.id);
        batch.set(ref, b);
    });

    localData.debts.forEach(d => {
        const ref = doc(db, 'users', uid, 'debts', d.id);
        batch.set(ref, d);
    });

    localData.shoppingList.forEach(s => {
      const ref = doc(db, 'users', uid, 'shopping_list', s.id);
      batch.set(ref, s);
    });

    localData.kanbanColumns.forEach(k => {
        const ref = doc(db, 'users', uid, 'kanban_columns', k.id);
        batch.set(ref, k);
    });

    const userRef = doc(db, 'users', uid);
    const userData: any = { 
        unlockedBadges: localData.unlockedBadges,
        walletBalance: calculatedBalance,
        shoppingBudget: localData.shoppingBudget || 0
    };
    if (localData.wealthProfile) userData.wealthProfile = localData.wealthProfile;
    
    batch.set(userRef, userData, { merge: true });

    await batch.commit();
};
