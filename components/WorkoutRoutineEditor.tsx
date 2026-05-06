import React, { useState } from 'react';
import { WorkoutRoutine, RoutineDay, RoutineExercise } from '../types';
import { ChevronLeft, Plus, Save, Trash2, GripVertical, Copy, AlertTriangle, Check, Info } from 'lucide-react';

interface WorkoutRoutineEditorProps {
  routine: WorkoutRoutine | null;
  projectId: string;
  onSave: (routine: any) => void;
  onCancel: () => void;
}

const TECHNIQUES = [
  { id: 'Drop Set', label: 'Drop', desc: 'Reduz a carga (20-30%) ao falhar e continua.' },
  { id: 'Rest-pause', label: 'Rest-pause', desc: 'Pausa de 10-15s após a falha para mais reps.' },
  { id: 'FST-7', label: 'FST-7', desc: 'Fascia Stretch Training, 7 séries curtas (30s sec).' },
  { id: 'Cluster', label: 'Cluster', desc: 'Séries divididas por micro-pausas (ex: 4+10s+4).' },
  { id: 'Bi-set', label: 'Bi-set', desc: 'Dois exercícios sem descanso.' },
  { id: 'Isometria', label: 'Iso', desc: 'Pausa estática (2-5s) no pico de contração.' }
];

export const WorkoutRoutineEditor: React.FC<WorkoutRoutineEditorProps> = ({ routine, projectId, onSave, onCancel }) => {
  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [days, setDays] = useState<RoutineDay[]>(
    routine?.days || [
      { id: Date.now().toString(), name: 'Treino A', exercises: [] }
    ]
  );
  const [draggedEx, setDraggedEx] = useState<{dayIndex: number, exIndex: number} | null>(null);

  const handleAddDay = () => {
    setDays([...days, { id: Date.now().toString(), name: `Treino ${String.fromCharCode(65 + days.length)}`, exercises: [] }]);
  };

  const handleAddExercise = (dayIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      exercises: [
        ...newDays[dayIndex].exercises,
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: '',
          sets: '3',
          reps: '10-12',
          rest: '60s',
        }
      ]
    };
    setDays(newDays);
  };

  const handleDuplicateExercise = (dayIndex: number, exIndex: number) => {
    const newDays = [...days];
    const exToCopy = newDays[dayIndex].exercises[exIndex];
    newDays[dayIndex].exercises.splice(exIndex + 1, 0, {
      ...exToCopy,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
    });
    setDays(newDays);
  };

  const handleUpdateExercise = (dayIndex: number, exIndex: number, field: keyof RoutineExercise, value: string) => {
    const newDays = [...days];
    const newExercises = [...newDays[dayIndex].exercises];
    newExercises[exIndex] = { ...newExercises[exIndex], [field]: value };
    newDays[dayIndex] = { ...newDays[dayIndex], exercises: newExercises };
    setDays(newDays);
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    const newDays = [...days];
    const newExercises = [...newDays[dayIndex].exercises];
    newExercises.splice(exIndex, 1);
    newDays[dayIndex] = { ...newDays[dayIndex], exercises: newExercises };
    setDays(newDays);
  };

  const toggleTechnique = (dayIndex: number, exIndex: number, techId: string) => {
    const current = days[dayIndex].exercises[exIndex].technique || '';
    const list = current ? current.split(',').map(s => s.trim()) : [];
    
    let newList;
    if (list.includes(techId)) {
      newList = list.filter(t => t !== techId);
    } else {
      newList = [...list, techId];
    }
    handleUpdateExercise(dayIndex, exIndex, 'technique', newList.join(', '));
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, dayIndex: number, exIndex: number) => {
    setDraggedEx({dayIndex, exIndex});
    // Create a smooth visual effect if possible
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDayIndex: number, targetExIndex: number) => {
    e.preventDefault();
    if (!draggedEx) return;
    if (draggedEx.dayIndex === targetDayIndex && draggedEx.exIndex === targetExIndex) {
      setDraggedEx(null);
      return;
    }

    const newDays = [...days];
    const movedEx = newDays[draggedEx.dayIndex].exercises.splice(draggedEx.exIndex, 1)[0];
    newDays[targetDayIndex].exercises.splice(targetExIndex, 0, movedEx);
    
    setDays(newDays);
    setDraggedEx(null);
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
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors">
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
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome da Ficha</label>
            <input 
              type="text" 
              placeholder="Ex: Treino Hipertrofia ABCD"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-indigo-500 font-semibold"
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
            <button onClick={handleAddDay} className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Adicionar Dia
            </button>
          </div>

          {days.map((day, dIndex) => {
            const totalSets = day.exercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0', 10) || 0), 0);
            const isHighVolume = totalSets > 24;

            return (
              <div key={day.id} className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4">
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
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {isHighVolume && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 p-3 rounded-xl flex items-start gap-3 items-center">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <p className="text-sm">
                        <strong className="font-bold">Aviso de Volume:</strong> Este treino possui {totalSets} séries. Mais de 24 séries num único treino pode prejudicar a recuperação muscular.
                      </p>
                    </div>
                  )}

                  {day.exercises.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      Nenhum exercício adicionado a este dia. Clique no botão abaixo para começar.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {day.exercises.map((ex, exIndex) => {
                        const isDragged = draggedEx?.dayIndex === dIndex && draggedEx?.exIndex === exIndex;
                        const currentTechs = ex.technique ? ex.technique.split(',').map(s => s.trim()) : [];
                        
                        return (
                          <div 
                            key={ex.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, dIndex, exIndex)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, dIndex, exIndex)}
                            className={`group relative flex gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border ${isDragged ? 'border-indigo-500 shadow-md opacity-50' : 'border-slate-200 dark:border-slate-700 shadow-sm'} transition-all hover:border-indigo-200 dark:hover:border-indigo-800`}
                          >
                            <div className="flex-none pt-2 text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 space-y-4">
                              {/* Linha principal: Nome e configs básicas */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-4">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Exercício</label>
                                  <input 
                                    type="text" placeholder="Ex: Supino Reto" 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-medium"
                                    value={ex.name} onChange={e => handleUpdateExercise(dIndex, exIndex, 'name', e.target.value)}
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Séries</label>
                                  <input 
                                    type="text" placeholder="3" 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-center font-medium"
                                    value={ex.sets} onChange={e => handleUpdateExercise(dIndex, exIndex, 'sets', e.target.value)}
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Reps</label>
                                  <input 
                                    type="text" placeholder="10-12" 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-center font-medium"
                                    value={ex.reps} onChange={e => handleUpdateExercise(dIndex, exIndex, 'reps', e.target.value)}
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descanso</label>
                                  <input 
                                    type="text" placeholder="60s" 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-center font-medium"
                                    value={ex.rest} onChange={e => handleUpdateExercise(dIndex, exIndex, 'rest', e.target.value)}
                                  />
                                </div>
                              </div>

                              {/* Coluna Inteligência / Progressão / Carga */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Carga Alvo (Ex: 20kg cada lado)</label>
                                  <input 
                                    type="text" placeholder="kg ou lbs" 
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 text-sm"
                                    value={ex.currentLoad || ''} onChange={e => handleUpdateExercise(dIndex, exIndex, 'currentLoad', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Meta / Progressão</label>
                                  <select
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 text-sm appearance-none"
                                    value={ex.progressionMethod || ''} 
                                    onChange={e => handleUpdateExercise(dIndex, exIndex, 'progressionMethod', e.target.value)}
                                  >
                                    <option value="">Selecione...</option>
                                    <option value="Progressão de Carga">Progressão de Carga (+1kg)</option>
                                    <option value="Progressão de Reps">Progressão Dupla (Reps)</option>
                                    <option value="Técnica e Cadência">Focar na Cadência (Pura Fase Excêntrica)</option>
                                    <option value="Manter">Manutenção (Manter Carga)</option>
                                  </select>
                                </div>
                              </div>

                              {/* Técnicas Avançadas */}
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Técnicas Avançadas</label>
                                <div className="flex flex-wrap gap-2">
                                  {TECHNIQUES.map(tech => {
                                    const isActive = currentTechs.includes(tech.id);
                                    return (
                                      <button
                                        key={tech.id}
                                        type="button"
                                        title={tech.desc}
                                        onClick={() => toggleTechnique(dIndex, exIndex, tech.id)}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                                          isActive 
                                            ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300 font-bold' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                      >
                                        {tech.label}
                                        {isActive && <Check className="w-3 h-3" />}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Ações (Aparecem no Hover em Desktop) */}
                            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 p-1 md:bg-transparent shadow-sm md:shadow-none rounded-lg border border-slate-100 md:border-none dark:border-slate-700">
                              <button 
                                onClick={() => handleDuplicateExercise(dIndex, exIndex)} 
                                title="Duplicar Exercício"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRemoveExercise(dIndex, exIndex)} 
                                title="Remover Exercício"
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {/* Drag target placeholder at the very end of list could be helpful, but optional */}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => handleAddExercise(dIndex)}
                    className="mt-4 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 px-4 py-2 rounded-xl flex items-center justify-center gap-2 w-full border border-dashed border-indigo-200 dark:border-indigo-800 transition-all hover:border-indigo-400"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Exercício
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};
