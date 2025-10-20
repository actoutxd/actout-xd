// --- Firebase setup ---
const firebaseConfig = {
  apiKey: "AIzaSyABxAt_UX9HFOIicQBomoFTLBPSUgMWsdw",
  authDomain: "act-out-xd.firebaseapp.com",
  projectId: "act-out-xd",
  storageBucket: "act-out-xd.appspot.com",
  messagingSenderId: "829598383719",
  appId: "1:829598383719:web:ff9ece19198aeff41e9ec2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- DOM elements ---
const usernameInput = document.getElementById("username-input");
const usernameContainer = document.getElementById("username-container");
const indexView = document.getElementById("index-view");
const actView = document.getElementById("act-view");
const backBtn = document.getElementById("back-btn");
const actsList = document.getElementById("acts-list");
const actTitle = document.getElementById("act-title");
const postText = document.getElementById("post-text");
const postImage = document.getElementById("post-image");
const postBtn = document.getElementById("post-btn");
const actPosts = document.getElementById("act-posts");
const modStatus = document.getElementById("mod-status");
const modBadgeSlot = document.getElementById("mod-badge-slot");
const usernameDisplay = document.getElementById("username-display");

// --- Config ---
let username = localStorage.getItem("username") || "";
let currentAct = null;

const bannedWords = ["retard", "retarded", "fuck", "shit", "nigger", "faggot", "trannie"];
const moderators = ["kaiberriezz"];
const modBadgeUrl = "https://pixelsafari.neocities.org/favicon/nature/star/star26.gif";

// --- Helpers ---
function escapeHtml(str) {
  if (!str) return "";
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function containsBannedWords(text) {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/gi, " ");
  const parts = normalized.split(/\s+/).filter(Boolean);
  return bannedWords.some(w => parts.includes(w.toLowerCase()));
}

function isMod() {
  return moderators.includes(username);
}

function updateModUI() {
  const mod = isMod();
  modStatus.textContent = mod ? "logged in as moderator" : "not a moderator";
  modBadgeSlot.innerHTML = mod ? `<img src="${modBadgeUrl}" style="width:14px;height:14px;margin-left:4px;vertical-align:text-bottom;">` : "";
}

// --- Views ---
function showIndex() {
  usernameContainer.style.display = username ? "none" : "block";
  indexView.style.display = username ? "block" : "none";
  actView.style.display = "none";
  usernameDisplay.textContent = username || "";
  updateModUI();
}

function showAct() {
  indexView.style.display = "none";
  actView.style.display = "block";
  actTitle.textContent = currentAct;
  updateModUI();
  subscribePosts();
}

// --- Firestore ---
let unsubscribePosts = null;
function subscribePosts() {
  if (unsubscribePosts) unsubscribePosts();

  unsubscribePosts = db.collection("acts")
    .doc(currentAct)
    .collection("posts")
    .orderBy("time", "desc")
    .onSnapshot(snapshot => {
      actPosts.innerHTML = "";
      if (snapshot.empty) {
        actPosts.innerHTML = "<p style='opacity:0.6'>no posts yet in this act</p>";
        return;
      }

      snapshot.forEach(doc => {
        const p = doc.data();
        const div = document.createElement("div");
        div.className = "post";
        const canDelete = isMod() || p.username === username;
        const delButtonHtml = canDelete ? `<button data-id="${doc.id}" class="danger">delete</button>` : "";
        const userBadgeHtml = moderators.includes(p.username)
          ? `<img src="${modBadgeUrl}" style="width:14px;height:14px;margin-left:4px;vertical-align:text-bottom;">` : "";

        div.innerHTML = `
          <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">
            posted by ${escapeHtml(p.username)} ${userBadgeHtml} · ${new Date(p.time).toLocaleString()} ${delButtonHtml}
          </div>
          ${p.text ? `<p style="margin-bottom:8px; font-size:14px; white-space:pre-wrap;">${escapeHtml(p.text)}</p>` : ""}
          ${p.image ? `<img src="${p.image}" alt="post">` : ""}
        `;

        if (canDelete) {
          div.querySelector("button").addEventListener("click", () => {
            if (!confirm("Delete this post?")) return;
            db.collection("acts").doc(currentAct).collection("posts").doc(doc.id).delete();
          });
        }

        actPosts.appendChild(div);
      });
    });
}

// --- Init ---
(function init() {
  updateModUI();
  if (username) {
    usernameInput.value = username;
    showIndex();
  } else {
    usernameContainer.style.display = "block";
  }

  usernameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      username = usernameInput.value.trim();
      if (username) {
        localStorage.setItem("username", username);
        showIndex();
      }
    }
  });

  actsList.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentAct = btn.dataset.act;
      showAct();
    });
  });

  backBtn.addEventListener("click", () => {
    currentAct = null;
    showIndex();
    if (unsubscribePosts) unsubscribePosts();
  });

  postBtn.addEventListener("click", () => {
    const file = postImage.files[0];
    const textValue = postText.value.trim();

    if (!file) { alert("You must add an image!"); return; }
    if (containsBannedWords(textValue)) { alert("Your post contains banned words!"); return; }

    const reader = new FileReader();
    reader.onload = ev => {
      db.collection("acts").doc(currentAct).collection("posts").add({
        username,
        text: textValue,
        image: ev.target.result,
        time: Date.now()
      }).then(() => {
        postText.value = "";
        postImage.value = "";
      });
    };
    reader.readAsDataURL(file);
  });
})();
