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

function renderPosts() {
  actPosts.innerHTML = "";
  const actList = posts[currentAct] || [];
  if (actList.length === 0) {
    actPosts.innerHTML = "<p style='opacity:0.6'>no posts yet in this act</p>";
  } else {
    actList.forEach(p => {
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `
        <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">posted by ${p.username} · ${p.time}</div>
        ${p.text ? `<p style="margin-bottom:8px; font-size:14px; white-space:pre-wrap;">${p.text}</p>` : ""}
        <img src="${p.image}" alt="post">
      `;
      actPosts.appendChild(div);
    });
  }
}

// username
if (username) {
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

// acts click
actsList.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    currentAct = btn.dataset.act;
    showAct();
  });
});

// back button
backBtn.addEventListener("click", () => {
  currentAct = null;
  showIndex();
});

// post button
postBtn.addEventListener("click", () => {
  const file = postImage.files[0];
  if (!file) {
    alert("You must add an image!");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(ev) {
    const newPost = {
      username,
      text: postText.value,
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
