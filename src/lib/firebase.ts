// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "studio-5131382581-db625",
  appId: "1:80936435559:web:3f14072e020fcb375379c2",
  apiKey: "AIzaSyCktNb66q6rLLTcti-DZW0ap5C1FrhSphs",
  authDomain: "studio-5131382581-db625.firebaseapp.com",
  messagingSenderId: "80936435559",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore, collection, query, where, getDocs };
