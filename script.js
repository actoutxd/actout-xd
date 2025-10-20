/* script.js - Act Out (plain JS)
   Full functionality: banned words, moderation, delete posts, mod badge
   Staff password auto-set to (NO YOU GUYS FONT GET) if none exists
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

// posts & user
let username = localStorage.getItem("username") || "";
let posts = JSON.parse(localStorage.getItem("posts") || "{}");
let currentAct = null;

// banned words
const bannedWords = ["retard", "retarded", "fuck", "shit", "nigger", "faggot", "trannie"]; 
const modBadgeUrl = "https://pixelsafari.neocities.org/favicon/nature/star/star26.gif";

// --- helpers ---
async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,"0")).join("");
}

function containsBannedWords(text) {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/gi, " ");
  const parts = normalized.split(/\s+/).filter(Boolean);
  return bannedWords.some(w => parts.includes(w.toLowerCase()));
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

// --- moderator helpers ---
function modHashExists() { return !!localStorage.getItem("actout_mod_hash"); }

setModBtn?.addEventListener("click", async () => {
  if (modHashExists()) return alert("Staff password already set");
  const pw = setModPassword.value.trim();
  if (!pw) return alert("Enter password to set");
  const hash = await sha256Hex(pw);
  localStorage.setItem("actout_mod_hash", hash);
  setModPassword.value="";
  setModContainer.style.display="none";
  updateModUI();
});

modLoginBtn?.addEventListener("click", async () => {
  const pw = modPassword.value.trim();
  if (!pw) return alert("Enter password to log in.");
  const hash = await sha256Hex(pw);
  if (hash === localStorage.getItem("actout_mod_hash")) {
    sessionStorage.setItem("actout_is_mod","1");
    modPassword.value="";
    updateModUI();
    alert("Moderator login successful");
  } else alert("Incorrect password");
});

modLogoutBtn?.addEventListener("click", () => {
  sessionStorage.removeItem("actout_is_mod");
  updateModUI();
});

function updateModUI() {
  const isMod = !!sessionStorage.getItem("actout_is_mod");
  const hasHash = modHashExists();
  if(setModContainer) setModContainer.style.display = hasHash ? "none" : "flex";
  if(modLoginBtn) modLoginBtn.style.display = hasHash && !isMod ? "inline-block" : "none";
  if(modPassword) modPassword.style.display = hasHash && !isMod ? "inline-block" : "none";
  if(modLogoutBtn) modLogoutBtn.style.display = isMod ? "inline-block" : "none";
  if(modStatus) modStatus.textContent = isMod ? "logged in as moderator" : (hasHash ? "staff password set" : "no staff password set");
  if(modBadgeSlot) modBadgeSlot.innerHTML = isMod ? '<span class="mod-badge">MOD</span>' : '';
}

// --- views ---
function showIndex() {
  usernameContainer.style.display = username ? "none" : "block";
  indexView.style.display = username ? "block" : "none";
  actView.style.display = "none";
  usernameDisplay.textContent = username || "";
}

function showAct() {
  usernameContainer.style.display="none";
  indexView.style.display="none";
  actView.style.display="block";
  actTitle.textContent=currentAct;
  usernameDisplay.textContent=username||"";
  updateModUI();
  renderPosts();
}

// --- posts rendering ---
function renderPosts() {
  actPosts.innerHTML = "";
  const actList = posts[currentAct] || [];
  if(actList.length===0) { actPosts.innerHTML="<p style='opacity:0.6'>no posts yet in this act</p>"; return; }
  const isMod = !!sessionStorage.getItem("actout_is_mod");

  actList.forEach((p, idx)=>{
    const div = document.createElement("div");
    div.className="post";
    const canDelete = isMod || (username && username === p.username);
    const delButtonHtml = canDelete ? `<button data-idx="${idx}" class="danger">delete</button>` : "";
    const userBadgeHtml = isMod ? `<img src="${modBadgeUrl}" style="width:14px;height:14px;margin-left:4px;vertical-align:text-bottom;">` : "";

    div.innerHTML=`
      <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">
        posted by ${escapeHtml(p.username)} ${userBadgeHtml} · ${escapeHtml(p.time)} ${delButtonHtml}
      </div>
      ${p.text ? `<p style="margin-bottom:8px; font-size:14px; white-space:pre-wrap;">${escapeHtml(p.text)}</p>` : ""}
      <img src="${p.image}" alt="post">
    `;

    if(canDelete){
      const btn = div.querySelector("button");
      btn.addEventListener("click", ()=>{
        if(!confirm("Delete this post?")) return;
        posts[currentAct].splice(idx,1);
        localStorage.setItem("posts", JSON.stringify(posts));
        renderPosts();
      });
    }
    actPosts.appendChild(div);
  });
}

// --- init ---
(async function init() {
  if(!modHashExists()){
    const autoPw="Sug•|!";
    const hash=await sha256Hex(autoPw);
    localStorage.setItem("actout_mod_hash",hash);
    if(setModContainer) setModContainer.style.display="none";
  }

  updateModUI();

  if(username){ usernameInput.value=username; showIndex(); } else { usernameContainer.style.display="block"; }

  usernameInput.addEventListener("change", ()=>{
    username=usernameInput.value.trim();
    if(username){ localStorage.setItem("username", username); showIndex(); }
  });

  actsList.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", ()=>{ currentAct=btn.dataset.act; showAct(); });
  });

  backBtn.addEventListener("click", ()=>{ currentAct=null; showIndex(); });

  postBtn.addEventListener("click", ()=>{
    const file = postImage.files[0];
    const textValue = postText.value.trim();
    if(!file){ alert("You must add an image!"); return; }
    if(containsBannedWords(textValue)){ alert("Your post contains banned words and cannot be submitted."); return; }
    if(containsBannedWords(file.name)){ alert("Your image filename contains banned words and cannot be submitted."); return; }

    const reader = new FileReader();
    reader.onload = function(ev){
      const newPost = {
        username,
        text: textValue,
        image: ev.target.result,
        time: new Date().toLocaleString()
      };
      posts[currentAct] = posts[currentAct] ? [newPost, ...posts[currentAct]] : [newPost];
      localStorage.setItem("posts", JSON.stringify(posts));
      postText.value="";
      postImage.value="";
      renderPosts();
    };
    reader.readAsDataURL(file);
  });
})();
