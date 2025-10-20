/* fave ver of codr
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

const modPassword = document.getElementById("mod-password");
const modLoginBtn = document.getElementById("mod-login-btn");
const modLogoutBtn = document.getElementById("mod-logout-btn");
const modStatus = document.getElementById("mod-status");
const modBadgeSlot = document.getElementById("mod-badge-slot");
const usernameDisplay = document.getElementById("username-display");

let username = localStorage.getItem("username") || "";
let posts = JSON.parse(localStorage.getItem("posts") || "{}");
let currentAct = null;

const bannedWords = ["retard", "retarded", "fuck", "shit", "nigger", "faggot", "trannie"];
const modBadgeUrl = "https://pixelsafari.neocities.org/favicon/nature/star/star26.gif";
// STAFF_PASSWORD is hardcoded and cannot be changed through the UI
const STAFF_PASSWORD = "Sug•|!";

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

function isMod() {
  return sessionStorage.getItem("actout_is_mod") === "1";
}

// --- moderator login/logout ---
modLoginBtn?.addEventListener("click", () => {
  const pw = modPassword.value.trim();
  if (pw === STAFF_PASSWORD) {
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
  const mod = isMod();
  modLoginBtn.style.display = !mod ? "inline-block" : "none";
  modPassword.style.display = !mod ? "inline-block" : "none";
  modLogoutBtn.style.display = mod ? "inline-block" : "none";
  modStatus.textContent = mod ? "logged in as moderator" : "not logged in";
  modBadgeSlot.innerHTML = mod ? `<img src="${modBadgeUrl}" style="width:14px;height:14px;margin-left:4px;vertical-align:text-bottom;">` : "";
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

  const mod = isMod();

  actList.forEach((p, idx)=>{
    const div = document.createElement("div");
    div.className="post";
    const canDelete = mod || (username && username === p.username);
    const delButtonHtml = canDelete ? `<button data-idx="${idx}" class="danger">delete</button>` : "";
    const userBadgeHtml = mod ? `<img src="${modBadgeUrl}" style="width:14px;height:14px;margin-left:4px;vertical-align:text-bottom;">` : "";

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
(function init() {
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
