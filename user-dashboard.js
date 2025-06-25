import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "earnsocialboost@hotmail.com";
const authDiv = document.getElementById("auth");
const panelDiv = document.getElementById("panel");
const usersDiv = document.getElementById("users");

onAuthStateChanged(auth, (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    authDiv.style.display = "none";
    panelDiv.style.display = "block";
    loadUsers();
  } else {
    logout();
  }
});

window.adminLogin = async function () {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

window.logout = function () {
  signOut(auth).then(() => location.reload());
};

async function loadUsers() {
  const q = query(collection(db, "users"), orderBy("points", "desc"));
  const snapshot = await getDocs(q);
  usersDiv.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = "user-card";
    div.innerHTML = `
      <p><strong>UID:</strong> ${doc.id}</p>
      <p><strong>Name:</strong> ${data.name || "N/A"}</p>
      <p><strong>Email:</strong> ${data.email || "N/A"}</p>
      <p><strong>Points:</strong> ${data.points || 0}</p>
      <p><strong>Tokens:</strong> ${data.tokens || 0}</p>
      <p><strong>Referrals:</strong> ${data.referrals || 0}</p>
      <hr>
    `;
    usersDiv.appendChild(div);
  });
}
