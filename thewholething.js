function ActOut() {
  const { useState, useEffect } = React;

  const [view, setView] = useState("index");
  const [currentAct, setCurrentAct] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [posts, setPosts] = useState(JSON.parse(localStorage.getItem("posts") || "{}"));

  useEffect(() => {
    localStorage.setItem("posts", JSON.stringify(posts));
  }, [posts]);

  const acts = [
    "working at a fast food",
    "animation studio",
    "doing chores",
    "baking",
    "being a teacher",
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

  return React.createElement(
    "div",
    { style: { minHeight: "100vh", background: "black", color: "white", fontFamily: "monospace", padding: "16px" } },
    React.createElement("h1", { style: { fontSize: "20px", marginBottom: "12px", borderBottom: "1px solid #444", paddingBottom: "8px" } }, "act out forum"),
    !username
      ? React.createElement(
          "div",
          null,
          React.createElement("p", null, "enter your username:"),
          React.createElement("input", {
            style: { background: "black", border: "1px solid #555", color: "white", padding: "4px", marginTop: "8px" },
            value: username,
            onChange: (e) => saveUsername(e.target.value),
            placeholder: "your name",
          })
        )
      : view === "index"
      ? React.createElement(IndexView, { acts, openAct })
      : React.createElement(ActView, { act: currentAct, posts, setPosts, username, goHome })
  );
}

function IndexView({ acts, openAct }) {
  return React.createElement(
    "div",
    null,
    React.createElement("p", { style: { opacity: 0.8, marginBottom: "8px" } }, "choose your act:"),
    React.createElement(
      "ul",
      null,
      acts.map((a) =>
        React.createElement(
          "li",
          { key: a, style: { marginBottom: "6px" } },
          React.createElement(
            "button",
            {
              onClick: () => openAct(a),
              style: {
                textDecoration: "underline",
                color: "white",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              },
            },
            a
          )
        )
      )
    )
  );
}

function ActView({ act, posts, setPosts, username, goHome }) {
  const { useState } = React;
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

  return React.createElement(
    "div",
    null,
    React.createElement(
      "button",
      {
        onClick: goHome,
        style: { fontSize: "12px", textDecoration: "underline", color: "#aaa", marginBottom: "16px", background: "none", border: "none", cursor: "pointer" },
      },
      "← back"
    ),
    React.createElement("h2", { style: { fontSize: "18px", marginBottom: "8px" } }, "act: " + act),

    React.createElement(
      "div",
      { style: { border: "1px solid #444", padding: "12px", marginBottom: "24px" } },
      React.createElement("textarea", {
        placeholder: "optional text...",
        value: text,
        onChange: (e) => setText(e.target.value),
        style: { width: "100%", background: "black", border: "1px solid #444", color: "white", padding: "8px", marginBottom: "8px", height: "80px" },
      }),
      image && React.createElement("img", { src: image, alt: "preview", style: { border: "1px solid #333", marginBottom: "8px", maxWidth: "100%" } }),
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        React.createElement("input", { type: "file", accept: "image/*", onChange: handleImage, style: { fontSize: "10px" } }),
        React.createElement(
          "button",
          { onClick: post, style: { background: "white", color: "black", padding: "4px 8px", fontSize: "12px", fontWeight: "bold" } },
          "post"
        )
      )
    ),

    actPosts.length === 0
      ? React.createElement("p", { style: { opacity: 0.6 } }, "no posts yet in this act")
      : actPosts.map((p) =>
          React.createElement(
            "div",
            { key: p.id, style: { border: "1px solid #444", padding: "12px", marginBottom: "12px" } },
            React.createElement("div", { style: { fontSize: "12px", opacity: 0.7, marginBottom: "8px" } }, `posted by ${p.username} · ${p.time}`),
            p.text && React.createElement("p", { style: { marginBottom: "8px", fontSize: "14px", whiteSpace: "pre-wrap" } }, p.text),
            React.createElement("img", { src: p.image, alt: "post", style: { border: "1px solid #333", maxWidth: "100%" } })
          )
        )
  );
}
