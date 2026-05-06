import React, { useState } from 'react';
import { WorkoutRoutine, RoutineDay, RoutineExercise } from '../types';
import { ChevronLeft, Plus, Save, Trash2, GripVertical } from 'lucide-react';

interface WorkoutRoutineEditorProps {
  routine: WorkoutRoutine | null;
  projectId: string;
  onSave: (routine: any) => void;
  onCancel: () => void;
}

export const WorkoutRoutineEditor: React.FC<WorkoutRoutineEditorProps> = ({ routine, projectId, onSave, onCancel }) => {
  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [days, setDays] = useState<RoutineDay[]>(
    routine?.days || [
      { id: Date.now().toString(), name: 'Treino A', exercises: [] }
    ]
  );

  const handleAddDay = () => {
    setDays([...days, { id: Date.now().toString(), name: `Treino ${String.fromCharCode(65 + days.length)}`, exercises: [] }]);
  };

  const handleAddExercise = (dayIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].exercises.push({
      id: Date.now().toString(),
      name: '',
      sets: '3',
      reps: '10-12',
      rest: '60s',
    });
    setDays(newDays);
  };

  const handleUpdateExercise = (dayIndex: number, exIndex: number, field: keyof RoutineExercise, value: string) => {
    const newDays = [...days];
    newDays[dayIndex].exercises[exIndex] = { ...newDays[dayIndex].exercises[exIndex], [field]: value };
    setDays(newDays);
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].exercises.splice(exIndex, 1);
    setDays(newDays);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Insira o nome da ficha (ex: Ficha ABC)");
    
    const submitData = {
      projectId,
      name,
      description,
      days,
    };
    onSave(submitData);
  };

  return (
    <div className="bg-white dark:bg-slate-900 absolute inset-0 z-10 p-4 md:p-8 flex flex-col h-full overflow-y-auto animate-fade-in custom-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          {routine ? 'Editar Ficha' : 'Nova Ficha de Treino'}
        </h3>
        <button onClick={handleSubmit} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
          <Save className="w-4 h-4" /> Salvar Ficha
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-6 pb-20">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome da Ficha</label>
            <input 
              type="text" 
              placeholder="Ex: Treino Hipertrofia ABCD"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-indigo-500"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição (opcional)</label>
            <input 
              type="text" 
              placeholder="Detalhes ou foco desta ficha..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-indigo-500"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-lg text-slate-800 dark:text-white">Dias / Divisão do Treino</h4>
            <button onClick={handleAddDay} className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              <Plus className="w-4 h-4" /> Adicionar Dia
            </button>
          </div>

          {days.map((day, dIndex) => (
            <div key={day.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4">
                <input 
                  type="text" 
                  placeholder="Nome do Dia (Ex: Treino A - Costas/Bíceps)"
                  className="bg-transparent font-bold text-lg text-slate-800 dark:text-white outline-none w-full"
                  value={day.name}
                  onChange={(e) => {
                    const newDays = [...days];
                    newDays[dIndex].name = e.target.value;
                    setDays(newDays);
                  }}
                />
                <button 
                  onClick={() => {
                    if(confirm("Excluir este dia inteiro?")) {
                      const newDays = [...days];
                      newDays.splice(dIndex, 1);
                      setDays(newDays);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {day.exercises.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum exercício adicionado a este dia.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-100 dark:border-slate-700">
                          <th className="font-medium pb-2 w-8"></th>
                          <th className="font-medium pb-2 min-w-[200px]">Exercício</th>
                          <th className="font-medium pb-2 w-20">Séries</th>
                          <th className="font-medium pb-2 w-24">Reps</th>
                          <th className="font-medium pb-2 w-24">Descanso</th>
                          <th className="font-medium pb-2">Técnica (opc)</th>
                          <th className="font-medium pb-2 w-10 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {day.exercises.map((ex, exIndex) => (
                          <tr key={ex.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="py-2 text-slate-300">
                              <GripVertical className="w-4 h-4 cursor-grab" />
                            </td>
                            <td className="py-2 pr-2">
                              <input 
                                type="text" placeholder="Ex: Supino Reto" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 outline-none"
                                value={ex.name} onChange={e => handleUpdateExercise(dIndex, exIndex, 'name', e.target.value)}
                              />
                            </td>
                            <td className="py-2 pr-2">
                               <input 
                                type="text" placeholder="3" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 outline-none text-center"
                                value={ex.sets} onChange={e => handleUpdateExercise(dIndex, exIndex, 'sets', e.target.value)}
                              />
                            </td>
                            <td className="py-2 pr-2">
                               <input 
                                type="text" placeholder="10-12" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 outline-none text-center"
                                value={ex.reps} onChange={e => handleUpdateExercise(dIndex, exIndex, 'reps', e.target.value)}
                              />
                            </td>
                            <td className="py-2 pr-2">
                                <input 
                                type="text" placeholder="60s" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 outline-none text-center"
                                value={ex.rest} onChange={e => handleUpdateExercise(dIndex, exIndex, 'rest', e.target.value)}
                              />
                            </td>
                            <td className="py-2 pr-2">
                               <input 
                                type="text" placeholder="Drop, Rest-pause..." 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 outline-none"
                                value={ex.technique || ''} onChange={e => handleUpdateExercise(dIndex, exIndex, 'technique', e.target.value)}
                              />
                            </td>
                            <td className="py-2 text-center">
                              <button onClick={() => handleRemoveExercise(dIndex, exIndex)} className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <button 
                  onClick={() => handleAddExercise(dIndex)}
                  className="mt-2 text-xs font-bold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Adicionar Exercício
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
