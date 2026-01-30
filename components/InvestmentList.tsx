
import React, { useState } from 'react';
import { Investment } from '../types';
import { Plus, Trash2, TrendingUp, DollarSign, Target, PlusCircle, X, Sparkles, Loader2, ExternalLink, BrainCircuit, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { getInvestmentAdvice, InvestmentAdviceResult } from '../services/geminiService';

interface InvestmentListProps {
  investments: Investment[];
  onAdd: (inv: Omit<Investment, 'id'>) => void;
  onUpdate: (id: string, newAmount: number) => void;
  onDelete: (id: string) => void;
  privacyMode: boolean;
  hasApiKey: boolean;
}

export const InvestmentList: React.FC<InvestmentListProps> = ({ investments, onAdd, onUpdate, onDelete, privacyMode, hasApiKey }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // AI Consultant State
  const [aiAdvice, setAiAdvice] = useState<InvestmentAdviceResult | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  // State for adding contribution (Top-up)
  const [contributionId, setContributionId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const [newInvest, setNewInvest] = useState({
    name: '',
    amount: '',
    targetAmount: '',
    type: 'Renda Fixa',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: newInvest.name,
      amount: parseFloat(newInvest.amount),
      targetAmount: parseFloat(newInvest.targetAmount) || 0,
      type: newInvest.type,
      date: newInvest.date
    });
    setNewInvest({ ...newInvest, name: '', amount: '', targetAmount: '' });
    setIsFormOpen(false);
  };

  const handleContributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionId) return;

    const investment = investments.find(i => i.id === contributionId);
    if (investment) {
      const addedValue = parseFloat(contributionAmount);
      if (!isNaN(addedValue) && addedValue > 0) {
        onUpdate(contributionId, investment.amount + addedValue);
      }
    }
    setContributionId(null);
    setContributionAmount('');
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

  // Logic to split the advice with the new safer delimiter
  const getParsedAdvice = () => {
    if (!aiAdvice) return { recommendations: '', technical: '' };
    // The separator is defined in geminiService.ts
    const parts = aiAdvice.text.split('---SECTION-BREAK---');
    return {
      recommendations: parts[0].trim(),
      technical: parts.length > 1 ? parts[1].trim() : ''
    };
  };

  const { recommendations, technical } = getParsedAdvice();

  const totalInvested = investments.reduce((sum, item) => sum + item.amount, 0);
  
  // Helper to mask values
  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Meus Investimentos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Acompanhe a evolução do seu patrimônio e metas</p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={handleConsultAi}
                disabled={!hasApiKey}
                title={!hasApiKey ? "Configure a Chave API para usar" : "Consultor IA"}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm
                   ${!hasApiKey 
                     ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60'
                     : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                   }`}
            >
                <Sparkles className="w-4 h-4" />
                Consultor IA {!hasApiKey && <span className="text-[10px] ml-1">(Req. Chave)</span>}
            </button>
            <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm"
            >
            <Plus className="w-4 h-4" />
            Novo Ativo
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg md:col-span-3 lg:col-span-1 flex flex-col justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">Total Acumulado</p>
            <h3 className="text-3xl font-bold">{formatValue(totalInvested)}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-indigo-100 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Patrimônio em crescimento</span>
          </div>
        </div>
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
                          {/* Direct Recommendations */}
                          <div className="prose prose-sm prose-purple dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                              <div dangerouslySetInnerHTML={{ __html: recommendations.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/- /g, '• ') }} />
                          </div>
                          
                          {/* Technical Toggle */}
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
                                      <div dangerouslySetInnerHTML={{ __html: technical.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/- /g, '• ') }} />
                                   </div>
                                </div>
                              )}
                            </div>
                          )}

                          {aiAdvice.sources.length > 0 && (
                              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Fontes Consultadas (Google Search)</p>
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
                             <button 
                                onClick={handleConsultAi}
                                className="text-sm text-purple-600 hover:underline"
                             >
                                Atualizar Recomendação
                             </button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center text-slate-500">Erro ao carregar recomendação.</div>
                  )}
              </div>
          </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
           <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Adicionar Novo Investimento</h3>
          </div>
          
          <input
            required
            type="text"
            placeholder="Nome do Ativo (ex: CDB Banco X)"
            value={newInvest.name}
            onChange={e => setNewInvest({ ...newInvest, name: e.target.value })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          
          <input
            required
            type="number"
            placeholder="Valor Inicial (R$)"
            value={newInvest.amount}
            onChange={e => setNewInvest({ ...newInvest, amount: e.target.value })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <input
            required
            type="number"
            placeholder="Objetivo Final (R$)"
            value={newInvest.targetAmount}
            onChange={e => setNewInvest({ ...newInvest, targetAmount: e.target.value })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <select
            value={newInvest.type}
            onChange={e => setNewInvest({ ...newInvest, type: e.target.value })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2"
          >
            <option value="Renda Fixa">Renda Fixa</option>
            <option value="Ações">Ações</option>
            <option value="FIIs">FIIs</option>
            <option value="Cripto">Criptomoedas</option>
            <option value="Reserva">Reserva de Emergência</option>
          </select>

          <input
            required
            type="date"
            value={newInvest.date}
            onChange={e => setNewInvest({ ...newInvest, date: e.target.value })}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 md:col-span-2"
          />

           <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      {/* Contribution Modal Overlay */}
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
              Adicionar valor ao ativo: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{investments.find(i => i.id === contributionId)?.name}</span>
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

      <div className="grid grid-cols-1 gap-4">
        {investments.length === 0 ? (
           <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
             Você ainda não registrou investimentos.
           </div>
        ) : (
          investments.map(inv => {
            const percentage = inv.targetAmount && inv.targetAmount > 0 
              ? Math.min(100, (inv.amount / inv.targetAmount) * 100)
              : 0;

            return (
              <div key={inv.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white text-lg">{inv.name}</h4>
                      <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{inv.type}</span>
                        <span>{new Date(inv.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6">
                    <div className="text-right mr-2">
                      <span className="block text-sm text-slate-500 dark:text-slate-400">Atual</span>
                      <span className="font-bold text-slate-800 dark:text-white text-lg">{formatValue(inv.amount)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setContributionId(inv.id)}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                        title="Adicionar Aporte"
                      >
                        <PlusCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(inv.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Excluir Ativo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                {inv.targetAmount > 0 && (
                  <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-end mb-1">
                      <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        <Target className="w-3 h-3" />
                        <span>Meta: {formatValue(inv.targetAmount)}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
