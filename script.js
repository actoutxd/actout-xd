// ---------- Firebase setup (your config) ----------
const firebaseConfig = {
  apiKey: "AIzaSyABxAt_UX9HFOIicQBomoFTLBPSUgMWsdw",
  authDomain: "act-out-xd.firebaseapp.com",
  projectId: "act-out-xd",
  storageBucket: "act-out-xd.appspot.com",
  messagingSenderId: "829598383719",
  appId: "1:829598383719:web:ff9ece19198aeff41e9ec2"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (e) {
  console.warn("Firebase app init warning (might already be initialized):", e);
}
const db = firebase.firestore();

// ---------- DOM elements ----------
const usernameInput = document.getElementById("username-input");
const usernameBtn = document.getElementById("username-btn");
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
const modBadgeSlot = document.getElementById("mod-badge-slot");
const usernameDisplay = document.getElementById("username-display");
const modStatus = document.getElementById("mod-status");

// ---------- Settings ----------
let username = localStorage.getItem("username") || "";
let currentAct = null;
const moderators = ["kaiberriezz"];
const bannedWords = ["retard", "retarded", "fuck", "shit", "nigger", "faggot", "trannie"];
const modBadgeUrl = "https://pixelsafari.neocities.org/favicon/nature/star/star26.gif";

// ---------- Helpers ----------
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

// ---------- Views ----------
function showIndex() {
  usernameContainer.style.display = username ? "none" : "block";
  indexView.style.display = username ? "block" : "none";
  actView.style.display = "none";
  usernameDisplay.textContent = username || "";
  if (isMod()) modBadgeSlot.innerHTML = `<img src="${modBadgeUrl}" class="mod-badge">`; else modBadgeSlot.innerHTML = "";
}
function showAct() {
  usernameContainer.style.display = "none";
  indexView.style.display = "none";
  actView.style.display = "block";
  actTitle.textContent = currentAct;
  usernameDisplay.textContent = username || "";
  if (isMod()) modBadgeSlot.innerHTML = `<img src="${modBadgeUrl}" class="mod-badge">`; else modBadgeSlot.innerHTML = "";
  subscribePosts();
}

// ---------- Firestore subscription ----------
let unsubscribePosts = null;
function subscribePosts() {
  try {
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
            ? `<img src="${modBadgeUrl}" style="width:14px;height:14px;margin-left:4px;vertical-align:text-bottom;">`
            : "";

          div.innerHTML = `
            <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">
              posted by ${escapeHtml(p.username)} ${userBadgeHtml} · ${new Date(p.time).toLocaleString()} ${delButtonHtml}
            </div>
            ${p.text ? `<p style="margin-bottom:8px; font-size:14px; white-space:pre-wrap;">${escapeHtml(p.text)}</p>` : ""}
            <img src="${p.image}" alt="post">
          `;

          if (canDelete) {
            const btn = div.querySelector("button");
            btn.addEventListener("click", () => {
              if (!confirm("Delete this post?")) return;
              db.collection("acts").doc(currentAct).collection("posts").doc(doc.id).delete().catch(err=>{
                console.error("Failed to delete post:", err);
                alert("Delete failed — check console.");
              });
            });
          }

          actPosts.appendChild(div);
        });
      }, err => {
        console.error("Posts snapshot error:", err);
        actPosts.innerHTML = "<p style='opacity:0.6'>Failed to load posts (see console)</p>";
      });
  } catch (e) {
    console.error("subscribePosts error:", e);
  }
}

// ---------- Init ----------
(function init() {
  console.log("init script running");
  if (!firebase || !db) console.error("Firebase not available. Check SDK scripts and config.");

  // username handling
  function setUsername() {
    username = usernameInput.value.trim();
    if (!username) return;
    localStorage.setItem("username", username);
    showIndex();
  }

  // Enter key and button
  usernameInput.addEventListener("keypress", e => {
    if (e.key === "Enter") setUsername();
  });
  usernameBtn?.addEventListener("click", setUsername);

  // initial state
  if (username) {
    usernameInput.value = username;
    showIndex();
  } else {
    usernameContainer.style.display = "block";
  }

  // acts
  actsList.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentAct = btn.dataset.act;
      showAct();
    });
  });

  // back
  backBtn.addEventListener("click", () => {
    currentAct = null;
    showIndex();
    if (unsubscribePosts) {
      unsubscribePosts();
      unsubscribePosts = null;
    }
  });

  // posting
  postBtn.addEventListener("click", () => {
    const file = postImage.files[0];
    const textValue = postText.value.trim();
    if (!file) {
      alert("You must add an image!");
      return;
    }
    if (containsBannedWords(textValue) || containsBannedWords(file.name)) {
      alert("Your post contains banned words!");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(ev) {
      const payload = {
        username,
        text: textValue,
        image: ev.target.result,
        time: Date.now()
      };
      db.collection("acts").doc(currentAct).collection("posts").add(payload)
        .then(() => {
          postText.value = "";
          postImage.value = "";
          console.log("post added");
        })
        .catch(err => {
          console.error("Failed to add post:", err);
          alert("Failed to send post — check console.");
        });
    };
    reader.readAsDataURL(file);
  });

  console.log("init done");
})();
