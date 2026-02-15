
import React, { useState } from 'react';
import { Note } from '../types';
import { Plus, Search, StickyNote, Trash2, Edit2, Pin, Calendar, X, PinOff, Check } from 'lucide-react';

interface NotesProps {
  notes: Note[];
  onAdd: (note: Omit<Note, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  privacyMode: boolean;
}

const COLORS = [
    { value: 'yellow', bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-200 dark:border-amber-800' },
    { value: 'slate', bg: 'bg-white dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
    { value: 'green', bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-200 dark:border-emerald-800' },
    { value: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-200 dark:border-blue-800' },
    { value: 'rose', bg: 'bg-rose-100 dark:bg-rose-900/40', border: 'border-rose-200 dark:border-rose-800' },
    { value: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-200 dark:border-purple-800' },
];

export const Notes: React.FC<NotesProps> = ({ notes, onAdd, onUpdate, onDelete, privacyMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
      title: '',
      content: '',
      color: 'slate' as Note['color'],
      isPinned: false
  });

  const filteredNotes = notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
      // Sort by Pinned then Date Descending
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleOpenModal = (note?: Note) => {
      if (note) {
          setEditingId(note.id);
          setFormData({
              title: note.title,
              content: note.content,
              color: note.color,
              isPinned: note.isPinned
          });
      } else {
          setEditingId(null);
          setFormData({
              title: '',
              content: '',
              color: 'slate',
              isPinned: false
          });
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title.trim() && !formData.content.trim()) return;

      if (editingId) {
          onUpdate(editingId, {
              title: formData.title,
              content: formData.content,
              color: formData.color,
              isPinned: formData.isPinned
          });
      } else {
          onAdd({
              title: formData.title,
              content: formData.content,
              color: formData.color,
              isPinned: formData.isPinned,
              date: new Date().toISOString()
          });
      }
      setIsModalOpen(false);
  };

  const togglePin = (e: React.MouseEvent, note: Note) => {
      e.stopPropagation();
      onUpdate(note.id, { isPinned: !note.isPinned });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <StickyNote className="w-7 h-7 text-indigo-600" />
                  NEXO Notes
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Registre ideias, lembretes e tarefas rapidamente.</p>
          </div>

          <div className="flex w-full md:w-auto gap-3 items-center">
              <div className="flex-1 relative group md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                      type="text"
                      placeholder="Buscar notas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-sm"
                  />
              </div>
              <button 
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 font-bold text-sm"
              >
                  <Plus className="w-4 h-4" /> Nova Nota
              </button>
          </div>
      </div>

      {/* Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {filteredNotes.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
                      <StickyNote className="w-8 h-8 opacity-50" />
                  </div>
                  <p>Nenhuma nota encontrada.</p>
              </div>
          ) : (
              filteredNotes.map(note => {
                  const theme = COLORS.find(c => c.value === note.color) || COLORS[1];
                  return (
                      <div 
                          key={note.id} 
                          onClick={() => handleOpenModal(note)}
                          className={`break-inside-avoid rounded-xl p-5 shadow-sm border transition-all hover:shadow-md cursor-pointer group relative ${theme.bg} ${theme.border}`}
                      >
                          {/* Pin Icon */}
                          <button 
                              onClick={(e) => togglePin(e, note)}
                              className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors z-10 ${note.isPinned ? 'bg-slate-900/10 dark:bg-white/10 text-indigo-600 dark:text-indigo-400' : 'opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 text-slate-400'}`}
                          >
                              {note.isPinned ? <Pin className="w-3 h-3 fill-current" /> : <Pin className="w-3 h-3" />}
                          </button>

                          {note.title && <h3 className="font-bold text-slate-800 dark:text-white mb-2 pr-6">{note.title}</h3>}
                          
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {note.content}
                          </p>
                          
                          <div className="mt-4 flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(note.date).toLocaleDateString('pt-BR')}
                              </span>
                              <button 
                                  onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                                  className="p-1 hover:text-rose-500 transition-colors"
                              >
                                  <Trash2 className="w-3.5 h-3.5" />
                              </button>
                          </div>
                      </div>
                  );
              })
          )}
      </div>

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border transition-colors ${
                  COLORS.find(c => c.value === formData.color)?.bg || 'bg-white dark:bg-slate-800'
              } ${COLORS.find(c => c.value === formData.color)?.border || 'border-slate-200'}`}>
                  
                  <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
                      <div className="p-2 flex justify-between items-center">
                          <div className="flex gap-1">
                              {COLORS.map(c => (
                                  <button
                                      key={c.value}
                                      type="button"
                                      onClick={() => setFormData({...formData, color: c.value as any})}
                                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${c.value === formData.color ? 'border-indigo-500 scale-110' : 'border-transparent'} ${c.bg.split(' ')[0] === 'bg-white' ? 'bg-slate-200' : c.bg.split(' ')[0]}`} // Simple color logic for bubbles
                                  />
                              ))}
                          </div>
                          <div className="flex items-center gap-1">
                              <button 
                                  type="button"
                                  onClick={() => setFormData({...formData, isPinned: !formData.isPinned})}
                                  className={`p-2 rounded-full transition-colors ${formData.isPinned ? 'text-indigo-600 bg-indigo-500/10' : 'text-slate-400 hover:bg-black/5'}`}
                                  title="Fixar nota"
                              >
                                  {formData.isPinned ? <Pin className="w-5 h-5 fill-current" /> : <PinOff className="w-5 h-5" />}
                              </button>
                              <button 
                                  type="button" 
                                  onClick={() => setIsModalOpen(false)}
                                  className="p-2 text-slate-500 hover:bg-black/5 rounded-full"
                              >
                                  <X className="w-5 h-5" />
                              </button>
                          </div>
                      </div>

                      <div className="px-6 pb-2">
                          <input 
                              type="text" 
                              placeholder="Título"
                              value={formData.title}
                              onChange={(e) => setFormData({...formData, title: e.target.value})}
                              className="w-full text-xl font-bold bg-transparent border-none outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-white"
                          />
                      </div>
                      
                      <div className="px-6 pb-6 flex-1 overflow-y-auto">
                          <textarea 
                              placeholder="Digite sua nota aqui..."
                              value={formData.content}
                              onChange={(e) => setFormData({...formData, content: e.target.value})}
                              className="w-full h-64 bg-transparent border-none outline-none resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                      </div>

                      <div className="p-4 flex justify-end border-t border-black/5 dark:border-white/5">
                          <button 
                              type="submit"
                              className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity"
                          >
                              Salvar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};