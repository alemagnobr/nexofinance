
import { AppData, Transaction, Investment, Budget, Debt, ShoppingItem, WealthProfile } from '../types';
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
  writeBatch
} from 'firebase/firestore';

// --- LOCAL STORAGE (LEGACY / GUEST MODE) ---
const BASE_STORAGE_KEY = 'finansmart_data_v2';

const DEFAULT_DATA: AppData = {
  transactions: [],
  investments: [],
  budgets: [],
  debts: [],
  shoppingList: [],
  unlockedBadges: []
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
    
    if (!data.budgets) {
      data.budgets = [];
    } else {
      data.budgets = data.budgets.map((b: any) => ({
        ...b,
        isRecurring: b.isRecurring !== undefined ? b.isRecurring : true,
        month: b.month || undefined
      }));
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
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

// --- FIRESTORE SERVICE (CLOUD MODE) ---

// 1. LISTENERS (Escuta em tempo real)
export const subscribeToData = (uid: string, onUpdate: (data: Partial<AppData>) => void) => {
  const unsubTransactions = onSnapshot(collection(db, 'users', uid, 'transactions'), (snapshot) => {
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
  
  const unsubUserDoc = onSnapshot(doc(db, 'users', uid), (doc) => {
      if (doc.exists()) {
          const data = doc.data();
          const updates: Partial<AppData> = {};
          
          if (data.unlockedBadges) updates.unlockedBadges = data.unlockedBadges;
          if (data.wealthProfile) updates.wealthProfile = data.wealthProfile;
          
          if (Object.keys(updates).length > 0) onUpdate(updates);
      }
  });

  return () => {
    unsubTransactions();
    unsubInvestments();
    unsubBudgets();
    unsubDebts();
    unsubShopping();
    unsubUserDoc();
  };
};

// 2. WRITERS (Escrita Atômica)

// TRANSACTIONS
export const addTransactionFire = async (uid: string, item: Transaction) => {
  await setDoc(doc(db, 'users', uid, 'transactions', item.id), item);
};
export const updateTransactionFire = async (uid: string, id: string, data: Partial<Transaction>) => {
  await updateDoc(doc(db, 'users', uid, 'transactions', id), data);
};
export const deleteTransactionFire = async (uid: string, id: string) => {
  await deleteDoc(doc(db, 'users', uid, 'transactions', id));
};

// INVESTMENTS
export const addInvestmentFire = async (uid: string, item: Investment) => {
  await setDoc(doc(db, 'users', uid, 'investments', item.id), item);
};
export const updateInvestmentFire = async (uid: string, id: string, amount: number) => {
  await updateDoc(doc(db, 'users', uid, 'investments', id), { amount });
};
export const deleteInvestmentFire = async (uid: string, id: string) => {
  await deleteDoc(doc(db, 'users', uid, 'investments', id));
};

// BUDGETS
export const addBudgetFire = async (uid: string, item: Budget) => {
  await setDoc(doc(db, 'users', uid, 'budgets', item.id), item);
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


// BADGES & WEALTH PROFILE (User Document)
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

// MIGRATION HELPER (Local -> Cloud)
export const migrateLocalToCloud = async (uid: string, localData: AppData) => {
    const batch = writeBatch(db);
    
    localData.transactions.forEach(t => {
        const ref = doc(db, 'users', uid, 'transactions', t.id);
        batch.set(ref, t);
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

    const userRef = doc(db, 'users', uid);
    const userData: any = { unlockedBadges: localData.unlockedBadges };
    if (localData.wealthProfile) userData.wealthProfile = localData.wealthProfile;
    
    batch.set(userRef, userData, { merge: true });

    await batch.commit();
};
