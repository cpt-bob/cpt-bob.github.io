import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { writable, type Writable } from "svelte/store";
import type { User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBpKsDGhucKO_QbNgjXG3vX1vuduYl8xy4",
  authDomain: "shopping-list-e939f.firebaseapp.com",
  databaseURL: "https://shopping-list-e939f-default-rtdb.firebaseio.com/",
  projectId: "shopping-list-e939f",
  storageBucket: "shopping-list-e939f.appspot.com",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export const authUser = writable<User | null | undefined>(undefined);
onAuthStateChanged(auth, (user) => {
  authUser.set(user);
});
