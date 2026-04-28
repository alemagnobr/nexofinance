import React from 'react';
import { Apple } from 'lucide-react';

export const DietaView: React.FC = () => {
  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Apple className="w-6 h-6 text-green-500" />
            Dieta
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Acompanhe refeições e deixe a IA calcular proteínas e macros.
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
        <p className="text-slate-500 dark:text-slate-400">
          Esta funcionalidade será desenvolvida em breve.
        </p>
      </div>
    </div>
  );
};
