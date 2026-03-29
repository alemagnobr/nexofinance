
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis do arquivo .env
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    base: './',
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
      chunkSizeWarningLimit: 1500, // Aumenta limite do aviso para 1.5MB
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            recharts: ['recharts'],
            lucide: ['lucide-react'],
            genai: ['@google/genai']
          }
        }
      }
    }
  };
});
