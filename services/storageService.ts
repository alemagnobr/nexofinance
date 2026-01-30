
import { AppData, Transaction, Investment } from '../types';

// O prefixo base continua, mas vamos anexar o UID do usuário
const BASE_STORAGE_KEY = 'finansmart_data_v2';

// Inicia com tudo vazio (Clean Slate)
const DEFAULT_DATA: AppData = {
  transactions: [],
  investments: [],
  budgets: [],
  debts: [],
  unlockedBadges: []
};

// Helper para pegar a chave correta baseada no usuário logado
const getStorageKey = (userId?: string) => {
  if (!userId) return BASE_STORAGE_KEY; // Fallback para modo offline/legado
  return `${BASE_STORAGE_KEY}_${userId}`;
};

export const loadData = (userId?: string): AppData => {
  try {
    const key = getStorageKey(userId);
    const serialized = localStorage.getItem(key);
    
    // Se não encontrar dados para o usuário específico, tenta carregar dados legados para migração (opcional)
    // Aqui vamos manter simples: novo usuário = dados vazios
    if (!serialized) return DEFAULT_DATA;
    
    const data = JSON.parse(serialized);
    
    // Migration check: garante que arrays existam mesmo se o JSON for antigo
    if (!data.transactions) data.transactions = [];
    if (!data.investments) data.investments = [];
    if (!data.unlockedBadges) data.unlockedBadges = [];
    if (!data.debts) data.debts = [];
    
    // Budget Migration
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
