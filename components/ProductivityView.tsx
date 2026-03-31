import React from 'react';
import { View } from '../types';
import { KanbanBoard } from './KanbanBoard';
import { Notes } from './Notes';
import { HabitTracker } from './HabitTracker';
import { FinancialCalendar } from './FinancialCalendar';
import { Wallet, StickyNote, Calendar, Target } from 'lucide-react';

interface ProductivityViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
}

export const ProductivityView: React.FC<ProductivityViewProps> = ({ 
  currentView, onNavigate, data, actions, privacyMode 
}) => {
  const tabs = [
    { id: View.PRODUCTIVITY, label: 'Hábitos', icon: Target },
    { id: View.KANBAN, label: 'NEXO Flow', icon: Wallet },
    { id: View.NOTES, label: 'NEXO Notes', icon: StickyNote },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Produtividade</p>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {tabs.map(tab => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  relative flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl font-bold transition-all duration-200 border-2
                  ${isActive 
                    ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02]' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-xs md:text-sm text-center md:text-left">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
        {currentView === View.PRODUCTIVITY && (
          <HabitTracker 
             habits={data.habits || []}
             onAdd={actions.addHabit}
             onUpdate={actions.updateHabit}
             onDelete={actions.deleteHabit}
             onToggleDate={actions.toggleHabitDate}
             privacyMode={privacyMode}
          />
        )}
        {currentView === View.KANBAN && (
          <KanbanBoard 
             boards={data.kanbanBoards || []}
             onSaveBoard={actions.saveKanbanBoard}
             onDeleteBoard={actions.deleteKanbanBoard}
             onAddTransaction={(t) => {
                 actions.addTransaction(t);
                 alert('Transação criada a partir do card!');
                 onNavigate(View.TRANSACTIONS);
             }}
             privacyMode={privacyMode}
          />
        )}
        {currentView === View.NOTES && (
          <Notes 
             notes={data.notes || []}
             onAdd={actions.addNote}
             onUpdate={actions.updateNote}
             onDelete={actions.deleteNote}
             privacyMode={privacyMode}
          />
        )}
      </div>
    </div>
  );
};
