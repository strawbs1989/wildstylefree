import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyADr8JTwvtlIgXG04JxeP8Q2LjQznyWwms",
  authDomain: "wildstyle-chat.firebaseapp.com",
  projectId: "wildstyle-chat",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

