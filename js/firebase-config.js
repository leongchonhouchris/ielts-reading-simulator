// =============================================================
// FIREBASE CONFIGURATION
// =============================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a project and a Firestore database (test mode)
// 3. Go to Project Settings > Your Apps > Add Web App
// 4. Copy the firebaseConfig values Firebase gives you
// 5. Replace the placeholder values below with your real values
// 6. Save the file and redeploy to Netlify
// =============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBJDW44yTId_csDzRb5nGO-6EH0mesQFuI",
  authDomain: "ielts-reading-simulator.firebaseapp.com",
  projectId: "ielts-reading-simulator",
  storageBucket: "ielts-reading-simulator.firebasestorage.app",
  messagingSenderId: "462677121296",
  appId: "1:462677121296:web:59baf77ab4ad5abec8ed95"
};

// Import Firebase modules (using CDN module syntax — no build tools needed)
import { initializeApp }                        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export { db, collection, doc, getDocs, getDoc, setDoc, deleteDoc, addDoc };
