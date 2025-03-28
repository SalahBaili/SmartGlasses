import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDatabase,
  ref,
  onValue,
  push,
  remove,
  update,
  set,
  get,
} from "firebase/database";

// 🔥 Ta configuration Firebase (copiée depuis la console Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyCwUBY8pu7qjo9Jnx7V2v8PH352jOi-b4E",
  authDomain: "pfa2025-98378.firebaseapp.com",
  databaseURL: "https://pfa2025-98378-default-rtdb.firebaseio.com", // ✅ URL CORRECTE
  projectId: "pfa2025-98378",
  storageBucket: "pfa2025-98378.appspot.com",
  messagingSenderId: "272436758282",
  appId: "1:272436758282:android:ad1de4e682920498389cf3"
};

// ✅ Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth persistante avec AsyncStorage (important !)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ Realtime Database
const database = getDatabase(app);

// ✅ Exports pour le projet
export {
  auth,
  database,
  ref,
  onValue,
  push,
  remove,
  update,
  set,
  get,
};
