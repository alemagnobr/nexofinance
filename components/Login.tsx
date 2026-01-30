
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Hexagon, Loader2, LogIn, UserPlus, AlertCircle, Check, Copy, UserX } from 'lucide-react';

interface LoginProps {
  onGuestLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onGuestLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authErrorDomain, setAuthErrorDomain] = useState(''); // Estado para guardar domínio bloqueado
  const [loading, setLoading] = useState(false);

  const handleAuthError = (err: any) => {
    console.error(err);
    let msg = "Erro ao autenticar. Verifique suas credenciais.";
    
    if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
    if (err.code === 'auth/invalid-email') msg = "E-mail inválido.";
    if (err.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = "E-mail ou senha incorretos.";
    if (err.code === 'auth/invalid-credential') msg = "Credenciais inválidas.";
    
    // Tratamento específico para domínio não autorizado
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-scale-in">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="relative z-10 flex flex-col items-center">
             <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
                <Hexagon className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-2xl font-bold text-white tracking-tight">NEXO</h1>
             <p className="text-slate-400 text-sm mt-1">Seu Hub Financeiro Inteligente</p>
          </div>
          
          {/* Decorative Circles */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">
            {isRegistering ? 'Criar Nova Conta' : 'Acesse sua Conta'}
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex flex-col items-start gap-2 text-sm text-rose-600 dark:text-rose-300 animate-fade-in">
               <div className="flex items-center gap-2">
                   <AlertCircle className="w-5 h-5 flex-shrink-0" />
                   <span className="font-bold">{error}</span>
               </div>
               
               {authErrorDomain && (
                   <div className="mt-2 w-full">
                       <p className="text-xs mb-1 text-slate-600 dark:text-slate-400">
                           Para corrigir, adicione este domínio no Firebase Console:
                       </p>
                       <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded p-2 mb-2">
                           <code className="text-xs flex-1 truncate select-all">{authErrorDomain}</code>
                           <button onClick={copyDomain} className="text-rose-500 hover:text-rose-700">
                               <Copy className="w-4 h-4" />
                           </button>
                       </div>
                       <button 
                           onClick={onGuestLogin}
                           className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs font-bold transition-colors"
                       >
                           Ignorar e Entrar como Convidado
                       </button>
                   </div>
               )}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRegistering ? (
                <><UserPlus className="w-5 h-5" /> Criar Conta</>
              ) : (
                <><LogIn className="w-5 h-5" /> Entrar</>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Ou</span>
            </div>
          </div>

          <div className="space-y-3">
             <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" color="#4285F4"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" color="#34A853"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" color="#FBBC05"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" color="#EA4335"/>
                 </svg>
                 Entrar com Google
              </button>

              <button 
                type="button"
                onClick={onGuestLogin}
                className="w-full py-3 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                 <UserX className="w-5 h-5" />
                 Entrar como Convidado (Offline)
              </button>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-sm"
            >
              {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
