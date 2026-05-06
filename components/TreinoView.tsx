import React, { useState } from 'react';
import { Dumbbell, Plus, LayoutList, Calendar, Target, Activity, Settings, AlignLeft, Edit2, Trash2 } from 'lucide-react';
import { WorkoutProject } from '../types';
import { WorkoutProjectDetails } from './WorkoutProjectDetails';

interface TreinoViewProps {
  data: any;
  actions: any;
}

export const TreinoView: React.FC<TreinoViewProps> = ({ data, actions }) => {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<WorkoutProject | null>(null);
  const [selectedProject, setSelectedProject] = useState<WorkoutProject | null>(null);

  
  const [projectForm, setProjectForm] = useState({
    name: '',
    objective: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'Planejado' as WorkoutProject['status'],
    priority: 'Média' as WorkoutProject['priority']
  });

  const projects = data.workoutProjects || [];

  const handleOpenProjectModal = (project?: WorkoutProject) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({
        name: project.name,
        objective: project.objective,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate || '',
        status: project.status,
        priority: project.priority
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        name: '',
        objective: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'Planejado',
        priority: 'Média'
      });
    }
    setIsProjectModalOpen(true);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      actions.updateWorkoutProject?.(editingProject.id, projectForm);
    } else {
      actions.addWorkoutProject?.(projectForm);
    }
    setIsProjectModalOpen(false);
  };

  const statusColors = {
    'Planejado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    'Em andamento': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
    'Pausado': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    'Finalizado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  };

  const priorityColors = {
    'Alta': 'text-rose-500',
    'Média': 'text-amber-500',
    'Baixa': 'text-emerald-500',
  };

  if (selectedProject) {
    return (
      <div className="p-4 md:p-8">
        <WorkoutProjectDetails 
          project={selectedProject} 
          onBack={() => setSelectedProject(null)} 
          data={data} 
          actions={actions} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in relative pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-1">
            <LayoutList className="w-6 h-6 text-orange-500" />
            Central de Evolução Física
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Gerencie seus macro-projetos (Bulk, Cut, etc) e acompanhe o progresso geral.
          </p>
        </div>
        <button
          onClick={() => handleOpenProjectModal()}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30"
        >
          <Plus className="w-5 h-5" />
          Novo Projeto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
            <LayoutList className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Nenhum projeto de evolução física criado</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
            Comece criando o seu projeto principal, como "Bulk Base", "Cut Pré-Verão" ou "Recomposição Corporal".
          </p>
          <button
            onClick={() => handleOpenProjectModal()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj: WorkoutProject) => (
            <div 
              key={proj.id} 
              onClick={() => setSelectedProject(proj)}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative group flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenProjectModal(proj); }}
                  className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-700/50 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Deseja mesmo excluir este projeto? O histórico detalhado será perdido.")) {
                      actions.deleteWorkoutProject?.(proj.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-700/50 dark:hover:bg-rose-900/50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColors[proj.status]}`}>
                  {proj.status}
                </span>
                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${priorityColors[proj.priority]}`}>
                  <Activity className="w-3 h-3" /> {proj.priority} (Prio)
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 pr-14 leading-tight">{proj.name}</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-4 flex items-start gap-1.5">
                <Target className="w-4 h-4 shrink-0 mt-0.5" />
                {proj.objective}
              </p>

              {proj.description && (
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 flex-1 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 line-clamp-3">
                  {proj.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Início</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {new Date(proj.startDate + "T12:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {proj.endDate && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fim Previsto</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {new Date(proj.endDate + "T12:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PROJETO DE TREINO */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                {editingProject ? 'Editar Projeto' : 'Novo Projeto de Evolução'}
              </h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome da central / Projeto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bulk Base 2026, Cut Pré-Verão..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
                  value={projectForm.name}
                  onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Objetivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ganho de massa com mínimo acúmulo de gordura"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
                  value={projectForm.objective}
                  onChange={e => setProjectForm({...projectForm, objective: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Fase focada em progressão de carga, alto volume controlado e dieta em superávit"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  value={projectForm.description}
                  onChange={e => setProjectForm({...projectForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Data Inicial *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
                    value={projectForm.startDate}
                    onChange={e => setProjectForm({...projectForm, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Data Final Prevista</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
                    value={projectForm.endDate}
                    onChange={e => setProjectForm({...projectForm, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
                    value={projectForm.status}
                    onChange={e => setProjectForm({...projectForm, status: e.target.value as any})}
                  >
                    <option value="Planejado">Planejado</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Prioridade</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
                    value={projectForm.priority}
                    onChange={e => setProjectForm({...projectForm, priority: e.target.value as any})}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  <Target className="w-5 h-5" />
                  {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

