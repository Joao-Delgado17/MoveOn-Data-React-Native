import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// 🔹 Configuração correta do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDksA6Abvu3MZCKd0JcZQ4cirnQ8fFrKQw",
  authDomain: "pap11-rythmful.firebaseapp.com",
  projectId: "pap11-rythmful",
  storageBucket: "pap11-rythmful.appspot.com",
  messagingSenderId: "752580023619",
  appId: "1:752580023619:web:e1e69a0d52ec976ffd8bf6",
  measurementId: "G-DXXLN7KY6M",
};

// 🔹 Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
