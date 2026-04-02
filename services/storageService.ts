
import { AppData, Transaction, Investment, Budget, Debt, ShoppingItem, WealthProfile, KanbanColumn, KanbanBoard, Note, Category, PasswordEntry, AgendaEvent, TaskList, Task, PixKey, Habit } from '../types';
import { db } from './firebase';
import { toast } from 'sonner';
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
  orderBy,
  where
} from 'firebase/firestore';

// --- LOCAL STORAGE (LEGACY / GUEST MODE) ---
const BASE_STORAGE_KEY = 'finansmart_data_v2';

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'cat_salario', name: 'Salário', type: 'income', color: 'emerald', isDefault: true },
    { id: 'cat_renda_extra', name: 'Renda Extra', type: 'income', color: 'blue', isDefault: true },
    { id: 'cat_investimentos_in', name: 'Investimentos', type: 'income', color: 'indigo', isDefault: true },
    { id: 'cat_casa', name: 'Casa', type: 'expense', color: 'orange', isDefault: true },
    { id: 'cat_mobilidade', name: 'Mobilidade', type: 'expense', color: 'blue', isDefault: true },
    { id: 'cat_alimentos', name: 'Alimentos', type: 'expense', color: 'red', isDefault: true },
    { id: 'cat_lazer', name: 'Lazer', type: 'expense', color: 'purple', isDefault: true },
    { id: 'cat_saude', name: 'Saúde', type: 'expense', color: 'teal', isDefault: true },
    { id: 'cat_educacao', name: 'Educação', type: 'expense', color: 'yellow', isDefault: true },
    { id: 'cat_pets', name: 'Pets', type: 'expense', color: 'amber', isDefault: true },
    { id: 'cat_outros', name: 'Outros', type: 'expense', color: 'slate', isDefault: true },
];

const DEFAULT_DATA: AppData = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  investments: [],
  budgets: [],
  debts: [],
  shoppingList: [],
  shoppingBudget: 0,
  kanbanColumns: [],
  kanbanBoards: [],
  notes: [],
  passwords: [],
  agendaEvents: [],
  taskLists: [],
  tasks: [],
  pixKeys: [],
  habits: [],
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
    if (!data.kanbanBoards) data.kanbanBoards = [];
    if (!data.notes) data.notes = [];
    if (!data.passwords) data.passwords = [];
    if (!data.agendaEvents) data.agendaEvents = [];
    if (!data.taskLists) data.taskLists = [];
    if (!data.tasks) data.tasks = [];
    if (!data.pixKeys) data.pixKeys = [];
    if (!data.habits) data.habits = [];
    if (!data.categories || data.categories.length === 0) data.categories = DEFAULT_CATEGORIES;
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

// Helper para exibir erros do Firestore
const handleFirestoreError = (error: any, message: string) => {
    console.error(message, error);
    if (error.code === 'permission-denied') {
        toast.error("Acesso negado: Verifique as configurações do seu banco de dados no Firebase.", {
            description: "Certifique-se de que o Firestore está em modo de teste ou com as regras de segurança configuradas.",
            duration: 10000,
        });
    } else {
        toast.error(`Erro no banco de dados: ${message}`, {
            description: error.message || "Erro desconhecido",
        });
    }
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
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar transações");
  });

  const unsubInvestments = onSnapshot(collection(db, 'users', uid, 'investments'), (snapshot) => {
    const investments = snapshot.docs.map(doc => doc.data() as Investment);
    onUpdate({ investments });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar investimentos");
  });

  const unsubBudgets = onSnapshot(collection(db, 'users', uid, 'budgets'), (snapshot) => {
    const budgets = snapshot.docs.map(doc => doc.data() as Budget);
    onUpdate({ budgets });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar orçamentos");
  });

  const unsubDebts = onSnapshot(collection(db, 'users', uid, 'debts'), (snapshot) => {
    const debts = snapshot.docs.map(doc => doc.data() as Debt);
    onUpdate({ debts });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar dívidas");
  });

  const unsubShopping = onSnapshot(collection(db, 'users', uid, 'shopping_list'), (snapshot) => {
    const shoppingList = snapshot.docs.map(doc => doc.data() as ShoppingItem);
    onUpdate({ shoppingList });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar lista de compras");
  });

  const unsubKanban = onSnapshot(query(collection(db, 'users', uid, 'kanban_columns'), orderBy('order')), (snapshot) => {
    const kanbanColumns = snapshot.docs.map(doc => doc.data() as KanbanColumn);
    onUpdate({ kanbanColumns });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar colunas kanban");
  });

  const unsubKanbanBoards = onSnapshot(collection(db, 'users', uid, 'kanban_boards'), (snapshot) => {
      const kanbanBoards = snapshot.docs.map(doc => doc.data() as KanbanBoard);
      onUpdate({ kanbanBoards });
  }, (error) => {
      handleFirestoreError(error, "Erro ao assinar quadros kanban");
  });

  const unsubNotes = onSnapshot(query(collection(db, 'users', uid, 'notes'), orderBy('date', 'desc')), (snapshot) => {
    const notes = snapshot.docs.map(doc => doc.data() as Note);
    onUpdate({ notes });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar notas");
  });

  const unsubPasswords = onSnapshot(query(collection(db, 'users', uid, 'passwords'), orderBy('createdAt', 'desc')), (snapshot) => {
    const passwords = snapshot.docs.map(doc => doc.data() as PasswordEntry);
    onUpdate({ passwords });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar senhas");
  });

  const unsubAgendaEvents = onSnapshot(query(collection(db, 'users', uid, 'agenda_events'), orderBy('startDate', 'asc')), (snapshot) => {
    const agendaEvents = snapshot.docs.map(doc => doc.data() as AgendaEvent);
    onUpdate({ agendaEvents });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar agenda");
  });

  const unsubTaskLists = onSnapshot(query(collection(db, 'users', uid, 'task_lists'), orderBy('createdAt', 'asc')), (snapshot) => {
    const taskLists = snapshot.docs.map(doc => doc.data() as TaskList);
    onUpdate({ taskLists });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar listas de tarefas");
  });

  const unsubTasks = onSnapshot(query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt', 'asc')), (snapshot) => {
    const tasks = snapshot.docs.map(doc => doc.data() as Task);
    onUpdate({ tasks });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar tarefas");
  });

  const unsubPixKeys = onSnapshot(query(collection(db, 'users', uid, 'pix_keys'), orderBy('createdAt', 'desc')), (snapshot) => {
    const pixKeys = snapshot.docs.map(doc => doc.data() as PixKey);
    onUpdate({ pixKeys });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar chaves pix");
  });

  const unsubHabits = onSnapshot(query(collection(db, 'users', uid, 'habits'), orderBy('createdAt', 'asc')), (snapshot) => {
    const habits = snapshot.docs.map(doc => doc.data() as Habit);
    onUpdate({ habits });
  }, (error) => {
    handleFirestoreError(error, "Erro ao assinar hábitos");
  });

  const unsubCategories = onSnapshot(collection(db, 'users', uid, 'categories'), (snapshot) => {
      const categories = snapshot.docs.map(doc => doc.data() as Category);
      // Se não houver categorias no banco, o hook useAppData deve lidar com o default
      if (categories.length > 0) {
          onUpdate({ categories });
      } else {
          // Auto-seed default categories for new users
          seedDefaultCategories(uid);
      }
  }, (error) => {
      handleFirestoreError(error, "Erro ao assinar categorias");
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
  }, (error) => {
      handleFirestoreError(error, "Erro ao assinar dados do usuário");
  });

  return () => {
    unsubTransactions();
    unsubInvestments();
    unsubBudgets();
    unsubDebts();
    unsubShopping();
    unsubKanban();
    unsubKanbanBoards();
    unsubNotes();
    unsubPasswords();
    unsubAgendaEvents();
    unsubTaskLists();
    unsubTasks();
    unsubPixKeys();
    unsubHabits();
    unsubCategories();
    unsubUserDoc();
  };
};

// 2. WRITERS (Escrita Atômica com Atualização de Saldo)

// TRANSACTIONS
export const addTransactionFire = async (uid: string, item: Transaction) => {
  try {
    await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', uid);
        const userDoc = await transaction.get(userRef);
        const currentBalance = userDoc.data()?.walletBalance || 0;
        
        const impact = getTransactionImpact(item);
        
        const transRef = doc(db, 'users', uid, 'transactions', item.id);
        transaction.set(transRef, item);
        // Usamos set com merge: true em vez de update para garantir que o documento do usuário seja criado se não existir
        transaction.set(userRef, { walletBalance: currentBalance + impact }, { merge: true });
    });
  } catch (error) {
    handleFirestoreError(error, "Erro ao adicionar transação");
  }
};

export const updateTransactionFire = async (uid: string, id: string, newData: Partial<Transaction>) => {
  try {
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
        // Usamos set com merge: true em vez de update para garantir que o documento do usuário seja criado se não existir
        transaction.set(userRef, { walletBalance: currentBalance - oldImpact + newImpact }, { merge: true });
    });
  } catch (error) {
    handleFirestoreError(error, "Erro ao atualizar transação");
  }
};

export const deleteTransactionFire = async (uid: string, id: string) => {
    try {
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
          // Usamos set com merge: true em vez de update para garantir que o documento do usuário seja criado se não existir
          transaction.set(userRef, { walletBalance: currentBalance - impact }, { merge: true });
      });
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir transação");
    }
};

export const recalculateBalanceFire = async (uid: string) => {
    try {
      const q = query(collection(db, 'users', uid, 'transactions'));
      const snapshot = await getDocs(q);
      let total = 0;
      
      snapshot.forEach(doc => {
          const t = doc.data() as Transaction;
          total += getTransactionImpact(t);
      });
      
      await setDoc(doc(db, 'users', uid), { walletBalance: total }, { merge: true });
      return total;
    } catch (error) {
      handleFirestoreError(error, "Erro ao recalcular saldo");
      return 0;
    }
};


// INVESTMENTS
export const addInvestmentFire = async (uid: string, item: Investment) => {
  try {
    await setDoc(doc(db, 'users', uid, 'investments', item.id), item);
  } catch (error) {
    handleFirestoreError(error, "Erro ao adicionar investimento");
  }
};
export const updateInvestmentFire = async (uid: string, id: string, data: Partial<Investment>) => {
  try {
    await updateDoc(doc(db, 'users', uid, 'investments', id), data);
  } catch (error) {
    handleFirestoreError(error, "Erro ao atualizar investimento");
  }
};
export const deleteInvestmentFire = async (uid: string, id: string) => {
  try {
    await deleteDoc(doc(db, 'users', uid, 'investments', id));
  } catch (error) {
    handleFirestoreError(error, "Erro ao excluir investimento");
  }
};

// BUDGETS
export const addBudgetFire = async (uid: string, item: Budget) => {
  try {
    await setDoc(doc(db, 'users', uid, 'budgets', item.id), item);
  } catch (error) {
    handleFirestoreError(error, "Erro ao adicionar orçamento");
  }
};
export const updateBudgetFire = async (uid: string, id: string, data: Partial<Budget>) => {
  try {
    await updateDoc(doc(db, 'users', uid, 'budgets', id), data);
  } catch (error) {
    handleFirestoreError(error, "Erro ao atualizar orçamento");
  }
};
export const deleteBudgetFire = async (uid: string, id: string) => {
  try {
    await deleteDoc(doc(db, 'users', uid, 'budgets', id));
  } catch (error) {
    handleFirestoreError(error, "Erro ao excluir orçamento");
  }
};

// DEBTS
export const addDebtFire = async (uid: string, item: Debt) => {
  try {
    await setDoc(doc(db, 'users', uid, 'debts', item.id), item);
  } catch (error) {
    handleFirestoreError(error, "Erro ao adicionar dívida");
  }
};
export const updateDebtFire = async (uid: string, id: string, data: Partial<Debt>) => {
  try {
    await updateDoc(doc(db, 'users', uid, 'debts', id), data);
  } catch (error) {
    handleFirestoreError(error, "Erro ao atualizar dívida");
  }
};
export const deleteDebtFire = async (uid: string, id: string) => {
  try {
    await deleteDoc(doc(db, 'users', uid, 'debts', id));
  } catch (error) {
    handleFirestoreError(error, "Erro ao excluir dívida");
  }
};

// SHOPPING LIST
export const addShoppingItemFire = async (uid: string, item: ShoppingItem) => {
  try {
    await setDoc(doc(db, 'users', uid, 'shopping_list', item.id), item);
  } catch (error) {
    handleFirestoreError(error, "Erro ao adicionar item à lista");
  }
};
export const updateShoppingItemFire = async (uid: string, id: string, data: Partial<ShoppingItem>) => {
  try {
    await updateDoc(doc(db, 'users', uid, 'shopping_list', id), data);
  } catch (error) {
    handleFirestoreError(error, "Erro ao atualizar item da lista");
  }
};
export const deleteShoppingItemFire = async (uid: string, id: string) => {
  try {
    await deleteDoc(doc(db, 'users', uid, 'shopping_list', id));
  } catch (error) {
    handleFirestoreError(error, "Erro ao excluir item da lista");
  }
};
export const clearShoppingListFire = async (uid: string, month?: string) => {
  try {
    let q = query(collection(db, 'users', uid, 'shopping_list'));
    if (month) {
      q = query(collection(db, 'users', uid, 'shopping_list'), where('month', '==', month));
    }
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, "Erro ao limpar lista de compras");
  }
};

// SHOPPING BUDGET
export const updateShoppingBudgetFire = async (uid: string, amount: number) => {
    try {
      await setDoc(doc(db, 'users', uid), { 
          shoppingBudget: amount 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, "Erro ao atualizar orçamento de compras");
    }
};

// KANBAN
export const saveKanbanColumnFire = async (uid: string, column: KanbanColumn) => {
    try {
      await setDoc(doc(db, 'users', uid, 'kanban_columns', column.id), column);
    } catch (error) {
      handleFirestoreError(error, "Erro ao salvar coluna kanban");
    }
};
export const deleteKanbanColumnFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'kanban_columns', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir coluna kanban");
    }
};

// KANBAN BOARDS (NEW SYSTEM)
export const saveKanbanBoardFire = async (uid: string, board: KanbanBoard) => {
    try {
      await setDoc(doc(db, 'users', uid, 'kanban_boards', board.id), board);
    } catch (error) {
      handleFirestoreError(error, "Erro ao salvar quadro kanban");
    }
};
export const deleteKanbanBoardFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'kanban_boards', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir quadro kanban");
    }
};

// NOTES
export const addNoteFire = async (uid: string, note: Note) => {
    try {
      await setDoc(doc(db, 'users', uid, 'notes', note.id), note);
    } catch (error) {
      handleFirestoreError(error, "Erro ao adicionar nota");
    }
};
export const updateNoteFire = async (uid: string, id: string, data: Partial<Note>) => {
    try {
      await updateDoc(doc(db, 'users', uid, 'notes', id), data);
    } catch (error) {
      handleFirestoreError(error, "Erro ao atualizar nota");
    }
};
export const deleteNoteFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'notes', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir nota");
    }
};

// PASSWORDS
export const addPasswordFire = async (uid: string, entry: PasswordEntry) => {
    try {
      await setDoc(doc(db, 'users', uid, 'passwords', entry.id), entry);
    } catch (error) {
      handleFirestoreError(error, "Erro ao adicionar senha");
    }
};
export const updatePasswordFire = async (uid: string, id: string, data: Partial<PasswordEntry>) => {
    try {
      await updateDoc(doc(db, 'users', uid, 'passwords', id), data);
    } catch (error) {
      handleFirestoreError(error, "Erro ao atualizar senha");
    }
};
export const deletePasswordFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'passwords', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir senha");
    }
};

// AGENDA EVENTS
export const addAgendaEventFire = async (uid: string, event: AgendaEvent) => {
    try {
      await setDoc(doc(db, 'users', uid, 'agenda_events', event.id), event);
    } catch (error) {
      handleFirestoreError(error, "Erro ao adicionar evento na agenda");
    }
};
export const updateAgendaEventFire = async (uid: string, id: string, data: Partial<AgendaEvent>) => {
    try {
      await updateDoc(doc(db, 'users', uid, 'agenda_events', id), data);
    } catch (error) {
      handleFirestoreError(error, "Erro ao atualizar evento na agenda");
    }
};
export const deleteAgendaEventFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'agenda_events', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir evento na agenda");
    }
};

// TASKS
export const addTaskListFire = async (uid: string, list: TaskList) => {
    try {
      await setDoc(doc(db, 'users', uid, 'task_lists', list.id), list);
    } catch (error) {
      handleFirestoreError(error, "Erro ao adicionar lista de tarefas");
    }
};
export const updateTaskListFire = async (uid: string, id: string, data: Partial<TaskList>) => {
    try {
      await updateDoc(doc(db, 'users', uid, 'task_lists', id), data);
    } catch (error) {
      handleFirestoreError(error, "Erro ao atualizar lista de tarefas");
    }
};
export const deleteTaskListFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'task_lists', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir lista de tarefas");
    }
};

export const addTaskFire = async (uid: string, task: Task) => {
    try {
      await setDoc(doc(db, 'users', uid, 'tasks', task.id), task);
    } catch (error) {
      handleFirestoreError(error, "Erro ao adicionar tarefa");
    }
};
export const updateTaskFire = async (uid: string, id: string, data: Partial<Task>) => {
    try {
      await updateDoc(doc(db, 'users', uid, 'tasks', id), data);
    } catch (error) {
      handleFirestoreError(error, "Erro ao atualizar tarefa");
    }
};
export const deleteTaskFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir tarefa");
    }
};

// PIX KEYS
export const addPixKeyFire = async (uid: string, item: PixKey) => {
    try {
      await setDoc(doc(db, 'users', uid, 'pix_keys', item.id), item);
    } catch (error) {
      handleFirestoreError(error, "Erro ao adicionar chave pix");
    }
};
export const updatePixKeyFire = async (uid: string, id: string, data: Partial<PixKey>) => {
    try {
      await updateDoc(doc(db, 'users', uid, 'pix_keys', id), data);
    } catch (error) {
      handleFirestoreError(error, "Erro ao atualizar chave pix");
    }
};
export const deletePixKeyFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'pix_keys', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir chave pix");
    }
};

// HABITS
export const addHabitFire = async (uid: string, habit: Habit) => {
    try {
      await setDoc(doc(db, 'users', uid, 'habits', habit.id), habit);
    } catch (error) {
      handleFirestoreError(error, "Erro ao adicionar hábito");
    }
};
export const updateHabitFire = async (uid: string, id: string, data: Partial<Habit>) => {
    try {
      await updateDoc(doc(db, 'users', uid, 'habits', id), data);
    } catch (error) {
      handleFirestoreError(error, "Erro ao atualizar hábito");
    }
};
export const deleteHabitFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'habits', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir hábito");
    }
};

// CATEGORIES
export const addCategoryFire = async (uid: string, category: Category) => {
    try {
      await setDoc(doc(db, 'users', uid, 'categories', category.id), category);
    } catch (error) {
      handleFirestoreError(error, "Erro ao adicionar categoria");
    }
};
export const deleteCategoryFire = async (uid: string, id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, "Erro ao excluir categoria");
    }
};
export const seedDefaultCategories = async (uid: string) => {
    try {
      const batch = writeBatch(db);
      DEFAULT_CATEGORIES.forEach(cat => {
          const ref = doc(db, 'users', uid, 'categories', cat.id);
          batch.set(ref, cat);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, "Erro ao inicializar categorias");
    }
};


// BADGES & WEALTH PROFILE
export const unlockBadgeFire = async (uid: string, badgeId: string, currentBadges: string[]) => {
    try {
      if (!currentBadges.includes(badgeId)) {
          await setDoc(doc(db, 'users', uid), { 
              unlockedBadges: [...currentBadges, badgeId] 
          }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, "Erro ao desbloquear conquista");
    }
};

export const saveWealthProfileFire = async (uid: string, profile: WealthProfile) => {
    try {
      await setDoc(doc(db, 'users', uid), { 
          wealthProfile: profile 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, "Erro ao salvar perfil de riqueza");
    }
};

export const migrateLocalToCloud = async (uid: string, localData: AppData) => {
    try {
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

      localData.notes.forEach(n => {
          const ref = doc(db, 'users', uid, 'notes', n.id);
          batch.set(ref, n);
      });

      localData.passwords?.forEach(p => {
          const ref = doc(db, 'users', uid, 'passwords', p.id);
          batch.set(ref, p);
      });

      localData.agendaEvents?.forEach(e => {
          const ref = doc(db, 'users', uid, 'agenda_events', e.id);
          batch.set(ref, e);
      });

      localData.taskLists?.forEach(tl => {
          const ref = doc(db, 'users', uid, 'task_lists', tl.id);
          batch.set(ref, tl);
      });

      localData.tasks?.forEach(t => {
          const ref = doc(db, 'users', uid, 'tasks', t.id);
          batch.set(ref, t);
      });

      localData.pixKeys?.forEach(k => {
          const ref = doc(db, 'users', uid, 'pix_keys', k.id);
          batch.set(ref, k);
      });

      localData.habits?.forEach(h => {
          const ref = doc(db, 'users', uid, 'habits', h.id);
          batch.set(ref, h);
      });

      // Migrating categories
      const categoriesToMigrate = (localData.categories && localData.categories.length > 0) 
          ? localData.categories 
          : DEFAULT_CATEGORIES;
      
      categoriesToMigrate.forEach(c => {
          const ref = doc(db, 'users', uid, 'categories', c.id);
          batch.set(ref, c);
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
      toast.success("Dados migrados com sucesso para a nuvem!");
    } catch (error) {
      handleFirestoreError(error, "Erro ao migrar dados");
    }
};
