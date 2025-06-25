import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  getDocs,
  addDoc,
  where,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const usernameSpan = document.getElementById("username");
const pointsSpan = document.getElementById("points");
const tokensSpan = document.getElementById("tokens");
const referralCount = document.getElementById("referral-count");
const referralInput = document.getElementById("referral-link");
const followListDiv = document.getElementById("follow-list");
const leaderboardDiv = document.getElementById("leaderboard");

// Google Login
window.login = async function () {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  handleLogin(result.user);
};

// Twitter Login
window.twitterLogin = async function () {
  const provider = new TwitterAuthProvider();
  const result = await signInWithPopup(auth, provider);
  handleLogin(result.user);
};

// On Auth Change
onAuthStateChanged(auth, async (user) => {
  if (user) handleLogin(user);
});

// Logout
window.logout = async function () {
  await signOut(auth);
  location.reload();
};

// Handle Login
async function handleLogin(user) {
  document.getElementById("auth").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  usernameSpan.textContent = user.displayName;

  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      points: 0,
      tokens: 0,
      referrals: 0,
      createdAt: serverTimestamp()
    });
  }

  loadUserData(user.uid);
  loadReferralLink(user.uid);
  loadFollowLinks();
  loadLeaderboard();
}

// Load User Data
async function loadUserData(uid) {
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);
  const data = docSnap.data();
  pointsSpan.textContent = data.points || 0;
  tokensSpan.textContent = data.tokens || 0;
  referralCount.textContent = data.referrals || 0;
}

// Referral Link
function loadReferralLink(uid) {
  const link = `${location.origin}/?ref=${uid}`;
  referralInput.value = link;
  referralInput.onclick = () => referralInput.select();
}

// Convert Points to Tokens
window.convertPointsToTokens = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);
  const points = docSnap.data().points;

  if (points < 100) {
    alert("You need at least 100 points to convert to tokens.");
    return;
  }

  const tokensToAdd = Math.floor(points / 10);
  const leftover = points % 10;

  await updateDoc(userRef, {
    points: leftover,
    tokens: increment(tokensToAdd)
  });

  alert(`🎉 Converted ${points} points to ${tokensToAdd} tokens.`);
  loadUserData(user.uid);
};

// Top-Up Request
window.submitTopUpRequest = async function () {
  const user = auth.currentUser;
  const amount = parseInt(document.getElementById("topup-amount").value);
  const note = document.getElementById("topup-note").value;

  if (!amount || amount <= 0) return alert("Invalid amount");

  await addDoc(collection(db, "topup_requests"), {
    uid: user.uid,
    amount,
    note,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Top-up request sent!");
};

// Load Follow Links
async function loadFollowLinks() {
  const links = [
    "https://twitter.com/example1",
    "https://twitter.com/example2",
    "https://twitter.com/example3"
  ];
  followListDiv.innerHTML = links.map(link =>
    `<p><a href="${link}" target="_blank">${link}</a> <button onclick="claimFollowPoints()">✅ Followed</button></p>`
  ).join('');
}

window.claimFollowPoints = async function () {
  const user = auth.currentUser;
  if (!user) return;
  await updateDoc(doc(db, "users", user.uid), { points: increment(10) });
  alert("You earned 10 points!");
  loadUserData(user.uid);
};

// Leaderboard
async function loadLeaderboard() {
  const q = query(collection(db, "users"), orderBy("points", "desc"));
  const snapshot = await getDocs(q);
  leaderboardDiv.innerHTML = "<ol>" + snapshot.docs.map(doc =>
    `<li>${doc.data().name || doc.id}: ${doc.data().points || 0} pts</li>`
  ).join('') + "</ol>";
};

// Navigation
window.goTo = function (section) {
  alert("Navigating to: " + section); // replace later with real navigation
};

// Referral from link
const params = new URLSearchParams(location.search);
if (params.has("ref")) {
  localStorage.setItem("referrer", params.get("ref"));
}
