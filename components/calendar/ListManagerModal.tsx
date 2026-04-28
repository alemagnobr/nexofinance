import React from "react";
import { X, Layers, Plus, Edit2, Trash2 } from "lucide-react";

export const ListManagerModal = ({
  isOpen,
  onClose,
  taskLists,
  newListName,
  setNewListName,
  editingListId,
  setEditingListId,
  editingListName,
  setEditingListName,
  onAddTaskList,
  onUpdateTaskList,
  onDeleteTaskList,
  setTaskFormData,
  taskFormData,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            Gerenciar Listas
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da nova lista..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!newListName.trim() || !onAddTaskList) return;
                  const newListId = crypto.randomUUID();
                  await onAddTaskList({
                    id: newListId,
                    title: newListName.trim(),
                  });
                  setNewListName("");
                  setTaskFormData((prev: any) => ({
                    ...prev,
                    listId: newListId,
                  }));
                }
              }}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={async () => {
                if (!newListName.trim() || !onAddTaskList) return;
                const newListId = crypto.randomUUID();
                await onAddTaskList({
                  id: newListId,
                  title: newListName.trim(),
                });
                setNewListName("");
                setTaskFormData((prev: any) => ({
                  ...prev,
                  listId: newListId,
                }));
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {taskLists?.map((list: any) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              >
                {editingListId === list.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editingListName}
                    onChange={(e) => setEditingListName(e.target.value)}
                    onBlur={async () => {
                      if (
                        editingListName.trim() &&
                        editingListName !== list.title &&
                        onUpdateTaskList
                      ) {
                        await onUpdateTaskList(list.id, {
                          title: editingListName.trim(),
                        });
                      }
                      setEditingListId(null);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        if (
                          editingListName.trim() &&
                          editingListName !== list.title &&
                          onUpdateTaskList
                        ) {
                          await onUpdateTaskList(list.id, {
                            title: editingListName.trim(),
                          });
                        }
                        setEditingListId(null);
                      }
                    }}
                    className="flex-1 px-2 py-1 rounded border border-indigo-500 dark:bg-slate-700 dark:text-white outline-none"
                  />
                ) : (
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {list.title}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingListId(list.id);
                      setEditingListName(list.title);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Excluir esta lista apagará todas as tarefas nela. Continuar?",
                        )
                      ) {
                        if (onDeleteTaskList)
                          await onDeleteTaskList(list.id);
                        if (taskFormData.listId === list.id) {
                          setTaskFormData((prev: any) => ({
                            ...prev,
                            listId:
                              taskLists.find((l: any) => l.id !== list.id)?.id ||
                              "",
                          }));
                        }
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
