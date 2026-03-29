import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, Sparkles } from 'lucide-react';
import { parseAgendaInput } from '../services/geminiService';

interface AIAgendaAssistantProps {
  onAddEvent: (event: any) => void;
  onAddTask: (task: any) => void;
}

export const AIAgendaAssistant: React.FC<AIAgendaAssistantProps> = ({ onAddEvent, onAddTask }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
        // Automatically process after voice input
        processInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setError('Permissão de microfone negada. Por favor, permita o acesso ao microfone no seu navegador.');
        } else {
          setError(`Erro ao reconhecer voz (${event.error}). Tente digitar.`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setError(null);
      setSuccess(null);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        setError('Microfone não disponível ou bloqueado.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      processInput(input);
    }
  };

  const processInput = async (text: string) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const parsed = await parseAgendaInput(text, new Date());
      
      if (!parsed) {
        setError('Não entendi o comando. Tente ser mais específico com a data e hora.');
        setIsProcessing(false);
        return;
      }

      if (parsed.type === 'event') {
        const startDate = new Date(parsed.startDate);
        const endDate = parsed.endDate ? new Date(parsed.endDate) : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
        
        onAddEvent({
          title: parsed.title,
          description: parsed.description || '',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          allDay: parsed.allDay || false,
          color: '#3b82f6' // Default blue
        });
        setSuccess(`Evento "${parsed.title}" criado!`);
      } else {
        const dueDate = new Date(parsed.startDate);
        onAddTask({
          title: parsed.title,
          description: parsed.description || '',
          dueDate: dueDate.toISOString(),
          completed: false,
          priority: 'medium'
        });
        setSuccess(`Tarefa "${parsed.title}" criada!`);
      }
      
      setInput('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError('Erro ao processar com a IA. Verifique sua chave API.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Assistente IA</h3>
        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">Beta</span>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Reunião com João amanhã às 15h..."
            className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isProcessing || isRecording}
          />
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
              isRecording 
                ? 'text-red-500 bg-red-50 dark:bg-red-500/10 animate-pulse' 
                : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
            }`}
            title={isRecording ? "Parar gravação" : "Falar comando"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
        
        <button
          type="submit"
          disabled={!input.trim() || isProcessing || isRecording}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>

      {error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
          <Sparkles className="w-4 h-4" /> {success}
        </div>
      )}
    </div>
  );
};
