import React, { useState, useEffect } from "react";

// act out — old-school forum-style minimalist social site
export default function ActOut() {
  const [view, setView] = useState("index");
  const [currentAct, setCurrentAct] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [posts, setPosts] = useState(JSON.parse(localStorage.getItem("posts") || "{}"));

  useEffect(() => {
    localStorage.setItem("posts", JSON.stringify(posts));
  }, [posts]);

  const acts = [
    "working at mcdonald's",
    "space janitor",
    "retro barista",
    "arcade attendant",
    "library whisperer",
  ];

  function saveUsername(name) {
    setUsername(name);
    localStorage.setItem("username", name);
  }

  function openAct(act) {
    setCurrentAct(act);
    setView("act");
  }

  function goHome() {
    setView("index");
    setCurrentAct(null);
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4">
      <h1 className="text-lg mb-4 border-b border-white/20 pb-2">act out forum</h1>
      {!username ? (
        <div>
          <p>enter your username:</p>
          <input
            className="bg-black border border-white/30 text-white p-1 mt-2"
            value={username}
            onChange={(e) => saveUsername(e.target.value)}
            placeholder="your name"
          />
        </div>
      ) : view === "index" ? (
        <IndexView acts={acts} openAct={openAct} />
      ) : (
        <ActView act={currentAct} posts={posts} setPosts={setPosts} username={username} goHome={goHome} />
      )}
    </div>
  );
}

function IndexView({ acts, openAct }) {
  return (
    <div>
      <p className="opacity-80 mb-2">choose your act:</p>
      <ul className="space-y-2">
        {acts.map((a) => (
          <li key={a}>
            <button
              onClick={() => openAct(a)}
              className="underline text-white/80 hover:text-white text-left"
            >
              {a}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActView({ act, posts, setPosts, username, goHome }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

  const actPosts = posts[act] || [];

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target.result);
    reader.readAsDataURL(file);
  }

  function post() {
    if (!image) {
      alert("you must add an image!");
      return;
    }
    const newPost = {
      id: Date.now(),
      text,
      image,
      username,
      time: new Date().toLocaleString(),
    };
    const updated = { ...posts, [act]: [newPost, ...actPosts] };
    setPosts(updated);
    setText("");
    setImage(null);
  }

  return (
    <div>
      <button onClick={goHome} className="text-sm underline text-white/70 mb-4">← back</button>
      <h2 className="text-lg mb-2">act: {act}</h2>

      <div className="border border-white/30 p-3 mb-6">
        <textarea
          placeholder="optional text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-black border border-white/30 p-2 text-white mb-2 h-20"
        />
        {image && <img src={image} alt="preview" className="mb-2 border border-white/20" />}
        <div className="flex justify-between items-center">
          <input type="file" accept="image/*" onChange={handleImage} className="text-xs" />
          <button onClick={post} className="bg-white text-black px-2 py-1 text-sm font-bold">post</button>
        </div>
      </div>

      <div className="space-y-4">
        {actPosts.length === 0 && <p className="opacity-60">no posts yet in this act</p>}
        {actPosts.map((p) => (
          <div key={p.id} className="border border-white/30 p-3">
            <div className="text-xs opacity-70 mb-2">
              posted by {p.username} · {p.time}
            </div>
            {p.text && <p className="mb-2 text-sm whitespace-pre-wrap">{p.text}</p>}
            <img src={p.image} alt="post" className="border border-white/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
