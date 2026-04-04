import React, { useState } from 'react';
import { Task, TaskList } from '../types';
import { Plus, Trash2, CheckCircle, Circle, AlertCircle, Clock, CheckSquare, XCircle, Grid } from 'lucide-react';

interface EisenhowerMatrixProps {
  tasks: Task[];
  taskLists: TaskList[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddTaskList?: (list: Omit<TaskList, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  taskLists,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddTaskList
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<{urgent: boolean, important: boolean} | null>(null);

  const handleAddTask = (urgent: boolean, important: boolean) => {
    if (!newTaskTitle.trim()) return;

    let defaultListId = taskLists.length > 0 ? taskLists[0].id : 'default';
    
    if (taskLists.length === 0 && onAddTaskList) {
      onAddTaskList({ id: 'default', title: 'Tarefas Gerais' });
    }

    onAddTask({
      title: newTaskTitle.trim(),
      listId: defaultListId,
      completed: false,
      urgent,
      important
    });
    setNewTaskTitle('');
    setSelectedQuadrant(null);
  };

  const renderQuadrant = (
    title: string, 
    description: string, 
    urgent: boolean, 
    important: boolean, 
    colorClass: string, 
    bgClass: string,
    icon: React.ReactNode
  ) => {
    const quadrantTasks = tasks.filter(t => !t.completed && !!t.urgent === urgent && !!t.important === important);

    return (
      <div className={`flex flex-col h-full rounded-2xl border-2 ${colorClass} ${bgClass} overflow-hidden`}>
        <div className={`p-3 border-b-2 ${colorClass} flex items-center justify-between bg-white/50 dark:bg-slate-900/50`}>
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h3 className="font-bold text-sm">{title}</h3>
              <p className="text-[10px] opacity-80">{description}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/50 dark:bg-slate-800/50">
            {quadrantTasks.length}
          </span>
        </div>
        
        <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-[150px]">
          {quadrantTasks.map(task => (
            <div key={task.id} className="flex items-start gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 group">
              <button 
                onClick={() => onUpdateTask(task.id, { completed: !task.completed })}
                className="mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors"
              >
                <Circle className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-200 break-words leading-tight">{task.title}</p>
              </div>
              <button 
                onClick={() => onDeleteTask(task.id)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {selectedQuadrant?.urgent === urgent && selectedQuadrant?.important === important ? (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask(urgent, important);
                  if (e.key === 'Escape') {
                    setSelectedQuadrant(null);
                    setNewTaskTitle('');
                  }
                }}
                placeholder="Nova tarefa..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 text-slate-700 dark:text-slate-200"
                autoFocus
                onBlur={() => {
                  if (!newTaskTitle.trim()) {
                    setSelectedQuadrant(null);
                  }
                }}
              />
            </div>
          ) : (
            <button 
              onClick={() => setSelectedQuadrant({ urgent, important })}
              className="w-full py-2 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors dashed border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
            >
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-500" />
            Matriz de Eisenhower
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Priorize suas tarefas baseando-se em urgência e importância.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
        {/* Quadrant 1: Fazer Agora (Urgent & Important) */}
        {renderQuadrant(
          "Fazer Agora",
          "Urgente e Importante",
          true,
          true,
          "border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400",
          "bg-rose-50/50 dark:bg-rose-900/10",
          <AlertCircle className="w-4 h-4" />
        )}

        {/* Quadrant 2: Agendar (Important, Not Urgent) */}
        {renderQuadrant(
          "Agendar",
          "Importante, Não Urgente",
          false,
          true,
          "border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400",
          "bg-indigo-50/50 dark:bg-indigo-900/10",
          <Clock className="w-4 h-4" />
        )}

        {/* Quadrant 3: Delegar (Urgent, Not Important) */}
        {renderQuadrant(
          "Delegar",
          "Urgente, Não Importante",
          true,
          false,
          "border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400",
          "bg-amber-50/50 dark:bg-amber-900/10",
          <CheckSquare className="w-4 h-4" />
        )}

        {/* Quadrant 4: Eliminar (Not Urgent, Not Important) */}
        {renderQuadrant(
          "Eliminar",
          "Nem Urgente, Nem Importante",
          false,
          false,
          "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400",
          "bg-slate-50/50 dark:bg-slate-800/30",
          <XCircle className="w-4 h-4" />
        )}
      </div>
    </div>
  );
};
