import React from 'react';
import { X, ExternalLink, Calendar, CheckSquare, ShieldCheck, Building2, CreditCard, Landmark, Gift } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleOpenLink = (webUrl: string, appScheme?: string) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && appScheme) {
      // Try to open the app via deep link
      window.location.href = appScheme;
      
      // Fallback to web URL after a short delay if the app doesn't open
      setTimeout(() => {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }, 1500);
    } else {
      // On desktop, or if no app scheme is provided, just open the web URL
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
    
    onClose();
  };

  const shortcuts = [
    {
      id: 'serasa',
      name: 'Serasa',
      icon: ShieldCheck,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      webUrl: 'https://www.serasa.com.br/',
      appScheme: 'serasa://'
    },
    {
      id: 'google-agenda',
      name: 'Google Agenda',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      webUrl: 'https://calendar.google.com/',
      appScheme: 'content://com.android.calendar/time/'
    },
    {
      id: 'trello',
      name: 'Trello',
      icon: CheckSquare,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100 dark:bg-sky-900/30',
      webUrl: 'https://trello.com/',
      appScheme: 'trello://'
    },
    {
      id: 'govbr',
      name: 'Gov.br',
      icon: Building2,
      color: 'text-blue-800 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      webUrl: 'https://www.gov.br/',
      appScheme: 'govbr://'
    },
    {
      id: 'nubank',
      name: 'Nubank',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      webUrl: 'https://app.nubank.com.br/',
      appScheme: 'nubank://'
    },
    {
      id: 'itau',
      name: 'Itaú',
      icon: Landmark,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      webUrl: 'https://www.itau.com.br/',
      appScheme: 'itau://'
    },
    {
      id: 'inter',
      name: 'Banco Inter',
      icon: Landmark,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      webUrl: 'https://bancointer.com.br/',
      appScheme: 'bancointer://'
    },
    {
      id: 'pluxee',
      name: 'Pluxee',
      icon: Gift,
      color: 'text-rose-500',
      bgColor: 'bg-rose-100 dark:bg-rose-900/30',
      webUrl: 'https://www.pluxee.com.br/',
      appScheme: 'sodexobr://' // Pluxee was formerly Sodexo, often retains the scheme or uses pluxee://
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-indigo-500" />
            Atalhos Rápidos
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Acesse rapidamente seus aplicativos e sites favoritos. No celular, tentaremos abrir o aplicativo nativo.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.id}
                onClick={() => handleOpenLink(shortcut.webUrl, shortcut.appScheme)}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${shortcut.bgColor}`}>
                  <shortcut.icon className={`w-5 h-5 ${shortcut.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {shortcut.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
