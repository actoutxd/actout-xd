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

let username = localStorage.getItem("username") || "";
let posts = JSON.parse(localStorage.getItem("posts") || "{}");
let currentAct = null;

// Banned words list
const bannedWords = ["retard", "retarded", "fuck", "shit", "nigger", "faggot", "trannie"]; // add slurs here

// Check text for banned words (ignores case & punctuation)
function containsBannedWords(text) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/gi, " ");
  return bannedWords.some(word => normalized.split(/\s+/).includes(word.toLowerCase()));
}

// Show views
function showIndex() {
  usernameContainer.style.display = username ? "none" : "block";
  indexView.style.display = username ? "block" : "none";
  actView.style.display = "none";
}

function showAct() {
  usernameContainer.style.display = "none";
  indexView.style.display = "none";
  actView.style.display = "block";
  actTitle.textContent = currentAct;
  renderPosts();
}

// Render posts for current act
function renderPosts() {
  actPosts.innerHTML = "";
  const actList = posts[currentAct] || [];
  if (actList.length === 0) {
    actPosts.innerHTML = "<p style='opacity:0.6'>no posts yet in this act</p>";
  } else {
    actList.forEach((p, idx) => {
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `
        <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">
          posted by ${p.username} · ${p.time} 
          <button data-idx="${idx}" style="font-size:10px; margin-left:8px; color:red; background:none; border:none; cursor:pointer;">delete</button>
        </div>
        ${p.text ? `<p style="margin-bottom:8px; font-size:14px; white-space:pre-wrap;">${p.text}</p>` : ""}
        <img src="${p.image}" alt="post">
      `;
      // Add delete handler
      div.querySelector("button").addEventListener("click", () => {
        if (confirm("Delete this post?")) {
          posts[currentAct].splice(idx, 1);
          localStorage.setItem("posts", JSON.stringify(posts));
          renderPosts();
        }
      });
      actPosts.appendChild(div);
    });
  }
}

// Initialize
if (username) showIndex();
else usernameContainer.style.display = "block";

// Username input
usernameInput.addEventListener("change", () => {
  username = usernameInput.value.trim();
  if (username) {
    localStorage.setItem("username", username);
    showIndex();
  }
});

// Act buttons
actsList.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    currentAct = btn.dataset.act;
    showAct();
  });
});

// Back button
backBtn.addEventListener("click", () => {
  currentAct = null;
  showIndex();
});

// Post button
postBtn.addEventListener("click", () => {
  const file = postImage.files[0];
  const textValue = postText.value.trim();

  if (!file) {
    alert("You must add an image!");
    return;
  }
  if (containsBannedWords(textValue)) {
    alert("Your post contains banned words and cannot be submitted.");
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
