
import React from 'react';
import { X, Key, Sparkles, ExternalLink, ChevronRight, Lock, Bot, ShieldCheck, Target, Gift, Copy, Github, Linkedin } from 'lucide-react';

interface AppModalsProps {
  showWelcome: boolean;
  isDonateModalOpen: boolean;
  isKeyModalOpen: boolean;
  userKeyInput: string;
  hasKey: boolean;
  PIX_KEY: string;
  PIX_NAME: string;
  
  setShowWelcome: (show: boolean) => void;
  setIsDonateModalOpen: (open: boolean) => void;
  setIsKeyModalOpen: (open: boolean) => void;
  setUserKeyInput: (key: string) => void;
  handleSaveKey: () => void;
  handleRemoveKey: () => void;
  handleFinishWelcome: () => void;
  copyPix: () => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  showWelcome, isDonateModalOpen, isKeyModalOpen,
  userKeyInput, hasKey, PIX_KEY, PIX_NAME,
  setShowWelcome, setIsDonateModalOpen, setIsKeyModalOpen,
  setUserKeyInput, handleSaveKey, handleRemoveKey, handleFinishWelcome, copyPix
}) => {
  return (
    <>
      {/* WELCOME MODAL */}
      {showWelcome && (
          <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 animate-scale-in my-8">
                 <div className="bg-slate-900 p-8 text-white relative overflow-hidden rounded-t-2xl">
                     <div className="relative z-10">
                        <h1 className="text-4xl font-bold mb-2">Bem-vindo ao NEXO</h1>
                        <p className="text-slate-300 text-lg">Seu novo comando central financeiro.</p>
                     </div>
                 </div>
                 
                 <div className="p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Lock className="w-5 h-5 text-indigo-500" /> Privacidade Total</h3>
                           <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Seus dados financeiros não são vendidos. No modo Offline, tudo fica no seu navegador.</p>
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Bot className="w-5 h-5 text-purple-500" /> Inteligência Artificial</h3>
                           <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Conecte sua chave do Gemini para ter um consultor financeiro pessoal.</p>
                        </div>
                     </div>

                     <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 p-4 rounded-xl mb-8">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                           Já possui uma chave de API do Gemini? (Opcional)
                        </label>
                        <div className="flex gap-2">
                           <input 
                              type="password" 
                              value={userKeyInput}
                              onChange={(e) => setUserKeyInput(e.target.value)}
                              placeholder="Cole sua chave AIza..."
                              className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 outline-none"
                           />
                           <a 
                              href="https://aistudio.google.com/app/apikey" 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                           >
                              Obter Chave <ExternalLink className="w-3 h-3" />
                           </a>
                        </div>
                     </div>

                     <button 
                        onClick={handleFinishWelcome}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                     >
                        Começar Agora <ChevronRight className="w-5 h-5" />
                     </button>
                 </div>
             </div>
          </div>
      )}

      {/* DONATE MODAL */}
      {isDonateModalOpen && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700 animate-scale-in text-center relative overflow-hidden">
                 <button onClick={() => setIsDonateModalOpen(false)} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                 
                 <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Apoie o Projeto</h3>
                 <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    O NEXO é desenvolvido de forma independente. Considere apoiar! ☕
                 </p>

                 <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 relative group cursor-pointer" onClick={copyPix}>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Chave Pix (E-mail)</p>
                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 break-all select-all">{PIX_KEY}</p>
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                       <span className="bg-white dark:bg-slate-800 text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                          <Copy className="w-3 h-3" /> Copiar
                       </span>
                    </div>
                 </div>
                 <p className="text-xs text-slate-400 mb-6">Nome: {PIX_NAME}</p>
             </div>
         </div>
      )}

      {/* API KEY MODAL */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-scale-in flex flex-col max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-4 flex-shrink-0">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Key className="w-6 h-6 text-indigo-500" /> Configurar Chave API</h3>
                   <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-6 h-6" /></button>
               </div>
               
               <div className="space-y-4">
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-sm text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                      <p className="font-bold flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> Por que preciso disso?</p>
                      <p>O Google Gemini é o cérebro por trás da IA do NEXO. Para usá-lo gratuitamente, você precisa gerar sua própria chave de acesso.</p>
                   </div>

                   <ol className="list-decimal list-inside text-sm text-slate-600 dark:text-slate-400 space-y-2 ml-1">
                      <li>Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">Google AI Studio</a>.</li>
                      <li>Faça login com sua conta Google.</li>
                      <li>Clique em <strong>Create API Key</strong>.</li>
                      <li>Copie o código gerado (começa com "AIza...") e cole abaixo.</li>
                   </ol>

                   <input 
                      type="password" 
                      value={userKeyInput} 
                      onChange={(e) => setUserKeyInput(e.target.value)} 
                      placeholder="Cole sua chave aqui (AIza...)" 
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
                   />
                   
                   <div className="flex gap-2">
                      <button 
                         onClick={handleSaveKey} 
                         disabled={!userKeyInput} 
                         className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                         Salvar e Conectar
                      </button>
                      <button 
                         onClick={handleRemoveKey} 
                         disabled={!hasKey} 
                         className="px-4 py-2 bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                         Remover
                      </button>
                   </div>
               </div>
           </div>
        </div>
      )}
    </>
  );
};
