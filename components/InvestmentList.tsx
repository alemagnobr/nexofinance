
import React, { useState, useEffect, useMemo } from 'react';
import { Investment, View } from '../types';
import { Plus, Trash2, TrendingUp, DollarSign, Target, PlusCircle, X, Sparkles, Loader2, ExternalLink, BrainCircuit, ChevronDown, ChevronUp, BookOpen, Compass, TrendingDown, PieChart as PieChartIcon, Edit2, Save, History } from 'lucide-react';
import { getInvestmentAdvice, InvestmentAdviceResult } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';

interface InvestmentListProps {
  investments: Investment[];
  onAdd: (inv: Omit<Investment, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Investment>) => void;
  onDelete: (id: string) => void;
  onNavigate: (view: View) => void;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal?: number; // Prop to trigger form open
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

export const InvestmentList: React.FC<InvestmentListProps> = ({ investments, onAdd, onUpdate, onDelete, onNavigate, privacyMode, hasApiKey, quickActionSignal }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formStep, setFormStep] = useState<'select' | 'form'>('select');
  
  // AI Consultant State
  const [aiAdvice, setAiAdvice] = useState<InvestmentAdviceResult | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  // State for adding contribution (Top-up)
  const [contributionId, setContributionId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().split('T')[0]);

  // State for expanding history on card
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // State for inline editing (Current Price)
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  // State for inline editing (Target Amount)
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editingTargetValue, setEditingTargetValue] = useState('');

  // State for full investment editing modal
  const [editingFullInvestment, setEditingFullInvestment] = useState<Investment | null>(null);
  const [editTab, setEditTab] = useState<'details' | 'history'>('details');

  const [newInvest, setNewInvest] = useState({
    name: '',
    amount: '',
    investedAmount: '', // Novo campo: Custo
    targetAmount: '',
    type: 'Renda Fixa',
    date: new Date().toISOString().split('T')[0],
    assetCategory: 'market' as 'market' | 'fund',
    bank: '',
    fund: ''
  });

  // Effect to listen for Quick Action triggers
  useEffect(() => {
    if (quickActionSignal && Date.now() - quickActionSignal < 2000) {
        setIsFormOpen(true);
        setFormStep('select');
        setNewInvest({ name: '', amount: '', investedAmount: '', targetAmount: '', type: 'Renda Fixa', date: new Date().toISOString().split('T')[0], assetCategory: 'market', bank: '', fund: '' });
    }
  }, [quickActionSignal]);

  // --- CHART DATA (Allocation) ---
  const allocationData = useMemo(() => {
      const map = new Map<string, number>();
      investments.forEach(inv => {
          map.set(inv.type, (map.get(inv.type) || 0) + inv.amount);
      });
      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [investments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Para caixinhas/fundos, o valor inicial é 0
    const currentVal = newInvest.assetCategory === 'fund' ? 0 : (parseFloat(newInvest.amount) || 0);
    // Se o valor investido (custo) não for preenchido, assume igual ao atual
    const investedVal = newInvest.assetCategory === 'fund' ? 0 : (newInvest.investedAmount ? parseFloat(newInvest.investedAmount) : currentVal);

    onAdd({
      name: newInvest.name,
      amount: currentVal,
      investedAmount: investedVal,
      targetAmount: parseFloat(newInvest.targetAmount) || 0,
      type: newInvest.type,
      date: newInvest.date,
      assetCategory: newInvest.assetCategory,
      bank: newInvest.bank,
      fund: newInvest.fund,
      lastContribution: investedVal,
      history: investedVal > 0 ? [{
        id: crypto.randomUUID(),
        date: newInvest.date,
        amount: investedVal,
        type: 'contribution'
      }] : []
    });
    setNewInvest({ name: '', amount: '', investedAmount: '', targetAmount: '', type: 'Renda Fixa', date: new Date().toISOString().split('T')[0], assetCategory: 'market', bank: '', fund: '' });
    setIsFormOpen(false);
    setFormStep('select');
  };

  const handleContributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionId) return;

    const investment = investments.find(i => i.id === contributionId);
    if (investment) {
      const addedValue = parseFloat(contributionAmount);
      if (!isNaN(addedValue) && addedValue > 0) {
        // Aporte: Aumenta tanto o Valor de Mercado (amount) quanto o Custo (investedAmount)
        const currentCost = investment.investedAmount ?? investment.amount;
        
        const newHistory = [...(investment.history || []), {
          id: crypto.randomUUID(),
          date: contributionDate,
          amount: addedValue,
          type: 'contribution' as const
        }];

        onUpdate(contributionId, {
            amount: investment.amount + addedValue,
            investedAmount: currentCost + addedValue,
            lastContribution: addedValue,
            lastContributionDate: contributionDate,
            history: newHistory
        });
      }
    }
    setContributionId(null);
    setContributionAmount('');
    setContributionDate(new Date().toISOString().split('T')[0]);
  };

  const handleSavePriceEdit = (id: string) => {
      const val = parseFloat(editingPriceValue);
      if (!isNaN(val) && val >= 0) {
          // Atualiza APENAS o valor de mercado (amount), mantendo o custo (investedAmount)
          onUpdate(id, { amount: val });
      }
      setEditingPriceId(null);
  };

  const handleSaveTargetEdit = (id: string) => {
      const val = parseFloat(editingTargetValue);
      if (!isNaN(val) && val >= 0) {
          onUpdate(id, { targetAmount: val });
      }
      setEditingTargetId(null);
  };

  const handleConsultAi = async () => {
    if (!hasApiKey) return;
    setShowAiPanel(true);
    setLoadingAdvice(true);
    setAiAdvice(null);
    setShowTechnical(false);
    const result = await getInvestmentAdvice(investments);
    setAiAdvice(result);
    setLoadingAdvice(false);
  };

  const getParsedAdvice = () => {
    if (!aiAdvice) return { recommendations: '', technical: '' };
    const parts = aiAdvice.text.split('---SECTION-BREAK---');
    return {
      recommendations: parts[0].trim(),
      technical: parts.length > 1 ? parts[1].trim() : ''
    };
  };

  const { recommendations, technical } = getParsedAdvice();

  const totalCurrent = investments.reduce((sum, item) => sum + item.amount, 0);
  const totalCost = investments.reduce((sum, item) => sum + (item.investedAmount ?? item.amount), 0);
  const totalProfit = totalCurrent - totalCost;
  const totalRoi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  
  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Meus Investimentos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Acompanhe rentabilidade e metas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button 
                onClick={() => onNavigate(View.BUDGETS)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/40 transition-all font-medium text-sm border border-pink-200 dark:border-pink-800"
            >
                <Target className="w-4 h-4" />
                Metas
            </button>

            <button
                onClick={handleConsultAi}
                disabled={!hasApiKey}
                title={!hasApiKey ? "Configure a Chave API para usar" : "Consultor IA"}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm text-sm font-medium
                   ${!hasApiKey 
                     ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60'
                     : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                   }`}
            >
                <Sparkles className="w-4 h-4" />
                Consultor IA {!hasApiKey && <span className="text-[10px] ml-1">(Req. Chave)</span>}
            </button>
            <button
            onClick={() => {
                setIsFormOpen(!isFormOpen);
                setFormStep('select');
                setNewInvest({ name: '', amount: '', investedAmount: '', targetAmount: '', type: 'Renda Fixa', date: new Date().toISOString().split('T')[0], assetCategory: 'market', bank: '', fund: '' });
            }}
            className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm text-sm font-medium"
            >
            <Plus className="w-4 h-4" />
            Novo Investimento
            </button>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Card */}
        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Patrimônio Total</p>
            <h3 className="text-3xl font-bold mb-1">{formatValue(totalCurrent)}</h3>
            
            <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded bg-white/20 flex items-center gap-1 ${totalProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {totalProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {totalRoi.toFixed(2)}%
                </span>
                <span className="text-[10px] text-indigo-200">
                    ({totalProfit >= 0 ? '+' : ''}{formatValue(totalProfit)})
                </span>
            </div>
          </div>
          <DollarSign className="absolute right-4 bottom-4 w-24 h-24 text-indigo-500 opacity-20 pointer-events-none" />
        </div>

        {/* Allocation Chart */}
        {allocationData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-2 flex items-center">
                <div className="flex-1 h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={allocationData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={40} 
                                outerRadius={60} 
                                paddingAngle={5} 
                                dataKey="value"
                            >
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                                formatter={(value: number) => privacyMode ? '••••' : `R$ ${value.toLocaleString('pt-BR')}`} 
                            />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px'}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-px h-20 bg-slate-100 dark:bg-slate-700 mx-4"></div>
                <div className="pr-4 min-w-[120px]">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1"><PieChartIcon className="w-3 h-3"/> Alocação</p>
                    {allocationData.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs mb-1">
                            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{item.name}</span>
                            <span className="font-bold text-slate-800 dark:text-white">{((item.value / totalCurrent) * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* AI Consultant Panel */}
      {showAiPanel && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-purple-200 dark:border-purple-900 overflow-hidden animate-fade-in">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-4 border-b border-purple-100 dark:border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-bold text-purple-900 dark:text-purple-300">Smart Advisor</h3>
                  </div>
                  <button onClick={() => setShowAiPanel(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                  </button>
              </div>
              <div className="p-6">
                  {loadingAdvice ? (
                      <div className="flex flex-col items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
                          <p className="text-slate-500 text-sm animate-pulse">Buscando oportunidades em tempo real...</p>
                      </div>
                  ) : aiAdvice ? (
                      <div className="space-y-6">
                          <div className="prose prose-sm prose-purple dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                              <div className="markdown-body">
                                  <ReactMarkdown>{recommendations}</ReactMarkdown>
                              </div>
                          </div>
                          
                          {technical && (
                            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                              <button 
                                onClick={() => setShowTechnical(!showTechnical)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-600"
                              >
                                <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                {showTechnical ? 'Ocultar Detalhes Técnicos' : 'Ver Análise Técnica Detalhada'}
                                {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              {showTechnical && (
                                <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
                                   <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
                                      <div className="markdown-body">
                                          <ReactMarkdown>{technical}</ReactMarkdown>
                                      </div>
                                   </div>
                                </div>
                              )}
                            </div>
                          )}

                          {aiAdvice.sources.length > 0 && (
                              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Fontes Consultadas</p>
                                  <div className="flex flex-wrap gap-2">
                                      {aiAdvice.sources.map((source, idx) => (
                                          <a 
                                              key={idx} 
                                              href={source.uri} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                          >
                                              <ExternalLink className="w-3 h-3" />
                                              {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                                          </a>
                                      ))}
                                  </div>
                              </div>
                          )}
                          <div className="mt-4 flex justify-end">
                             <button onClick={handleConsultAi} className="text-sm text-purple-600 hover:underline">Atualizar Recomendação</button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center text-slate-500">Erro ao carregar recomendação.</div>
                  )}
              </div>
          </div>
      )}

      {/* NEW ASSET FORM */}
      {isFormOpen && formStep === 'select' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 animate-fade-in-down">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">O que você deseja adicionar?</h3>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={() => {
                        setNewInvest({...newInvest, assetCategory: 'fund', type: 'Reserva de Emergência'});
                        setFormStep('form');
                    }}
                    className="flex flex-col items-center text-center p-6 border-2 border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                >
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">Caixinha / Fundo</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Poupança, CDB, Tesouro, Caixinhas. Focado em saldo e aportes.</p>
                </button>
                <button 
                    onClick={() => {
                        setNewInvest({...newInvest, assetCategory: 'market', type: 'Ações'});
                        setFormStep('form');
                    }}
                    className="flex flex-col items-center text-center p-6 border-2 border-slate-100 dark:border-slate-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                >
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">Ativo de Mercado</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ações, FIIs, Criptomoedas. Focado em preço de compra e cotação.</p>
                </button>
            </div>
        </div>
      )}

      {isFormOpen && formStep === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
           <div className="col-span-1 md:col-span-2 flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {newInvest.assetCategory === 'fund' ? 'Adicionar Nova Caixinha/Fundo' : 'Adicionar Novo Ativo de Mercado'}
            </h3>
            <button type="button" onClick={() => setFormStep('select')} className="text-xs text-indigo-600 hover:underline">Voltar</button>
          </div>
          
          <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
              <input
                required
                type="text"
                placeholder={newInvest.assetCategory === 'fund' ? "Ex: Caixinha Itaú - Reserva" : "Ex: PETR4, Bitcoin"}
                value={newInvest.name}
                onChange={e => setNewInvest({ ...newInvest, name: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
          </div>
          
          {newInvest.assetCategory === 'fund' ? (
              <>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Banco / Instituição</label>
                      <input
                        type="text"
                        placeholder="Ex: Itaú, Nubank, XP"
                        value={newInvest.bank}
                        onChange={e => setNewInvest({ ...newInvest, bank: e.target.value })}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Fundo do Banco</label>
                      <input
                        type="text"
                        placeholder="Ex: Fundo DI, CDB 100% CDI"
                        value={newInvest.fund}
                        onChange={e => setNewInvest({ ...newInvest, fund: e.target.value })}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
              </>
          ) : (
              <>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Valor Atual (Mercado)</label>
                      <input
                        required
                        type="number"
                        placeholder="R$"
                        value={newInvest.amount}
                        onChange={e => setNewInvest({ ...newInvest, amount: e.target.value })}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Valor Investido (Custo)</label>
                      <input
                        type="number"
                        placeholder="Igual ao atual se vazio"
                        value={newInvest.investedAmount}
                        onChange={e => setNewInvest({ ...newInvest, investedAmount: e.target.value })}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
              </>
          )}

          <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Objetivo Final (Meta)</label>
              <input
                type="number"
                placeholder="R$"
                value={newInvest.targetAmount}
                onChange={e => setNewInvest({ ...newInvest, targetAmount: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
          </div>

          <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
              <select
                value={newInvest.type}
                onChange={e => setNewInvest({ ...newInvest, type: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2"
              >
                {newInvest.assetCategory === 'fund' ? (
                    <>
                        <option value="Reserva de Emergência">Reserva de Emergência</option>
                        <option value="Renda Fixa">Renda Fixa (CDB, Tesouro, LCI)</option>
                        <option value="Fundos">Fundos de Investimento</option>
                        <option value="Poupança">Poupança</option>
                        <option value="Outros">Outros</option>
                    </>
                ) : (
                    <>
                        <option value="Ações">Ações</option>
                        <option value="FIIs">FIIs</option>
                        <option value="Cripto">Criptomoedas</option>
                        <option value="BDRs">BDRs / Exterior</option>
                        <option value="Outros">Outros</option>
                    </>
                )}
              </select>
          </div>

          {newInvest.assetCategory === 'market' && (
              <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Data da Compra</label>
                  <input
                    required
                    type="date"
                    value={newInvest.date}
                    onChange={e => setNewInvest({ ...newInvest, date: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2"
                  />
              </div>
          )}

           <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Salvar</button>
          </div>
        </form>
      )}

      {/* CONTRIBUTION MODAL */}
      {contributionId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Novo Aporte</h3>
              <button onClick={() => setContributionId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Ao aportar, o valor será somado ao Custo e ao Valor Atual.
            </p>
            <form onSubmit={handleContributionSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">VALOR DO APORTE</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">R$</span>
                  <input
                    autoFocus
                    required
                    type="number"
                    step="0.01"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg py-2 pl-8 pr-3 focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-medium"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">DATA DO APORTE</label>
                <input
                  required
                  type="date"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  value={contributionDate}
                  onChange={(e) => setContributionDate(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Confirmar Aporte
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INVESTMENT LIST */}
      <div className="grid grid-cols-1 gap-4">
        {investments.length === 0 ? (
           <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
             Você ainda não registrou investimentos.
           </div>
        ) : (
          investments.map(inv => {
            const cost = inv.investedAmount ?? inv.amount;
            const current = inv.amount;
            const profit = current - cost;
            const roi = cost > 0 ? (profit / cost) * 100 : 0;
            
            const percentage = inv.targetAmount && inv.targetAmount > 0 
              ? Math.min(100, (inv.amount / inv.targetAmount) * 100)
              : 0;

            return (
              <div key={inv.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow relative group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white text-lg">{inv.name}</h4>
                      <div className="flex flex-wrap gap-2 text-xs mt-1">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{inv.type}</span>
                        {inv.bank && (
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                                {inv.bank}
                            </span>
                        )}
                        {inv.fund && (
                            <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800">
                                {inv.fund}
                            </span>
                        )}
                        {roi !== 0 && (
                            <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${roi > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                {roi > 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                                {roi.toFixed(2)}%
                            </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between md:justify-end gap-3 md:gap-6 mt-2 md:mt-0">
                    <div className="text-right">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Valor Atual</span>
                        
                        {/* Inline Edit for Current Price */}
                        {editingPriceId === inv.id ? (
                            <div className="flex items-center justify-end gap-1 mt-1">
                                <input 
                                    autoFocus
                                    type="number"
                                    className="w-24 p-1 text-sm border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 text-right"
                                    value={editingPriceValue}
                                    onChange={(e) => setEditingPriceValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSavePriceEdit(inv.id)}
                                    onBlur={() => handleSavePriceEdit(inv.id)}
                                />
                            </div>
                        ) : (
                            <div className="group/edit relative inline-block">
                                <span className="font-bold text-slate-800 dark:text-white text-xl cursor-pointer hover:text-indigo-500 border-b border-dashed border-transparent hover:border-indigo-400 transition-all"
                                      onClick={() => { setEditingPriceId(inv.id); setEditingPriceValue(inv.amount.toString()); }}
                                      title="Clique para atualizar cotação"
                                >
                                    {formatValue(inv.amount)}
                                </span>
                                <Edit2 className="w-3 h-3 text-slate-300 absolute -right-4 top-1 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                            </div>
                        )}

                        <div className="text-xs text-slate-400 mt-1">
                            {inv.assetCategory === 'fund' ? (
                                <span>
                                  Último investimento: <span className="font-medium text-slate-600 dark:text-slate-300">{formatValue(inv.lastContribution ?? cost)}</span>
                                  {inv.lastContributionDate && ` em ${new Date(inv.lastContributionDate).toLocaleDateString('pt-BR')}`}
                                </span>
                            ) : (
                                `Investido: ${formatValue(cost)}`
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setContributionId(inv.id)}
                        className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                        title="Novo Aporte"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedHistoryId(expandedHistoryId === inv.id ? null : inv.id)}
                        className={`p-1.5 rounded-lg transition-colors ${expandedHistoryId === inv.id ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                        title="Ver Histórico"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingFullInvestment(inv)}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Editar Detalhes"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* History Section (Expandable) */}
                {expandedHistoryId === inv.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 animate-fade-in">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                      <History className="w-3 h-3" /> Histórico de Aportes
                    </h4>
                    {(!inv.history || inv.history.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">Nenhum histórico registrado.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                        {inv.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(h => (
                          <div key={h.id} className="flex justify-between items-center text-xs p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded">
                            <span className="text-slate-500 dark:text-slate-400">{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                            <span className={`font-medium ${h.type === 'withdrawal' ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {h.type === 'withdrawal' ? '-' : '+'} {formatValue(h.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Section */}
                {inv.targetAmount > 0 ? (
                  <div className="mt-3 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase flex items-center gap-1">
                                <Target className="w-3 h-3" /> Meta: 
                                {editingTargetId === inv.id ? (
                                    <input 
                                        autoFocus
                                        type="number"
                                        className="w-20 p-0.5 text-[10px] border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600"
                                        value={editingTargetValue}
                                        onChange={(e) => setEditingTargetValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTargetEdit(inv.id)}
                                        onBlur={() => handleSaveTargetEdit(inv.id)}
                                    />
                                ) : (
                                    <span 
                                        className="cursor-pointer hover:text-indigo-500 border-b border-dashed border-transparent hover:border-indigo-400 transition-all flex items-center gap-1 group/meta"
                                        onClick={() => { setEditingTargetId(inv.id); setEditingTargetValue(inv.targetAmount.toString()); }}
                                        title="Clique para alterar a meta"
                                    >
                                        {formatValue(inv.targetAmount)}
                                        <Edit2 className="w-3 h-3 opacity-40 group-hover/meta:opacity-100 transition-opacity" />
                                    </span>
                                )}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                  </div>
                ) : (
                    <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                          onClick={() => { setEditingTargetId(inv.id); setEditingTargetValue(''); }} 
                          className="text-[10px] text-slate-400 hover:text-indigo-500 flex items-center gap-1 uppercase font-bold tracking-wider"
                       >
                          <Compass className="w-3 h-3" /> Definir Meta
                       </button>
                    </div>
                )}
                {/* Inline Edit for New Target when no target exists */}
                {editingTargetId === inv.id && inv.targetAmount === 0 && (
                    <div className="mt-2 flex justify-end items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Nova Meta:</span>
                        <input 
                            autoFocus
                            type="number"
                            className="w-24 p-1 text-sm border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600"
                            value={editingTargetValue}
                            onChange={(e) => setEditingTargetValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTargetEdit(inv.id)}
                            onBlur={() => handleSaveTargetEdit(inv.id)}
                        />
                    </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FULL EDIT MODAL */}
      {editingFullInvestment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-500" />
                Editar Investimento
              </h3>
              <button onClick={() => setEditingFullInvestment(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex border-b border-slate-100 dark:border-slate-700">
              <button 
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'details' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                onClick={() => setEditTab('details')}
              >
                Detalhes
              </button>
              <button 
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'history' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                onClick={() => setEditTab('history')}
              >
                Histórico
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {editTab === 'details' ? (
                <form id="edit-investment-form" onSubmit={(e) => {
                  e.preventDefault();
                  onUpdate(editingFullInvestment.id, {
                    name: editingFullInvestment.name,
                    type: editingFullInvestment.type,
                    assetCategory: editingFullInvestment.assetCategory,
                    amount: editingFullInvestment.amount,
                    investedAmount: editingFullInvestment.investedAmount,
                    targetAmount: editingFullInvestment.targetAmount,
                    date: editingFullInvestment.date,
                    bank: editingFullInvestment.bank,
                    fund: editingFullInvestment.fund
                  });
                  setEditingFullInvestment(null);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
                    <input 
                      type="text" required
                      className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      value={editingFullInvestment.name}
                      onChange={e => setEditingFullInvestment({...editingFullInvestment, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                      <select 
                        className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={editingFullInvestment.assetCategory || 'market'}
                        onChange={e => setEditingFullInvestment({...editingFullInvestment, assetCategory: e.target.value as 'market'|'fund'})}
                      >
                        <option value="market">Mercado (Ações, FIIs)</option>
                        <option value="fund">Caixinha / Fundo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                      <input 
                        type="text" required
                        className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={editingFullInvestment.type}
                        onChange={e => setEditingFullInvestment({...editingFullInvestment, type: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Atual (R$)</label>
                      <input 
                        type="number" step="0.01" required
                        className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={editingFullInvestment.amount}
                        onChange={e => setEditingFullInvestment({...editingFullInvestment, amount: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custo Investido (R$)</label>
                      <input 
                        type="number" step="0.01" required
                        className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={editingFullInvestment.investedAmount ?? editingFullInvestment.amount}
                        onChange={e => setEditingFullInvestment({...editingFullInvestment, investedAmount: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Meta (R$)</label>
                      <input 
                        type="number" step="0.01"
                        className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={editingFullInvestment.targetAmount}
                        onChange={e => setEditingFullInvestment({...editingFullInvestment, targetAmount: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Inicial</label>
                      <input 
                        type="date" required
                        className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        value={editingFullInvestment.date}
                        onChange={e => setEditingFullInvestment({...editingFullInvestment, date: e.target.value})}
                      />
                    </div>
                  </div>
                  {editingFullInvestment.assetCategory === 'fund' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Banco / Instituição</label>
                        <input 
                          type="text"
                          className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          value={editingFullInvestment.bank || ''}
                          onChange={e => setEditingFullInvestment({...editingFullInvestment, bank: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fundo do Banco</label>
                        <input 
                          type="text"
                          className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          value={editingFullInvestment.fund || ''}
                          onChange={e => setEditingFullInvestment({...editingFullInvestment, fund: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <div className="space-y-3">
                  {(!editingFullInvestment.history || editingFullInvestment.history.length === 0) ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <p className="text-sm">Nenhum histórico de aportes registrado.</p>
                      <p className="text-xs mt-1">Os novos aportes aparecerão aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editingFullInvestment.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(h => (
                        <div key={h.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {h.type === 'contribution' ? 'Aporte' : h.type === 'withdrawal' ? 'Resgate' : 'Rendimento'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(h.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${h.type === 'withdrawal' ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {h.type === 'withdrawal' ? '-' : '+'} {formatValue(h.amount)}
                            </span>
                            <button 
                              onClick={() => {
                                const newHistory = editingFullInvestment.history!.filter(item => item.id !== h.id);
                                const newInvested = (editingFullInvestment.investedAmount ?? editingFullInvestment.amount) - (h.type === 'contribution' ? h.amount : 0);
                                const newAmount = editingFullInvestment.amount - (h.type === 'contribution' ? h.amount : 0);
                                
                                const updatedInv = {
                                  ...editingFullInvestment,
                                  history: newHistory,
                                  investedAmount: newInvested,
                                  amount: newAmount
                                };
                                setEditingFullInvestment(updatedInv);
                                onUpdate(updatedInv.id, {
                                  history: newHistory,
                                  investedAmount: newInvested,
                                  amount: newAmount
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                              title="Excluir aporte"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setEditingFullInvestment(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors text-sm"
              >
                Cancelar
              </button>
              {editTab === 'details' && (
                <button 
                  type="submit"
                  form="edit-investment-form"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
