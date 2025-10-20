/* script.js - Act Out (plain JS) */
/* Notes:
  
   - session moderation flag stored in sessionStorage 'actout_is_mod' (cleared on tab close)
*/

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

const setModContainer = document.getElementById("set-mod-container");
const setModPassword = document.getElementById("set-mod-password");
const setModBtn = document.getElementById("set-mod-btn");
const modPassword = document.getElementById("mod-password");
const modLoginBtn = document.getElementById("mod-login-btn");
const modLogoutBtn = document.getElementById("mod-logout-btn");
const modStatus = document.getElementById("mod-status");
const modBadgeSlot = document.getElementById("mod-badge-slot");
const usernameDisplay = document.getElementById("username-display");

let username = localStorage.getItem("username") || "";
let posts = JSON.parse(localStorage.getItem("posts") || "{}");
let currentAct = null;

// Banned words list (updated)
const bannedWords = ["retard", "retarded", "fuck", "shit", "nigger", "faggot", "trannie"]; // add slurs here

// helper: SHA-256 hex digest
async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// check banned words in text (ignores case and punctuation)
function containsBannedWords(text) {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/gi, " ");
  const parts = normalized.split(/\s+/).filter(Boolean);
  return bannedWords.some(w => parts.includes(w.toLowerCase()));
}

// ---- moderator helpers ----
function modHashExists() {
  return !!localStorage.getItem("actout_mod_hash");
}

// set one-time staff password
setModBtn.addEventListener("click", async () => {
  if (modHashExists()) {
    alert("A staff password is already set.");
    return;
  }
  const pw = setModPassword.value.trim();
  if (!pw) return alert("Enter a password to set.");
  const hash = await sha256Hex(pw);
  localStorage.setItem("actout_mod_hash", hash);
  setModPassword.value = "";
  setModContainer.style.display = "none";
  alert("Staff password set. Use it to log in.");
  updateModUI();
});

// login
modLoginBtn.addEventListener("click", async () => {
  const pw = modPassword.value.trim();
  if (!pw) return alert("Enter password to log in.");
  const hash = await sha256Hex(pw);
  const stored = localStorage.getItem("actout_mod_hash");
  if (stored === hash) {
    sessionStorage.setItem("actout_is_mod", "1");
    modPassword.value = "";
    updateModUI();
    alert("Moderator login successful.");
  } else {
    alert("Incorrect password.");
  }
});

// logout
modLogoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("actout_is_mod");
  updateModUI();
});

// update moderator UI
function updateModUI() {
  const isMod = !!sessionStorage.getItem("actout_is_mod");
  const hasHash = modHashExists();

  setModContainer.style.display = hasHash ? "none" : "flex";

  modLoginBtn.style.display = hasHash && !isMod ? "inline-block" : "none";
  modPassword.style.display = hasHash && !isMod ? "inline-block" : "none";
  modLogoutBtn.style.display = isMod ? "inline-block" : "none";

  modStatus.textContent = isMod ? "logged in as moderator" : (hasHash ? "staff password set" : "no staff password set");

  modBadgeSlot.innerHTML = isMod ? '<span class="mod-badge">MOD</span>' : '';
}

// ---- view rendering ----
function showIndex() {
  usernameContainer.style.display = username ? "none" : "block";
  indexView.style.display = username ? "block" : "none";
  actView.style.display = "none";
  usernameDisplay.textContent = username || "";
}

function showAct() {
  usernameContainer.style.display = "none";
  indexView.style.display = "none";
  actView.style.display = "block";
  actTitle.textContent = currentAct;
  usernameDisplay.textContent = username || "";
  updateModUI();
  renderPosts();
}

// render posts with delete buttons only for owner or moderator
function renderPosts() {
  actPosts.innerHTML = "";
  const actList = posts[currentAct] || [];
  if (actList.length === 0) {
    actPosts.innerHTML = "<p style='opacity:0.6'>no posts yet in this act</p>";
    return;
  }

  const isMod = !!sessionStorage.getItem("actout_is_mod");

  actList.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "post";
    const canDelete = isMod || (username && username === p.username);
    const delButtonHtml = canDelete ? `<button data-idx="${idx}" class="danger">delete</button>` : "";
    div.innerHTML = `
      <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">
        posted by ${escapeHtml(p.username)} · ${escapeHtml(p.time)} ${delButtonHtml}
      </div>
      ${p.text ? `<p style="margin-bottom:8px; font-size:14px; white-space:pre-wrap;">${escapeHtml(p.text)}</p>` : ""}
      <img src="${p.image}" alt="post">
    `;
    if (canDelete) {
      const btn = div.querySelector("button");
      btn.addEventListener("click", () => {
        if (!confirm("Delete this post?")) return;
        posts[currentAct].splice(idx, 1);
        localStorage.setItem("posts", JSON.stringify(posts));
        renderPosts();
      });
    }
    actPosts.appendChild(div);
  });
}

// helper to escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// ---- init / events ----
if (username) {
  usernameInput.value = username;
  showIndex();
} else {
  usernameContainer.style.display = "block";
}

usernameInput.addEventListener("change", () => {
  username = usernameInput.value.trim();
  if (username) {
    localStorage.setItem("username", username);
    showIndex();
  }
});

// act buttons
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
});

// post handler
postBtn.addEventListener("click", () => {
  const file = postImage.files[0];
  const textValue = postText.value.trim();

  if (!file) {
    alert("You must add an image!");
    return;
  }
  if (containsBannedWords(textValue)) {
    alert("Your post contains banned words in the text and cannot be submitted.");
    return;
  }
  if (containsBannedWords(file.name)) {
    alert("Your image filename contains banned words and cannot be submitted.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(ev) {
    const newPost = {
      username,
      text: textValue,
      image: ev.target.result,
      time: new Date().toLocaleString()
    };
    posts[currentAct] = posts[currentAct] ? [newPost, ...posts[currentAct]] : [newPost];
    localStorage.setItem("posts", JSON.stringify(posts));
    postText.value = "";
    postImage.value = "";
    renderPosts();
  };
  reader.readAsDataURL(file);
});

// update mod UI on load
updateModUI();
