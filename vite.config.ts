
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis do arquivo .env
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    // base: '/nexofinance/', // Removido para funcionar na raiz do domínio atual (Cloud Shell/Preview)
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    define: {
      // Expõe a API_KEY para o código como process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }
  };
});
