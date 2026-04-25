import React, { useState, useRef, useEffect } from "react";
import { DailyRoutine } from "../types";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  RotateCw,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Edit2,
  X,
  Check,
} from "lucide-react";

interface DailyRoutinesProps {
  routines: DailyRoutine[];
  onAddRoutine: (title: string, time?: string) => void;
  onToggleRoutine: (id: string, dateStr: string) => void;
  onDeleteRoutine: (id: string) => void;
  onUpdateOrder: (id: string, newOrder: number) => void;
  onUpdateRoutine?: (id: string, newTitle: string, newTime?: string) => void;
  compact?: boolean;
  onNavigate?: () => void;
}

export const DailyRoutines: React.FC<DailyRoutinesProps> = ({
  routines,
  onAddRoutine,
  onToggleRoutine,
  onDeleteRoutine,
  onUpdateOrder,
  onUpdateRoutine,
  compact = false,
  onNavigate,
}) => {
  const [newRoutine, setNewRoutine] = useState("");
  const [newRoutineTime, setNewRoutineTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTime, setEditTime] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Format current date as YYYY-MM-DD
  const today = new Date().toLocaleDateString("en-CA"); // 'en-CA' gives YYYY-MM-DD

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const getIsCompleted = (routine: DailyRoutine) => {
    return routine.lastCompletedDate === today;
  };

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    if (editingId === id) return;
    onToggleRoutine(id, currentlyCompleted ? "" : today);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoutine.trim()) {
      onAddRoutine(newRoutine.trim(), newRoutineTime);
      setNewRoutine("");
      setNewRoutineTime("");
    }
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim() && onUpdateRoutine) {
      onUpdateRoutine(editingId, editTitle.trim(), editTime);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Stats
  const completedCount = routines.filter(getIsCompleted).length;
  const progress =
    routines.length === 0 ? 0 : (completedCount / routines.length) * 100;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <RotateCw className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Rotinas Diárias
            </h3>
            {!compact && (
              <p className="text-xs text-slate-500">
                Checklists que resetam à meia-noite.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
            {completedCount}/{routines.length}
          </div>
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-1 rounded transition-colors"
              title="Abrir Rotinas na Agenda"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {routines.length > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-[100px] mb-4 space-y-2">
        {routines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
            <Circle className="w-6 h-6 shrink-0 mb-2 opacity-30" />
            <p className="text-xs text-center italic px-4">
              Você ainda não possui rotinas. Adicione alguma ex: "Ler 10
              páginas".
            </p>
          </div>
        ) : (
          [...routines]
            .map((r, index) => ({ ...r, originalIndex: index }))
            .sort((a, b) => {
              const orderA = a.order !== undefined ? a.order : a.originalIndex;
              const orderB = b.order !== undefined ? b.order : b.originalIndex;
              return orderA - orderB;
            })
            .map((routine, index, arr) => {
              const completed = getIsCompleted(routine);
              const isFirst = index === 0;
              const isLast = index === arr.length - 1;

              return (
                <div
                  key={routine.id}
                  className="group flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                >
                  <button
                    onClick={() => handleToggle(routine.id, completed)}
                    className={`shrink-0 transition-colors ${completed ? "text-emerald-500" : "text-slate-300 hover:text-emerald-400"}`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {editingId === routine.id ? (
                    <div className="flex-1 flex flex-col gap-1 md:flex-row md:items-center">
                      <input
                        ref={editInputRef}
                        type="text"
                        className="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 outline-none focus:border-emerald-500 text-slate-800 dark:text-white min-w-0"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        placeholder="Título"
                      />
                      <input
                        type="time"
                        className="w-24 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between min-w-0 pr-2">
                      <span
                        className={`text-sm transition-all truncate ${completed ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}
                      >
                        {routine.title}
                      </span>
                      {routine.time && (
                        <span
                          className={`text-xs font-mono px-1.5 py-0.5 rounded ${completed ? "bg-slate-100 text-slate-400 dark:bg-slate-800/50" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"}`}
                        >
                          {routine.time}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={`flex items-center transition-opacity gap-1 ${editingId === routine.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    {editingId === routine.id ? (
                      <>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            saveEdit();
                          }}
                          className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                          title="Salvar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            cancelEdit();
                          }}
                          className="p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 rounded"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(routine.id);
                            setEditTitle(routine.title);
                            setEditTime(routine.time || "");
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-600"
                          title="Editar rotina"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isFirst && (
                          <button
                            onClick={() => {
                              const prevRoutine = arr[index - 1];
                              const myOrder =
                                routine.order !== undefined
                                  ? routine.order
                                  : routine.originalIndex;
                              const prevOrder =
                                prevRoutine.order !== undefined
                                  ? prevRoutine.order
                                  : prevRoutine.originalIndex;
                              onUpdateOrder(routine.id, prevOrder);
                              onUpdateOrder(prevRoutine.id, myOrder);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-600"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isLast && (
                          <button
                            onClick={() => {
                              const nextRoutine = arr[index + 1];
                              const myOrder =
                                routine.order !== undefined
                                  ? routine.order
                                  : routine.originalIndex;
                              const nextOrder =
                                nextRoutine.order !== undefined
                                  ? nextRoutine.order
                                  : nextRoutine.originalIndex;
                              onUpdateOrder(routine.id, nextOrder);
                              onUpdateOrder(nextRoutine.id, myOrder);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-600"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteRoutine(routine.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-600"
                          title="Excluir rotina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-auto relative flex gap-2">
        <input
          type="text"
          value={newRoutine}
          onChange={(e) => setNewRoutine(e.target.value)}
          placeholder="Nova rotina..."
          className="flex-1 text-sm pl-4 pr-2 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900 dark:focus:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
        />
        <div className="relative w-28">
          <input
            type="time"
            value={newRoutineTime}
            onChange={(e) => setNewRoutineTime(e.target.value)}
            className="w-full h-full text-sm px-2 bg-slate-50 hover:bg-slate-100 focus:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900 dark:focus:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!newRoutine.trim()}
          className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-50 disabled:hover:bg-emerald-100 transition-colors rounded-lg flex items-center justify-center shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
