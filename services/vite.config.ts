
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis do arquivo .env
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    base: '/nexofinance/',
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    define: {
      // Expõe a API_KEY para o código como process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    },
    build: {
      chunkSizeWarningLimit: 1000, // Aumenta limite do aviso para 1MB (opcional, mas reduz ruído)
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Separa Firebase (geralmente o maior)
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              // Separa Recharts (gráficos)
              if (id.includes('recharts')) {
                return 'vendor-recharts';
              }
              // Separa React e ReactDOM
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // Separa Google GenAI
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              // O resto vai para um vendor genérico
              return 'vendor-utils';
            }
          }
        }
      }
    }
  };
});
