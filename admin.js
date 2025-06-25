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
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "earnsocialboost@hotmail.com";
const authDiv = document.getElementById("auth");
const panelDiv = document.getElementById("panel");
const requestsDiv = document.getElementById("requests");

// Auth State
onAuthStateChanged(auth, (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    authDiv.style.display = "none";
    panelDiv.style.display = "block";
    loadRequests();
  } else {
    console.warn("Admin access denied.");
    logout();
  }
});

// Admin login
window.adminLogin = async function () {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

// Logout
window.logout = function () {
  signOut(auth).then(() => location.reload());
};

// Load Top-Up Requests
async function loadRequests() {
  const q = query(collection(db, "topup_requests"), where("status", "==", "pending"));
  const snapshot = await getDocs(q);
  requestsDiv.innerHTML = "";

  if (snapshot.empty) {
    requestsDiv.innerHTML = "<p>No pending top-up requests.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "request-box";
    div.innerHTML = `
      <p><strong>User ID:</strong> ${data.uid}</p>
      <p><strong>Amount:</strong> ${data.amount}</p>
      <p><strong>Note:</strong> ${data.note}</p>
      <button onclick="approve('${docSnap.id}', '${data.uid}', ${data.amount})">✅ Approve</button>
      <button onclick="reject('${docSnap.id}')">❌ Reject</button>
    `;
    requestsDiv.appendChild(div);
  });
}

// Approve request
window.approve = async function (requestId, uid, amount) {
  await updateDoc(doc(db, "users", uid), {
    points: increment(amount)
  });

  await updateDoc(doc(db, "topup_requests", requestId), {
    status: "approved",
    approvedAt: serverTimestamp(),
    admin: ADMIN_EMAIL
  });

  alert("Request approved.");
  loadRequests();
};

// Reject request
window.reject = async function (requestId) {
  await updateDoc(doc(db, "topup_requests", requestId), {
    status: "rejected",
    reviewedAt: serverTimestamp(),
    admin: ADMIN_EMAIL
  });

  alert("Request rejected.");
  loadRequests();
};

// Download approved as JSON (Ctrl + E)
document.addEventListener("keydown", async (e) => {
  if (e.ctrlKey && e.key === "e") {
    e.preventDefault();
    const q = query(collection(db, "topup_requests"), where("status", "==", "approved"));
    const snapshot = await getDocs(q);
    const approved = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const blob = new Blob([JSON.stringify(approved, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "approved_topups.json";
    a.click();
  }
});
