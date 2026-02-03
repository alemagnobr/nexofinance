
import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Hexagon, Loader2, LogIn, UserPlus, AlertCircle, Copy, UserX, Settings, Key, Linkedin, TrendingUp, CheckCircle2, ShieldCheck, PieChart as PieIcon, BarChart3, Heart, Sparkles } from 'lucide-react';

interface LoginProps {
  onGuestLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onGuestLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authErrorDomain, setAuthErrorDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfig, setNeedsConfig] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  // PIX Constants
  const PIX_KEY = "028.268.001-24";
  const PIX_NAME = "Alexandre Magno S. Linhares";

  // Verifica se o Firebase está configurado com as chaves reais
  useEffect(() => {
    // @ts-ignore
    const apiKey = auth.app.options.apiKey;
    if (!apiKey || apiKey === "SUA_API_KEY_AQUI" || apiKey.includes("SUA_API_KEY")) {
        setNeedsConfig(true);
    }
  }, []);

  const handleAuthError = (err: any) => {
    console.error(err);
    let msg = "Erro ao autenticar. Verifique suas credenciais.";
    
    if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
    if (err.code === 'auth/invalid-email') msg = "E-mail inválido.";
    if (err.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = "E-mail ou senha incorretos.";
    if (err.code === 'auth/invalid-credential') msg = "Credenciais inválidas.";
    if (err.code === 'auth/invalid-api-key') {
        msg = "Chave de API inválida.";
        setNeedsConfig(true);
    }
    
    if (err.code === 'auth/unauthorized-domain') {
        msg = "Domínio não autorizado pelo Firebase.";
        setAuthErrorDomain(window.location.hostname);
    } else {
        setAuthErrorDomain('');
    }
    
    setError(msg);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthErrorDomain('');
    setLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setAuthErrorDomain('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const copyDomain = () => {
      navigator.clipboard.writeText(authErrorDomain);
      alert('Domínio copiado!');
  };

  const copyPix = () => {
      navigator.clipboard.writeText(PIX_KEY);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
  };

  // TELA DE AJUDA PARA CONFIGURAÇÃO (Se detectar chaves inválidas)
  if (needsConfig) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-700 animate-scale-in flex flex-col md:flex-row">
                <div className="bg-indigo-600 p-8 text-white md:w-1/3 flex flex-col items-center justify-center text-center">
                    <Settings className="w-16 h-16 mb-4 opacity-80" />
                    <h2 className="text-xl font-bold">Configuração Necessária</h2>
                    <p className="text-indigo-100 text-sm mt-2">Para usar o modo online, você precisa conectar seu Firebase.</p>
                </div>
                <div className="p-8 md:w-2/3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Siga estes passos:</h3>
                    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex gap-3">
                            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded h-fit font-bold">1</div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Crie o Banco de Dados</p>
                                <p>No Console do Firebase, vá em <strong>Firestore Database</strong>, clique em "Criar banco de dados", escolha a região (nam5) e clique em "Iniciar no modo de produção".</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded h-fit font-bold">2</div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Ative o Login</p>
                                <p>Vá em <strong>Authentication</strong> &gt; Sign-in method e ative "E-mail/senha".</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded h-fit font-bold">3</div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Copie as Chaves</p>
                                <p>Vá nas Configurações do Projeto (⚙️), role até "Seus aplicativos" e copie o objeto <code>firebaseConfig</code>.</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-xs">
                            <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <Key className="w-3 h-3" /> Ação Necessária no Código
                            </p>
                            <p className="mt-1">Abra o arquivo <code>services/firebase.ts</code> e substitua <code>"SUA_API_KEY_AQUI"</code> pelos dados reais que você copiou.</p>
                        </div>
                    </div>
                    <button 
                        onClick={onGuestLogin}
                        className="w-full mt-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <UserX className="w-4 h-4" />
                        Pular e Usar Modo Offline (Convidado)
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex font-sans">
      
      {/* LEFT SIDE - LOGIN FORM */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center p-8 md:p-12 lg:p-16 relative overflow-y-auto">
        
        {/* Logo Header */}
        <div className="flex items-center gap-2 mb-10">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
                <Hexagon className="w-6 h-6 text-white" />
            </div>
            <div className="leading-tight">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">NEXO</h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Financial Hub</p>
            </div>
        </div>

        <div className="max-w-sm w-full mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {isRegistering ? 'Criar Conta' : 'Acesse sua Conta'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
                {isRegistering ? 'Comece a controlar suas finanças hoje.' : 'Bem-vindo de volta! Por favor, insira seus dados.'}
            </p>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 rounded-r-lg flex flex-col gap-1 animate-fade-in">
                   <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                       <AlertCircle className="w-4 h-4" />
                       <span>{error}</span>
                   </div>
                   {authErrorDomain && (
                       <div className="mt-2 pl-6">
                           <p className="text-xs text-slate-600 mb-1">Domínio não autorizado:</p>
                           <code className="text-xs bg-white px-1 py-0.5 rounded border border-rose-200 block mb-2">{authErrorDomain}</code>
                           <button onClick={copyDomain} className="text-xs underline text-rose-600">Copiar Domínio</button>
                       </div>
                   )}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">E-mail</label>
                   <input 
                     type="email" 
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                     placeholder="nome@exemplo.com"
                   />
                </div>

                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Senha</label>
                   <input 
                     type="password" 
                     required
                     minLength={6}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                     placeholder="••••••••"
                   />
                   {!isRegistering && (
                       <div className="flex justify-end mt-1">
                           <button type="button" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Esqueceu a senha?</button>
                       </div>
                   )}
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isRegistering ? (
                    'Cadastrar'
                  ) : (
                    'Entrar'
                  )}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-slate-900 text-slate-400 font-medium">ou continue com</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-300 text-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" color="#4285F4"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" color="#34A853"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" color="#FBBC05"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" color="#EA4335"/>
                    </svg>
                    Google
                </button>
                <button 
                    type="button"
                    onClick={onGuestLogin}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-300 text-sm"
                >
                    <UserX className="w-5 h-5 text-slate-500" />
                    Convidado
                </button>
            </div>

            <div className="mt-8 text-center">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {isRegistering ? 'Já é cliente?' : 'Ainda não tem conta?'}
                    <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="ml-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                        {isRegistering ? 'Fazer Login' : 'Cadastre-se grátis'}
                    </button>
                </p>
            </div>
            
            {/* SUPPORT / PIX SECTION - EVIDENT STYLE */}
            <div className="mt-10 mb-4">
                <div 
                    onClick={copyPix}
                    className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-700/50 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-4 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 transition-all transform hover:-translate-y-1"
                >
                   <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                       Apoie o Dev ☕
                   </div>

                   <div className="flex items-center gap-4 relative z-0">
                       <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full group-hover:scale-110 transition-transform shadow-inner">
                           <Heart className="w-6 h-6 text-indigo-600 dark:text-indigo-400 fill-indigo-200 dark:fill-indigo-900" />
                       </div>
                       <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide mb-1">
                               Gostou? Mande um Pix!
                           </p>
                           <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                               <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 truncate select-all">
                                   {PIX_KEY}
                               </p>
                               <span className="text-[9px] bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-1.5 rounded font-sans font-bold">Chave CPF</span>
                           </div>
                       </div>
                       <div className="text-indigo-300 group-hover:text-indigo-600 transition-colors">
                           {pixCopied ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6" />}
                       </div>
                   </div>
                   
                   {/* Tooltip confirmation */}
                   {pixCopied && (
                       <div className="absolute inset-0 bg-indigo-900/90 backdrop-blur-sm flex items-center justify-center text-white font-bold rounded-xl animate-fade-in z-20">
                           <div className="flex items-center gap-2">
                               <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                               Chave Pix Copiada!
                           </div>
                       </div>
                   )}
                   <p className="text-[10px] text-slate-400 mt-2 text-center opacity-60 group-hover:opacity-100 transition-opacity">
                      {PIX_NAME}
                   </p>
                </div>
            </div>

            <div className="mt-6 text-center">
                 <a 
                    href="https://www.linkedin.com/in/alemagnobr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-indigo-500 transition-colors inline-flex items-center gap-1"
                 >
                    <Linkedin className="w-3 h-3" /> Alexandre Magno
                 </a>
            </div>

        </div>
      </div>

      {/* RIGHT SIDE - VISUALS */}
      <div className="hidden md:flex flex-1 relative bg-[#4c35de] overflow-hidden items-center justify-center p-8">
         {/* Background Shapes */}
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white opacity-5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400 opacity-10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>
         
         {/* Decorative Grid */}
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

         {/* Content Container */}
         <div className="relative z-10 w-full max-w-lg">
            
            {/* Mock Dashboard Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl mb-12 transform hover:scale-[1.02] transition-transform duration-500">
               <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                   <div>
                       <p className="text-white/60 text-xs font-semibold uppercase">Performance Visualisation</p>
                       <p className="text-white text-lg font-bold mt-1">Crescimento Patrimonial</p>
                   </div>
                   <div className="flex gap-2">
                       <div className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs font-bold">+6.9%</div>
                       <div className="p-1 bg-white/10 rounded text-white/70"><BarChart3 className="w-4 h-4"/></div>
                   </div>
               </div>

               {/* CSS Bar Chart Simulation */}
               <div className="h-48 flex items-end justify-between gap-3 px-2">
                   {[35, 55, 45, 70, 60, 85, 75].map((h, i) => (
                       <div key={i} className="w-full bg-white/10 rounded-t-lg relative group overflow-hidden" style={{height: '100%'}}>
                            <div 
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-400 to-purple-300 rounded-t-lg transition-all duration-1000 group-hover:opacity-90" 
                                style={{ height: `${h}%` }}
                            ></div>
                            {/* Line accent */}
                            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/30" style={{bottom: `${h}%`}}></div>
                       </div>
                   ))}
               </div>
               <div className="flex justify-between mt-3 text-xs text-white/40 font-medium px-2">
                   <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span>
               </div>
            </div>

            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-3">Bem-vindo de volta</h2>
                <p className="text-indigo-200 text-lg leading-relaxed">
                   Gerencie suas finanças com inteligência, <br/>segurança e clareza total.
                </p>
            </div>
         </div>
         
         {/* Flag/Language Icon Top Right (Mock) */}
         <div className="absolute top-8 right-8">
             <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 text-xl shadow-lg cursor-default">
                 🇧🇷
             </div>
         </div>
      </div>

    </div>
  );
};
