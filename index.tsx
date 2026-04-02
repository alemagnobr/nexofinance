
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usando caminho relativo para ser compatível com diferentes base paths
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

import { FocusProvider } from './contexts/FocusContext';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
          <h1 style={{ color: '#e53e3e' }}>Ops! Algo deu errado.</h1>
          <p>O aplicativo encontrou um erro inesperado.</p>
          <pre style={{ background: '#f7fafc', padding: '15px', borderRadius: '5px', overflowX: 'auto', marginTop: '20px' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

let root = (window as any).__REACT_ROOT__;
if (!root) {
  root = ReactDOM.createRoot(rootElement);
  (window as any).__REACT_ROOT__ = root;
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <FocusProvider>
        <App />
      </FocusProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
