
import React, { useState, useMemo, useEffect } from 'react';
import { AppData, WealthProfile, RiskProfile } from '../types';
import { Landmark, TrendingUp, ShieldCheck, Target, Lock, BrainCircuit, Sparkles, AlertCircle, ChevronRight, Gem } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { analyzeWealthPortfolio, WealthAnalysisResult } from '../services/geminiService';

interface WealthPlannerProps {
  data: AppData;
  onSaveProfile: (profile: WealthProfile) => void;
  privacyMode: boolean;
  hasApiKey: boolean;
}

const DEFAULT_PROFILE: WealthProfile = {
    age: 30,
    retirementAge: 60,
    riskProfile: 'moderate'
};

const RISK_LABELS: Record<RiskProfile, string> = {
    'conservative': 'Conservador (Preservação)',
    'moderate': 'Moderado (Equilíbrio)',
    'aggressive': 'Arrojado (Crescimento)'
};

const RISK_RETURNS: Record<RiskProfile, number> = {
    'conservative': 0.03, // 3% real return above inflation
    'moderate': 0.05,     // 5% real return
    'aggressive': 0.07    // 7% real return
};

export const WealthPlanner: React.FC<WealthPlannerProps> = ({ data, onSaveProfile, privacyMode, hasApiKey }) => {
  const [profile, setProfile] = useState<WealthProfile>(data.wealthProfile || DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(!data.wealthProfile);
  const [aiAnalysis, setAiAnalysis] = useState<WealthAnalysisResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // --- CALCULATION ENGINE ---

  // 1. Determine baseline metrics
  const totalInvested = useMemo(() => data.investments.reduce((acc, i) => acc + i.amount, 0), [data.investments]);
  const totalDebt = useMemo(() => data.debts.filter(d => d.status !== 'paid').reduce((acc, d) => acc + d.currentAmount, 0), [data.debts]);
  const netWorth = totalInvested - totalDebt;

  // 2. Determine Cash Flow (Burn Rate vs Savings)
  // Simplified: Use last month's transactions or average
  const monthlyMetrics = useMemo(() => {
      const income = data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      // Fallback if no transactions: assume 20% savings rate on a 5k income
      if (income === 0 && expense === 0) return { income: 5000, expense: 4000, savings: 1000 };
      
      const realSavings = income - expense;
      return { 
          income, 
          expense: expense > 0 ? expense : income * 0.8, 
          savings: realSavings 
      };
  }, [data.transactions]);

  const effectiveContribution = profile.monthlyContributionOverride !== undefined 
        ? profile.monthlyContributionOverride 
        : Math.max(0, monthlyMetrics.savings);

  // 3. Projection Logic (The Engine)
  const projectionData = useMemo(() => {
      const chartData = [];
      const currentYear = new Date().getFullYear();
      const yearsToProject = profile.retirementAge - profile.age + 10; // Go 10 years past retirement target
      const realRate = RISK_RETURNS[profile.riskProfile];
      const annualContribution = effectiveContribution * 12;
      const annualExpense = monthlyMetrics.expense * 12;

      let currentPot = netWorth;
      let freedomYear = null;

      for (let i = 0; i <= yearsToProject; i++) {
          const year = currentYear + i;
          const age = profile.age + i;
          
          // Passive Income using 4% Rule (Safe Withdrawal Rate)
          const passiveIncomeYearly = currentPot * 0.04; 
          
          if (!freedomYear && passiveIncomeYearly >= annualExpense) {
              freedomYear = year;
          }

          chartData.push({
              year,
              age,
              patrimonio: Math.round(currentPot),
              rendaPassiva: Math.round(passiveIncomeYearly / 12), // Monthly passive
              custoVida: Math.round(monthlyMetrics.expense), // Monthly cost (assumed constant in real terms)
          });

          // Compound for next year
          if (age < profile.retirementAge) {
             currentPot = (currentPot * (1 + realRate)) + annualContribution;
          } else {
             // Post retirement: assume no contribution, just growth minus withdrawal? 
             // For simple viz, let's keep adding growth but stop contributions
             currentPot = (currentPot * (1 + realRate));
          }
      }
      return { chartData, freedomYear };
  }, [profile, netWorth, effectiveContribution, monthlyMetrics.expense]);

  const handleSave = () => {
      onSaveProfile(profile);
      setIsEditing(false);
  };

  const handleRunAi = async () => {
      setLoadingAi(true);
      const result = await analyzeWealthPortfolio(data.investments, profile.riskProfile, profile.age);
      setAiAnalysis(result);
      setLoadingAi(false);
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* HEADER: PREMIUM FEEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                 <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg shadow-yellow-500/20 text-white">
                    <Gem className="w-6 h-6" />
                 </div>
                 NEXO Private
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Planejamento patrimonial e alocação estratégica de ativos.</p>
          </div>
          
          {!isEditing && (
              <button 
                 onClick={() => setIsEditing(true)}
                 className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                 Ajustar Perfil
              </button>
          )}
      </div>

      {/* 1. PROFILE CARD (Inputs) */}
      {isEditing && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-yellow-500 animate-scale-in">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <Lock className="w-5 h-5 text-yellow-500" /> Parâmetros da Simulação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Idade Atual</label>
                      <input 
                         type="number" 
                         value={profile.age}
                         onChange={(e) => setProfile({...profile, age: Number(e.target.value)})}
                         className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Idade Aposentadoria</label>
                      <input 
                         type="number" 
                         value={profile.retirementAge}
                         onChange={(e) => setProfile({...profile, retirementAge: Number(e.target.value)})}
                         className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Perfil de Risco</label>
                      <select 
                         value={profile.riskProfile}
                         onChange={(e) => setProfile({...profile, riskProfile: e.target.value as RiskProfile})}
                         className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                      >
                         <option value="conservative">Conservador</option>
                         <option value="moderate">Moderado</option>
                         <option value="aggressive">Arrojado</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Aporte Mensal (Simulado)</label>
                      <input 
                         type="number" 
                         placeholder={`Atual: R$ ${monthlyMetrics.savings.toFixed(0)}`}
                         value={profile.monthlyContributionOverride || ''}
                         onChange={(e) => setProfile({...profile, monthlyContributionOverride: Number(e.target.value)})}
                         className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                      />
                  </div>
              </div>
              <div className="mt-6 flex justify-end">
                  <button 
                     onClick={handleSave}
                     className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
                  >
                     Atualizar Projeção
                  </button>
              </div>
          </div>
      )}

      {/* 2. PROJECTION CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 text-white p-6 rounded-xl shadow-2xl relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

               <div className="relative z-10 flex justify-between items-start mb-6">
                   <div>
                       <h3 className="text-xl font-bold flex items-center gap-2">
                           <TrendingUp className="w-5 h-5 text-emerald-400" />
                           Liberdade Financeira
                       </h3>
                       <p className="text-slate-400 text-sm">Cruzamento entre Renda Passiva e Custo de Vida.</p>
                   </div>
                   <div className="text-right">
                       <p className="text-xs text-slate-400 uppercase font-bold">Ano da Liberdade</p>
                       <p className="text-3xl font-bold text-yellow-400">{projectionData.freedomYear || "Em construção..."}</p>
                   </div>
               </div>

               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorPassive" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                          <YAxis 
                             hide 
                             domain={['auto', 'auto']}
                          />
                          <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                              formatter={(value: number) => [formatValue(value), '']}
                          />
                          <ReferenceLine y={monthlyMetrics.expense} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Custo Vida', fill: '#f43f5e', fontSize: 10 }} />
                          <Area type="monotone" dataKey="rendaPassiva" stroke="#10b981" fillOpacity={1} fill="url(#colorPassive)" name="Renda Passiva" />
                      </AreaChart>
                  </ResponsiveContainer>
               </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
               <div className="mb-6">
                   <p className="text-xs font-bold text-slate-500 uppercase">Patrimônio Líquido Atual</p>
                   <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatValue(netWorth)}</p>
               </div>
               
               <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-600 dark:text-slate-400">Ativos Investidos</span>
                       <span className="font-semibold text-emerald-600">{formatValue(totalInvested)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-600 dark:text-slate-400">Dívidas Totais</span>
                       <span className="font-semibold text-rose-600">{formatValue(totalDebt)}</span>
                   </div>
                   <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                   <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-600 dark:text-slate-400">Aporte Mensal</span>
                       <span className="font-semibold text-indigo-600">{formatValue(effectiveContribution)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-600 dark:text-slate-400">Rentabilidade Real (Proj.)</span>
                       <span className="font-semibold text-slate-800 dark:text-white">{(RISK_RETURNS[profile.riskProfile] * 100).toFixed(1)}% a.a.</span>
                   </div>
               </div>

               {totalDebt > totalInvested && (
                   <div className="mt-6 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg flex items-start gap-2">
                       <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0" />
                       <p className="text-xs text-rose-800 dark:text-rose-300">
                           Atenção: Seu patrimônio está negativo. A prioridade do planejamento deve ser a quitação de dívidas antes da acumulação.
                       </p>
                   </div>
               )}
          </div>
      </div>

      {/* 3. AI PORTFOLIO ANALYSIS */}
      <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-purple-600" />
                  Alocação Inteligente (IA)
              </h3>
              <button 
                 onClick={handleRunAi}
                 disabled={!hasApiKey || loadingAi}
                 className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm shadow-md"
              >
                 {loadingAi ? <span className="animate-spin">⏳</span> : <Sparkles className="w-4 h-4" />}
                 {aiAnalysis ? 'Atualizar Análise' : 'Gerar Estratégia Private'}
              </button>
          </div>

          {!hasApiKey && (
              <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-xl text-center border border-dashed border-slate-300 dark:border-slate-600">
                  <Lock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">Configure sua Chave API para desbloquear a inteligência de alocação de ativos.</p>
              </div>
          )}

          {hasApiKey && aiAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  {/* Analysis Text & Actions */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                      <h4 className="font-bold text-slate-800 dark:text-white mb-3">Diagnóstico do Portfólio</h4>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                          {aiAnalysis.analysisText}
                      </p>

                      <h4 className="font-bold text-slate-800 dark:text-white mb-3">Plano de Ação Tático</h4>
                      <div className="space-y-3">
                          {aiAnalysis.actionItems.map((action, idx) => (
                              <div key={idx} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                  <div className={`
                                      w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-xs
                                      ${action.type === 'buy' ? 'bg-emerald-100 text-emerald-700' : action.type === 'sell' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}
                                  `}>
                                      {action.type === 'buy' ? 'COMPRA' : action.type === 'sell' ? 'VENDA' : 'MANTER'}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-800 dark:text-white text-sm">{action.title}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">{action.description}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Allocation Chart (Radar/Comparison) */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                      <h4 className="font-bold text-slate-800 dark:text-white mb-2 self-start">Atual vs. Ideal (Modelo)</h4>
                      <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                                  // Merge current and suggested data for the chart
                                  aiAnalysis.suggestedAllocation.map(s => {
                                      const current = aiAnalysis.currentAllocation.find(c => c.name === s.name);
                                      return {
                                          subject: s.name,
                                          A: current ? current.value : 0,
                                          B: s.value,
                                          fullMark: 100
                                      }
                                  })
                              }>
                                  <PolarGrid stroke="#94a3b8" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                  <Radar name="Sua Carteira" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                  <Radar name="Ideal (IA)" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                  <Legend />
                                  <RechartsTooltip />
                              </RadarChart>
                          </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-center text-slate-400 mt-2">Comparativo de % de alocação por classe de ativo.</p>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
