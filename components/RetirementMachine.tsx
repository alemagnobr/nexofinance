
import React, { useState, useMemo } from 'react';
import { AppData, WealthProfile, Transaction } from '../types';
import { Landmark, TrendingUp, ShieldCheck, Target, Lock, Zap, Wifi, Home, DollarSign, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';

interface RetirementMachineProps {
  data: AppData;
  actions: any; // Adicionado para permitir criação de investimento
  onSaveProfile: (profile: WealthProfile) => void;
  onNavigateToInvestments: () => void;
  privacyMode: boolean;
  hasApiKey: boolean;
}

const DEFAULT_PROFILE: WealthProfile = {
    age: 30,
    retirementAge: 60,
    riskProfile: 'moderate',
    retirementRate: 1.0 // 1% default
};

export const RetirementMachine: React.FC<RetirementMachineProps> = ({ data, actions, onSaveProfile, onNavigateToInvestments, privacyMode, hasApiKey }) => {
  const [profile, setProfile] = useState<WealthProfile>(data.wealthProfile || DEFAULT_PROFILE);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(String(profile.retirementRate || 1.0));
  
  // 1. Get current invested capital from specific fund
  const retirementFund = useMemo(() => {
    return data.investments.find(i => i.name.toLowerCase() === 'fundo de aposentadoria');
  }, [data.investments]);

  const totalInvested = retirementFund?.amount || 0;

  const handleCreateFund = () => {
    if (actions.addInvestment) {
        actions.addInvestment({
            name: 'Fundo de Aposentadoria',
            assetCategory: 'fund',
            type: 'Renda Fixa',
            amount: 0,
            investedAmount: 0,
            targetAmount: 0,
            date: new Date().toISOString().split('T')[0],
            fundProduct: 'Caixinha / Banco',
            history: []
        });
    }
  };

  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');

  const handleTopup = () => {
    if (!retirementFund || !actions.updateInvestment || !topupAmount) return;
    const addedValue = parseFloat(topupAmount);
    if (!isNaN(addedValue) && addedValue > 0) {
        const currentCost = retirementFund.investedAmount || retirementFund.amount || 0;
        const newHistory = [...(retirementFund.history || []), {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            amount: addedValue,
            type: 'contribution' as const
        }];

        actions.updateInvestment(retirementFund.id, {
            amount: (retirementFund.amount || 0) + addedValue,
            investedAmount: currentCost + addedValue,
            lastContribution: addedValue,
            lastContributionDate: new Date().toISOString().split('T')[0],
            history: newHistory
        });
    }
    setTopupAmount('');
    setShowTopup(false);
  };

  // 2. Identify fixed expenses from recurring transactions
  const fixedExpenses = useMemo(() => {
    // Group recurring transactions by description/category
    const recurring = data.transactions.filter(t => t.isRecurring && t.type === 'expense');
    const grouped: Record<string, { description: string, amount: number, id: string }> = {};
    
    recurring.forEach(t => {
      // Use description as key, update amount to most recent
      grouped[t.description] = { 
        id: t.id,
        description: t.description, 
        amount: t.amount 
      };
    });
    
    return Object.values(grouped);
  }, [data.transactions]);

  const targetRate = profile.retirementRate || 1.0;

  const handleSaveRate = () => {
    const numericRate = parseFloat(rateInput.replace(',', '.'));
    if (!isNaN(numericRate)) {
        const updatedProfile = { ...profile, retirementRate: numericRate };
        setProfile(updatedProfile);
        onSaveProfile(updatedProfile);
    }
    setIsEditingRate(false);
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculateNeededCapital = (monthlyAmount: number) => {
    // Calculation: Capital = Monthly Expense / (Rate / 100)
    return monthlyAmount / (targetRate / 100);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                 <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20 text-white">
                    <TrendingUp className="w-6 h-6" />
                 </div>
                 Máquina de Aposentadoria
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Transforme juros em liberdade pagando seus custos fixos.</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Taxa de Rendimento (CDB)</p>
              {isEditingRate ? (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    className="w-16 p-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 outline-none focus:border-indigo-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRate()}
                  />
                  <button onClick={handleSaveRate} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">OK</button>
                </div>
              ) : (
                <p className="font-bold text-indigo-600 flex items-center gap-2">
                  {targetRate}% <span className="text-xs text-slate-400">ao mês</span>
                  <button onClick={() => {
                    setRateInput(String(targetRate));
                    setIsEditingRate(true);
                  }} className="text-slate-400 hover:text-indigo-600">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </p>
              )}
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="relative">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Patrimônio no Fundo</p>
              <div className="flex flex-col items-start gap-2">
                {retirementFund ? (
                  <>
                    <p className="font-bold text-emerald-600">{formatValue(totalInvested)}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowTopup(true)}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm transition-all"
                      >
                        <Plus className="w-3 h-3" /> APORTAR
                      </button>
                      <button 
                        onClick={onNavigateToInvestments}
                        className="p-1 px-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-600 rounded text-[10px] font-bold transition-colors"
                      >
                        VER DETALHES
                      </button>
                    </div>

                    {showTopup && (
                      <div className="absolute top-12 right-0 mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-64 animate-fade-in-down">
                        <div className="flex justify-between items-center mb-2">
                           <p className="text-xs font-bold text-slate-800 dark:text-white uppercase">Novo Aporte</p>
                           <button onClick={() => setShowTopup(false)} className="text-slate-400 hover:text-slate-600">X</button>
                        </div>
                        <CurrencyInput 
                          autoFocus
                          placeholder="Valor em R$"
                          className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={topupAmount}
                          onChangeValue={setTopupAmount}
                          onKeyDown={(e) => e.key === 'Enter' && handleTopup()}
                        />
                        <button onClick={handleTopup} className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700">CONFIRMAR</button>
                      </div>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={handleCreateFund}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm transition-all mt-1"
                  >
                    <Plus className="w-3 h-3" /> CRIAR FUNDO
                  </button>
                )}
              </div>
            </div>
          </div>
      </div>

      {/* SUMMARY DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Target className="w-32 h-32" />
            </div>
            <p className="text-indigo-100 text-sm font-medium">Custo Fixo Mensal Total</p>
            <h3 className="text-3xl font-black mt-1">
              {formatValue(fixedExpenses.reduce((acc, e) => acc + e.amount, 0))}
            </h3>
            <p className="text-indigo-200 text-xs mt-2 italic">Baseado em suas transações recorrentes.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Capital p/ Liberdade Total</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">
              {formatValue(calculateNeededCapital(fixedExpenses.reduce((acc, e) => acc + e.amount, 0)))}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (totalInvested / calculateNeededCapital(fixedExpenses.reduce((acc, e) => acc + e.amount, 0))) * 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-emerald-600">
                {((totalInvested / calculateNeededCapital(fixedExpenses.reduce((acc, e) => acc + e.amount, 0))) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <p className="text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Renda Passiva Atual
            </p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">
              {formatValue(totalInvested * (targetRate / 100))}
            </h3>
            <p className="text-emerald-500 dark:text-emerald-500 text-xs mt-2">Estimativa mensal com taxa de {targetRate}%.</p>
          </div>
      </div>

      {/* FIXED ASSETS LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-slate-800 dark:text-white">Mapeamento de Passivos</h3>
          <p className="text-xs text-slate-500">O app identifica automaticamente gastos fixos marcados como recorrentes.</p>
        </div>

        {fixedExpenses.length === 0 ? (
          <div className="bg-slate-100 dark:bg-slate-800 p-10 rounded-2xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium italic">Nenhum gasto fixo identificado. Marque uma despesa como 'Recorrente' no Financeiro para que ela apareça aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fixedExpenses.map((expense) => {
              const needed = calculateNeededCapital(expense.amount);
              const progress = (totalInvested / needed) * 100;
              const isCovered = totalInvested >= needed;

              return (
                <div key={expense.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isCovered ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {expense.description.toLowerCase().includes('luz') || expense.description.toLowerCase().includes('energia') ? <Zap className="w-5 h-5" /> :
                         expense.description.toLowerCase().includes('net') || expense.description.toLowerCase().includes('internet') ? <Wifi className="w-5 h-5" /> :
                         expense.description.toLowerCase().includes('aluguel') ? <Home className="w-5 h-5" /> :
                         <DollarSign className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{expense.description}</h4>
                        <p className="text-xs text-slate-500 uppercase font-black tracking-tighter">{formatValue(expense.amount)} /mês</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Capital p/ Sustentar</p>
                      <p className="font-bold text-indigo-600">{formatValue(needed)}</p>
                    </div>
                  </div>

                  {/* Progress bar to cover THIS specific expense */}
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Status de Quitação via Rendimento</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isCovered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isCovered ? 'CONTA QUITADA' : `${Math.floor(progress)}% Coberto`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isCovered ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      ></div>
                    </div>
                  </div>

                  {isCovered && (
                    <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 text-white flex items-center justify-center rounded-bl-xl">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TIP PANEL */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 p-6 rounded-2xl flex items-start gap-4">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-amber-800 dark:text-amber-400">Dica da Máquina:</h4>
          <p className="text-sm text-amber-700 dark:text-amber-500 mt-1 mt-1 leading-relaxed">
            Para cada <span className="font-bold italic">PRODUTO CDB</span> que você contratar, verifique se a taxa é de 100% do CDI ou superior. 
            Nesta simulação, consideramos uma taxa líquida (após impostos). Se o rendimento mensal for maior que seu custo, 
            você atingiu a **Micro-Independência Financeira** dessa conta.
          </p>
        </div>
      </div>

    </div>
  );
};
