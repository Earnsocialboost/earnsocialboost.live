import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider, TwitterAuthProvider,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authDiv = document.getElementById("auth");
const signupForm = document.getElementById("signup-form");
const dashboard = document.getElementById("dashboard");
const usernameEl = document.getElementById("username");
const pointsEl = document.getElementById("points");
const tokensEl = document.getElementById("tokens");

function showDashboard(user, data) {
  authDiv.style.display = "none";
  signupForm.style.display = "none";
  dashboard.style.display = "block";
  usernameEl.innerText = user.displayName || data.username || "User";
  pointsEl.innerText = data.points || 0;
  tokensEl.innerText = data.tokens || 0;
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      signupForm.style.display = "block";
      authDiv.style.display = "none";
    } else {
      showDashboard(user, snap.data());
    }
  }
});

window.submitSignupForm = async () => {
  const user = auth.currentUser;
  const name = document.getElementById("name").value;
  const username = document.getElementById("username").value;
  const country = document.getElementById("country").value;
  const twitter = document.getElementById("twitter").value;
  const telegram = document.getElementById("telegram").value;

  if (!name || !username || !country || !twitter || !telegram) {
    return alert("❌ Fill all fields");
  }

  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    name, username, country, twitter, telegram,
    points: 0, tokens: 0
  });

  showDashboard(user, { name, username, points: 0, tokens: 0 });
};

window.login = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert("Google Login Error: " + err.message);
  }
};

window.twitterLogin = async () => {
  const provider = new TwitterAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert("Twitter Login Error: " + err.message);
  }
};

window.logout = () => {
  signOut(auth).then(() => location.reload());
};
