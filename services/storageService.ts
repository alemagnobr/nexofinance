import { AppData, Transaction, Investment } from '../types';

const STORAGE_KEY = 'finansmart_data_v2';

const DEFAULT_DATA: AppData = {
  transactions: [
    {
      id: '1',
      description: 'Salário Mensal',
      amount: 5000,
      type: 'income',
      category: 'Salário',
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      paymentMethod: 'pix',
      isRecurring: true
    },
    {
      id: '2',
      description: 'Netflix',
      amount: 55.90,
      type: 'expense',
      category: 'Lazer',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      paymentMethod: 'credit_card',
      isRecurring: true
    }
  ],
  investments: [
    {
      id: '1',
      name: 'Tesouro Selic',
      amount: 2000,
      targetAmount: 10000,
      type: 'Renda Fixa',
      date: new Date().toISOString().split('T')[0]
    }
  ],
  budgets: [
    {
      id: '1',
      category: 'Lazer',
      limit: 500
    },
    {
      id: '2',
      category: 'Alimentos',
      limit: 1200
    }
  ],
  debts: [],
  unlockedBadges: []
};

export const loadData = (): AppData => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return DEFAULT_DATA;
    const data = JSON.parse(serialized);
    // Migration check for older versions
    if (!data.unlockedBadges) data.unlockedBadges = [];
    if (!data.budgets) data.budgets = DEFAULT_DATA.budgets;
    if (!data.debts) data.debts = [];
    return data;
  } catch (e) {
    console.error("Failed to load data", e);
    return DEFAULT_DATA;
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};