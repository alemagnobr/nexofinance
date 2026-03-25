
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE ---
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

// Exporta o serviço de autenticação
export const auth = getAuth(app);

// Exporta o banco de dados (Firestore)
// Usamos initializeFirestore com ignoreUndefinedProperties: true para evitar erros quando campos opcionais (como 'month') são undefined
export const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
});
