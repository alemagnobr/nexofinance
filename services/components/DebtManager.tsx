
import React, { useState, useMemo, useEffect } from 'react';
import { Debt, Transaction } from '../types';
import { Plus, Trash2, ShieldAlert, AlertTriangle, CheckCircle2, Handshake, CalendarClock, Ban, Filter, ArrowRight, Target, ListFilter, Stamp, Calendar, CheckCheck, HelpCircle, Archive, AlertOctagon, TrendingUp, Calculator, Layers, Globe, Link } from 'lucide-react';

interface DebtManagerProps {
  debts: Debt[];
  onAdd: (debt: Omit<Debt, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Debt>) => void;
  onDelete: (id: string) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  privacyMode: boolean;
  quickActionSignal?: number; // Prop to trigger form open
}

const NEGOTIATION_PLATFORMS = [
    'Serasa Limpa Nome',
    'Acordo Certo',
    'Desenrola Brasil',
    'SPC Brasil',
    'Boa Vista (Consumidor Positivo)',
    'Direto com Banco/Credor',
    'QueroQuitar',
    'Pessoal/Família',
    'Outros'
];

export const DebtManager: React.FC<DebtManagerProps> = ({ debts, onAdd, onUpdate, onDelete, onAddTransaction, privacyMode, quickActionSignal }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewFilter, setViewFilter] = useState<'all' | 'active' | 'prescribed'>('all');

  // Modal State for Agreement
  const [agreementModal, setAgreementModal] = useState<{
    isOpen: boolean;
    debtId: string;
  }>({ isOpen: false, debtId: '' });

  const [agreementDetails, setAgreementDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    installments: 1
  });

  // Modal State for Interest
  const [interestModal, setInterestModal] = useState<{
      isOpen: boolean;
      debtId: string;
      currentValue: number;
  }>({ isOpen: false, debtId: '', currentValue: 0 });
  const [interestRate, setInterestRate] = useState<string>('1');

  const [newDebt, setNewDebt] = useState({
    creditor: '',
    originalAmount: '',
    currentAmount: '',
    targetAmount: '',
    dueDate: '',
    status: 'open' as Debt['status'],
    platform: 'Serasa Limpa Nome',
    customPlatform: '', // Campo auxiliar para "Outros"
    notes: ''
  });

  // Effect to listen for Quick Action triggers
  useEffect(() => {
    if (quickActionSignal && Date.now() - quickActionSignal < 2000) {
        setIsFormOpen(true);
        setNewDebt({ creditor: '', originalAmount: '', currentAmount: '', targetAmount: '', dueDate: '', status: 'open', platform: 'Serasa Limpa Nome', customPlatform: '', notes: '' });
    }
  }, [quickActionSignal]);

  // Helper: Check if debt is prescribed (5 years rule in Brazil)
  const isPrescribed = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffYears = (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears >= 5;
  };

  const filteredAndSortedDebts = useMemo(() => {
    let result = [...debts];

    // Apply Filter
    if (viewFilter === 'active') {
      result = result.filter(d => !isPrescribed(d.dueDate));
    } else if (viewFilter === 'prescribed') {
      result = result.filter(d => isPrescribed(d.dueDate));
    }

    // Sort Priority:
    // 1. Agreement (Acordo Fechado)
    // 2. Negotiating (Em Negociação)
    // 3. Open Active (Em Aberto Recente)
    // 4. Open Prescribed (Em Aberto Antiga)
    // 5. Paid (Quitado)
    return result.sort((a, b) => {
      const getScore = (d: Debt) => {
        if (d.status === 'paid') return 500; // Last
        if (d.status === 'agreement') return 1; // First
        if (d.status === 'negotiating') return 2;
        
        // Status is Open
        if (isPrescribed(d.dueDate)) return 4;
        return 3;
      };

      const scoreA = getScore(a);
      const scoreB = getScore(b);

      if (scoreA !== scoreB) return scoreA - scoreB;
      
      // Secondary sort: Amount (Higher first)
      return b.currentAmount - a.currentAmount;
    });
  }, [debts, viewFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic: If targetAmount is empty, save as 0 (Sem Meta)
    const target = newDebt.targetAmount ? parseFloat(newDebt.targetAmount) : 0;
    
    // Define a plataforma final
    const finalPlatform = newDebt.platform === 'Outros' ? newDebt.customPlatform : newDebt.platform;

    onAdd({
      creditor: newDebt.creditor,
      originalAmount: parseFloat(newDebt.originalAmount),
      currentAmount: parseFloat(newDebt.currentAmount),
      targetAmount: target, 
      dueDate: newDebt.dueDate,
      status: newDebt.status,
      platform: finalPlatform,
      notes: newDebt.notes
    });
    setNewDebt({ creditor: '', originalAmount: '', currentAmount: '', targetAmount: '', dueDate: '', status: 'open', platform: 'Serasa Limpa Nome', customPlatform: '', notes: '' });
    setIsFormOpen(false);
  };

  const handleStatusChange = (debt: Debt, newStatus: string) => {
    if (newStatus === 'agreement' && debt.status !== 'agreement') {
      // Open Modal to schedule payment
      setAgreementModal({
        isOpen: true,
        debtId: debt.id,
      });
      // Pre-fill amount with target if exists, otherwise current
      const suggestedAmount = debt.targetAmount > 0 ? debt.targetAmount : debt.currentAmount;
      setAgreementDetails({
        date: new Date().toISOString().split('T')[0],
        amount: suggestedAmount.toString(),
        installments: 1
      });
    } else {
      onUpdate(debt.id, { status: newStatus as Debt['status'] });
    }
  };

  const confirmAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    const debt = debts.find(d => d.id === agreementModal.debtId);
    if (!debt) return;

    const totalAmount = parseFloat(agreementDetails.amount);
    const installments = Math.max(1, Math.floor(agreementDetails.installments));
    const installmentValue = totalAmount / installments;

    // 1. Update Debt Status AND save the Agreed Amount
    onUpdate(debt.id, { 
      status: 'agreement',
      agreedAmount: totalAmount 
    });

    // 2. Add Transactions to Calendar/Expenses LINKED to the debt
    const startDate = new Date(agreementDetails.date);
    
    for (let i = 0; i < installments; i++) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
        
        const description = installments > 1 
            ? `Acordo: ${debt.creditor} (${i + 1}/${installments})` 
            : `Acordo: ${debt.creditor}`;

        onAddTransaction({
            description: description,
            amount: parseFloat(installmentValue.toFixed(2)), // Ensure 2 decimal places
            type: 'expense',
            category: 'Outros', 
            date: currentDate.toISOString().split('T')[0],
            status: 'pending', 
            paymentMethod: 'pix',
            debtId: debt.id
        });
    }

    alert(`Acordo registrado! ${installments > 1 ? `${installments} parcelas agendadas` : 'Pagamento agendado'}. A dívida será quitada automaticamente quando todas as parcelas forem pagas.`);
    setAgreementModal({ isOpen: false, debtId: ''});
  };

  const openInterestModal = (debt: Debt) => {
      setInterestModal({
          isOpen: true,
          debtId: debt.id,
          currentValue: debt.currentAmount
      });
      setInterestRate('1');
  };

  const applyInterest = () => {
      const debt = debts.find(d => d.id === interestModal.debtId);
      if (debt) {
          const rate = parseFloat(interestRate);
          const newValue = debt.currentAmount * (1 + rate / 100);
          onUpdate(debt.id, { currentAmount: newValue });
      }
      setInterestModal({ isOpen: false, debtId: '', currentValue: 0 });
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const totalDebt = debts.filter(d => d.status !== 'paid').reduce((acc, d) => acc + d.currentAmount, 0);
  const totalTarget = debts.filter(d => d.status !== 'paid').reduce((acc, d) => acc + d.targetAmount, 0);
  
  const potentialSavings = debts
    .filter(d => d.status !== 'paid' && d.targetAmount > 0)
    .reduce((acc, d) => acc + (d.currentAmount - d.targetAmount), 0);

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Interest Modal */}
      {interestModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-rose-500" /> Atualizar Juros
                      </h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">
                      O efeito bola de neve é real. Atualize o valor para manter o controle.
                  </p>
                  
                  <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg mb-4 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-500">Valor Atual</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-white">{formatValue(interestModal.currentValue)}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                      <button onClick={() => setInterestRate('1')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${interestRate === '1' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}>+1%</button>
                      <button onClick={() => setInterestRate('2')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${interestRate === '2' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}>+2%</button>
                      <button onClick={() => setInterestRate('5')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${interestRate === '5' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}>+5%</button>
                      <div className="relative w-20">
                          <input 
                              type="number" 
                              value={interestRate}
                              onChange={(e) => setInterestRate(e.target.value)}
                              className="w-full py-2 pl-2 pr-4 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-xs font-bold text-center outline-none focus:border-rose-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                      </div>
                  </div>

                  <div className="flex gap-2">
                      <button onClick={() => setInterestModal({isOpen:false, debtId:'', currentValue:0})} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold">Cancelar</button>
                      <button onClick={applyInterest} className="flex-1 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-rose-500/20">Aplicar</button>
                  </div>
              </div>
          </div>
      )}

      {/* Agreement Modal */}
      {agreementModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-emerald-500/30 animate-scale-in">
             <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
                <Handshake className="w-8 h-8" />
                <h3 className="text-xl font-bold">Oficializar Acordo</h3>
             </div>
             
             <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
               Qual foi o valor final negociado? Vamos atualizar o card e agendar o(s) pagamento(s).
             </p>

             <form onSubmit={confirmAgreement} className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Valor Total Fechado (R$)</label>
                   <input 
                      type="number" 
                      required
                      step="0.01"
                      placeholder="Valor total a pagar"
                      value={agreementDetails.amount}
                      onChange={e => setAgreementDetails({...agreementDetails, amount: e.target.value})}
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white font-bold text-lg outline-none focus:ring-2 focus:ring-emerald-500"
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">1ª Parcela</label>
                        <input 
                            type="date" 
                            required
                            value={agreementDetails.date}
                            onChange={e => setAgreementDetails({...agreementDetails, date: e.target.value})}
                            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Nº Parcelas</label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="number" 
                                required
                                min="1"
                                max="60"
                                value={agreementDetails.installments}
                                onChange={e => setAgreementDetails({...agreementDetails, installments: parseInt(e.target.value)})}
                                className="w-full p-3 pl-9 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                   <button 
                      type="button" 
                      onClick={() => setAgreementModal({isOpen: false, debtId: ''})}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg font-medium"
                   >
                      Cancelar
                   </button>
                   <button 
                      type="submit" 
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/30"
                   >
                      Gerar Parcelas
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-600" />
            Gestão de Dívidas (Limpa Nome)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Controle suas pendências e foque no que realmente importa.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Registrar Dívida
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-rose-100 dark:border-rose-900/30 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total da Dívida (Banco)</p>
          <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatValue(totalDebt)}</h3>
          <p className="text-xs text-slate-400 mt-1">Valor cheio com juros</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Valor para Quitação (Alvo)</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatValue(totalTarget)}</h3>
          <p className="text-xs text-slate-400 mt-1">Soma das metas definidas</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-indigo-100 text-xs font-semibold uppercase">Economia Potencial</p>
          <h3 className="text-2xl font-bold">{formatValue(potentialSavings)}</h3>
          <p className="text-indigo-100 text-xs mt-1">Baseado nas suas metas</p>
        </div>
      </div>

      {/* Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-rose-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Registrar Nova Pendência</h3>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Instituição / Credor</label>
            <input
              required
              type="text"
              placeholder="Ex: Banco X, Loja Y"
              value={newDebt.creditor}
              onChange={e => setNewDebt({ ...newDebt, creditor: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
             <label className="text-xs font-semibold text-slate-500 mb-1 block">Valor Original (R$)</label>
             <input
                required
                type="number"
                value={newDebt.originalAmount}
                onChange={e => setNewDebt({ ...newDebt, originalAmount: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none"
             />
          </div>

          <div>
             <label className="text-xs font-semibold text-slate-500 mb-1 block">Valor Atual c/ Juros (R$)</label>
             <input
                required
                type="number"
                value={newDebt.currentAmount}
                onChange={e => setNewDebt({ ...newDebt, currentAmount: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none"
             />
          </div>
          
          <div>
             <label className="text-xs font-semibold text-slate-500 mb-1 block">Data Vencimento Original</label>
             <input
                required
                type="date"
                value={newDebt.dueDate}
                onChange={e => setNewDebt({ ...newDebt, dueDate: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none"
             />
             <p className="text-[10px] text-slate-400 mt-1">Importante para calcular a prescrição.</p>
          </div>

          <div>
             <label className="text-xs font-semibold text-slate-500 mb-1 block">Meta de Acordo (Opcional)</label>
             <input
                type="number"
                placeholder="Deixe em branco se não houver meta"
                value={newDebt.targetAmount}
                onChange={e => setNewDebt({ ...newDebt, targetAmount: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
             />
          </div>

          {/* New Platform Selection Field */}
          <div className="md:col-span-2">
             <label className="text-xs font-semibold text-slate-500 mb-1 block">Plataforma de Negociação</label>
             <select
                value={newDebt.platform}
                onChange={(e) => setNewDebt({ ...newDebt, platform: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none mb-2"
             >
                {NEGOTIATION_PLATFORMS.map(plat => (
                    <option key={plat} value={plat}>{plat}</option>
                ))}
             </select>
             
             {newDebt.platform === 'Outros' && (
                 <div className="animate-fade-in">
                     <input
                        type="text"
                        placeholder="Digite o nome da plataforma ou pessoa..."
                        value={newDebt.customPlatform}
                        onChange={(e) => setNewDebt({ ...newDebt, customPlatform: e.target.value })}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
                        autoFocus
                     />
                 </div>
             )}
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium"
            >
              Salvar Dívida
            </button>
          </div>
        </form>
      )}

      {/* Modern Filter Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 border border-slate-200 dark:border-slate-700">
          <button 
             onClick={() => setViewFilter('all')}
             className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
               ${viewFilter === 'all' 
                 ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' 
                 : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
          >
             <ListFilter className="w-4 h-4" />
             Todas
          </button>
          <button 
             onClick={() => setViewFilter('active')}
             className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
               ${viewFilter === 'active' 
                 ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                 : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
          >
             <AlertOctagon className="w-4 h-4" />
             Ativas
          </button>
          <button 
             onClick={() => setViewFilter('prescribed')}
             className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
               ${viewFilter === 'prescribed' 
                 ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm' 
                 : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
          >
             <Archive className="w-4 h-4" />
             Prescritas
          </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {debts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
             <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
             <p className="text-slate-800 dark:text-white font-medium">Nome Limpo!</p>
             <p className="text-slate-400 text-sm">Nenhuma dívida registrada.</p>
          </div>
        ) : filteredAndSortedDebts.length === 0 ? (
             <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <ListFilter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Nenhuma dívida encontrada neste filtro.</p>
             </div>
        ) : (
          filteredAndSortedDebts.map(debt => {
            const prescribed = isPrescribed(debt.dueDate);
            const isPaid = debt.status === 'paid';
            const isAgreement = debt.status === 'agreement';
            
            // Logic for right-side box content
            const hasTarget = debt.targetAmount && debt.targetAmount > 0;
            const hasAgreed = debt.agreedAmount && debt.agreedAmount > 0;
            
            // Calculate discount based on agreed amount (if exists) or target amount (if exists)
            const refAmount = hasAgreed ? debt.agreedAmount! : debt.targetAmount;
            const discount = hasTarget || hasAgreed ? ((debt.currentAmount - refAmount) / debt.currentAmount) * 100 : 0;

            return (
              <div 
                key={debt.id} 
                className={`p-6 rounded-xl border transition-all relative overflow-hidden group ${
                  isPaid
                    ? 'bg-slate-50 border-slate-200 opacity-75 grayscale-[0.8] dark:bg-slate-900 dark:border-slate-700' 
                    : isAgreement
                      ? 'bg-gradient-to-r from-emerald-50 to-white border-emerald-300 dark:from-emerald-900/10 dark:to-slate-800 dark:border-emerald-800 shadow-md ring-1 ring-emerald-500/20'
                      : prescribed 
                        ? 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                        : 'bg-white border-rose-100 dark:bg-slate-800 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-rose-300'
                }`}
              >
                {/* PAID STAMP */}
                {isPaid && (
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-80 rotate-[-15deg]">
                       <div className="border-4 border-slate-400 text-slate-400 text-6xl font-black px-4 py-1 rounded-lg uppercase tracking-widest flex items-center gap-2">
                           <CheckCheck className="w-12 h-12" /> RESOLVIDO
                       </div>
                   </div>
                )}

                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 relative z-0">
                  
                  {/* Left Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {isAgreement ? (
                         <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <Handshake className="w-3 h-3" /> ACORDO FECHADO
                         </span>
                      ) : debt.status === 'negotiating' ? (
                         <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <Handshake className="w-3 h-3" /> EM NEGOCIAÇÃO
                         </span>
                      ) : prescribed ? (
                         <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <Ban className="w-3 h-3" /> PRESCRITA
                         </span>
                      ) : isPaid ? (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                           <CheckCircle2 className="w-3 h-3" /> QUITADA
                        </span>
                      ) : (
                         <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ATIVA
                         </span>
                      )}
                      
                      {/* Platform Badge */}
                      {debt.platform && (
                          <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-indigo-100 dark:border-indigo-800">
                              <Globe className="w-3 h-3" /> {debt.platform}
                          </span>
                      )}

                      <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto md:ml-0">
                         <CalendarClock className="w-3 h-3" />
                         {new Date(debt.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{debt.creditor}</h3>
                    
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                       <div>
                          <p className="text-xs text-slate-500">Valor Original</p>
                          <p className="font-medium text-slate-700 dark:text-slate-300">{formatValue(debt.originalAmount)}</p>
                       </div>
                       <div className="flex items-center text-slate-400"><ArrowRight className="w-4 h-4"/></div>
                       <div className="group/value cursor-pointer" onClick={() => !isPaid && !isAgreement && openInterestModal(debt)} title="Clique para atualizar juros">
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                              Valor Atual
                              {!isPaid && !isAgreement && <TrendingUp className="w-3 h-3 text-rose-500 opacity-50 group-hover/value:opacity-100" />}
                          </p>
                          <p className={`font-bold transition-colors ${isPaid ? 'text-slate-500' : prescribed ? 'text-slate-600 dark:text-slate-400' : 'text-rose-600 group-hover/value:text-rose-700'}`}>
                             {formatValue(debt.currentAmount)}
                          </p>
                       </div>
                    </div>
                  </div>

                  {/* Negotiation Box */}
                  <div className={`p-3 rounded-lg border min-w-[200px] flex flex-col justify-center ${isAgreement ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}>
                      {isAgreement && hasAgreed ? (
                        <>
                           <p className="text-xs text-emerald-500 font-bold mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Valor Acordado
                           </p>
                           <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatValue(debt.agreedAmount!)}</p>
                           <p className="text-[10px] text-emerald-600/70 mt-1">Economia de {discount.toFixed(0)}%</p>
                        </>
                      ) : hasTarget ? (
                        <>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
                              <Target className="w-3 h-3 text-slate-400" /> Meta de Acordo
                           </p>
                           <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatValue(debt.targetAmount)}</p>
                           <p className="text-[10px] text-emerald-600/70 mt-1">Desconto Alvo: {discount.toFixed(0)}%</p>
                        </>
                      ) : (
                        <>
                           <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" /> Meta
                           </p>
                           <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic">Sem meta definida</p>
                        </>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                     <select
                        value={debt.status}
                        onChange={(e) => handleStatusChange(debt, e.target.value)}
                        className={`text-xs border rounded-lg p-1.5 outline-none font-medium cursor-pointer ${
                            isAgreement 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}
                     >
                        <option value="open">Em Aberto</option>
                        <option value="negotiating">Em Negociação</option>
                        <option value="agreement">Acordo Fechado</option>
                        <option value="paid">Quitado</option>
                     </select>
                     
                     <button 
                        onClick={() => onDelete(debt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors self-end"
                        title="Excluir Registro"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>

                {/* Status Message Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 text-xs flex items-start gap-2">
                    {isPaid ? (
                        <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Dívida liquidada com sucesso. Parabéns pela organização!
                        </p>
                    ) : isAgreement ? (
                         <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded w-full">
                            <p className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-semibold">
                                <Calendar className="w-4 h-4" /> Acordo Firmado: {formatValue(debt.agreedAmount || 0)}
                            </p>
                            <p className="text-emerald-600/80 dark:text-emerald-400/80 mt-1 pl-5">
                                Não esqueça de pagar na data combinada. {debt.agreedAmount && debt.agreedAmount > 0 ? "As parcelas já foram lançadas no seu fluxo." : ""}
                            </p>
                         </div>
                    ) : debt.status === 'negotiating' ? (
                        <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Handshake className="w-4 h-4" /> Você iniciou contatos. Mantenha a pressão para conseguir o melhor desconto.
                        </p>
                    ) : prescribed ? (
                        <p className="text-slate-500 flex items-center gap-1">
                           <Ban className="w-4 h-4" /> Dívida antiga (+5 anos). Não afeta score, negocie apenas se tiver sobra de caixa.
                        </p>
                    ) : (
                        <p className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                           <ShieldAlert className="w-4 h-4" /> Prioridade Alta! Esta dívida está ativa e impactando seu crédito. Tente negociar.
                        </p>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
