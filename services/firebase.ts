
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Configuração do Firebase para o projeto NEXO
const firebaseConfig = {
  apiKey: "AIzaSyAp9vMuLIhE-W8sEVpuzSWr7vvRHOu1pSc",
  authDomain: "nexo-bbbe5.firebaseapp.com",
  projectId: "nexo-bbbe5",
  storageBucket: "nexo-bbbe5.firebasestorage.app",
  messagingSenderId: "133978874707",
  appId: "1:133978874707:web:ba5e00d4c5e35b3c5df7a6"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o serviço de autenticação para ser usado no resto do app
export const auth = getAuth(app);
