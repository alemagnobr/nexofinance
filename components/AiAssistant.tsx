
import React, { useState, useRef, useEffect } from 'react';
import { AppData, ChatMessage } from '../types';
import { Send, Mic, Sparkles, Bot, User, StopCircle } from 'lucide-react';
import { chatWithAdvisorStream } from '../services/geminiService';

interface AiAssistantProps {
  data: AppData;
  privacyMode: boolean;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ data, privacyMode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech error', event);
            setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    } else {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        } else {
            alert('Seu navegador não suporta reconhecimento de voz.');
        }
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // 2. Prepare AI Message Placeholder
    const aiMsgId = crypto.randomUUID();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '', // Start empty
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMsg]);

    try {
        // 3. Stream Response
        const stream = chatWithAdvisorStream(textToSend, messages, data);
        
        let fullContent = '';
        for await (const chunk of stream) {
            fullContent += chunk;
            setMessages(prev => prev.map(m => 
                m.id === aiMsgId ? { ...m, content: fullContent } : m
            ));
        }
    } catch (e) {
        setMessages(prev => prev.map(m => 
            m.id === aiMsgId ? { ...m, content: "Desculpe, tive um erro ao processar sua resposta." } : m
        ));
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20">
             <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Assistente Inteligente</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Pergunte sobre seus gastos, investimentos ou peça conselhos.</p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
           
           {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-60">
                <Bot className="w-16 h-16" />
                <p className="text-sm">Estou analisando seus dados em tempo real.<br/>Como posso ajudar hoje?</p>
             </div>
           )}

           {messages.map((msg) => (
             <div 
               key={msg.id} 
               className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
             >
               <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-600'}`}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-line leading-relaxed
                      ${msg.role === 'user' 
                        ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tr-none' 
                        : 'bg-indigo-600 text-white rounded-tl-none prose prose-invert max-w-none'
                      }`}
                  >
                      {msg.content}
                      {isLoading && msg.content === '' && (
                         <span className="inline-flex gap-1">
                            <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></span>
                         </span>
                      )}
                  </div>
               </div>
             </div>
           ))}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
           <div className="relative flex items-center gap-2">
              <button 
                 onClick={toggleListening}
                 className={`p-3 rounded-xl transition-all ${
                    isListening 
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                 }`}
                 title="Falar comando"
              >
                 {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder={isListening ? "Ouvindo..." : "Digite uma mensagem..."}
                 className="flex-1 bg-slate-100 dark:bg-slate-700 dark:text-white border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                 disabled={isLoading}
              />
              
              <button 
                 onClick={() => handleSend()}
                 disabled={!input.trim() || isLoading}
                 className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
              >
                 <Send className="w-5 h-5" />
              </button>
           </div>
           <p className="text-center text-[10px] text-slate-400 mt-2">
              A IA pode cometer erros. Verifique informações importantes.
           </p>
        </div>
      </div>
    </div>
  );
};
