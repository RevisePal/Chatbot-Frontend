// src/App.jsx
import React, { useState, useEffect } from "react";
import "./App.css";
import send from "./assets/send.png";
import robot from "./assets/robot.png";
import student from "./assets/student.jpg";
import loadingGif from "./assets/loading.gif";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";
import { MathJax, MathJaxContext } from "better-react-mathjax";

function App() {
  const [prompt, updatePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState(null); // show failures

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const question = urlParams.get("question");
    updatePrompt(question || "");
  }, []);

  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }, [conversation, loading]); // include loading so spinner stays in view

  const handleCopyClick = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 1000);
  };

  const cleanResponse = (text) =>
    (text || "")
      .replace(/^### /gm, "")
      .replace(/\*\*\*(.*?)\*\*\*/gm, "$1")
      .replace(/\*\*(.*?)\*\*\*/gm, "$1")
      .replace(/\*(.*?)\*/gm, "$1")
      .replace(/`(.*?)`/gm, "$1")
      .replace(/^- /gm, "\n• ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const stripHtmlTags = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const sendPrompt = async () => {
    const trimmed = (prompt ?? "").trim();
    if (loading || trimmed.length === 0) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const TIMEOUT_MS = 30000;
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const messages = [];
      for (const turn of conversation ?? []) {
        if (turn?.prompt) messages.push({ role: "user", content: String(turn.prompt) });
        if (turn?.response) messages.push({ role: "assistant", content: String(turn.response) });
      }
      messages.push({ role: "user", content: trimmed });

      // ✅ UPDATED URL HERE
      const res = await fetch("https://chatbot-backend-6fj3.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversations: messages }),
        signal: controller.signal,
        mode: "cors",
      });

      const raw = await res.text();

      if (!res.ok) {
        let serverMsg = res.statusText;
        try {
          const maybe = JSON.parse(raw);
          serverMsg = maybe?.error || maybe?.message || raw || res.statusText;
        } catch {
          serverMsg = raw || res.statusText;
        }
        throw new Error(`Request failed (${res.status}): ${serverMsg}`);
      }

      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        throw new Error("Invalid JSON response from server");
      }

      const message = payload?.message ?? "";
      if (!message) throw new Error("Empty response from server");

      setConversation((prev) => [...(prev || []), { prompt: trimmed, response: message }]);
      updatePrompt("");
      return message;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <MathJaxContext>
      <div className="flex flex-col items-center justify-start w-screen pt-10 text-center overflow-auto min-h-screen bg-gradient-to-b from-blue-700 to-blue-400">
        <h1 className="text-white w-full text-4xl font-sans">Welcome to TutorGPT</h1>
        <h2 className="text-white w-full text-base font-light font-sans">Powered by GPT-4o</h2>

        <div className="flex-grow w-10/12 flex flex-col items-center justify-end" style={{ paddingBottom: "6rem" }}>
          <div id="chat-container" className="w-full flex flex-col-reverse overflow-y-auto" style={{ maxHeight: "calc(100vh - 12rem)" }}>
            {/* Messages */}
            {conversation
              .slice()
              .reverse()
              .map((item, index) => (
                <div key={index}>
                  <div className="message user-message" style={{ marginBottom: "1rem", textAlign: "left" }}>
                    <div className="flex flex-row">
                      <img className="bot-avatar" src={student} alt="user avatar" />
                      <p className="text-gray-900 font-semibold">{stripHtmlTags(item.prompt)}</p>
                    </div>
                  </div>
                  <div className="message bot-message">
                    <div className="avatar-and-text">
                      <div className="mathjax-wrapper">
                        <MathJax className="mathjax-content">{cleanResponse(item.response)}</MathJax>
                      </div>
                    </div>
                    {item.response && (
                      <FontAwesomeIcon
                        className="hover:cursor-pointer p-2 hover:bg-gray-300"
                        icon={copied === index ? faCheck : faCopy}
                        onClick={() => handleCopyClick(item.response, index)}
                      />
                    )}
                  </div>
                </div>
              ))}

            {/* Global loading bubble so user sees activity even with empty history */}
            {loading && (
              <div className="message bot-message">
                <div className="avatar-and-text">
                  <img className="bot-avatar" src={robot} alt="bot avatar" />
                  <img style={{ height: "20px", marginLeft: "10px" }} src={loadingGif} alt="loading" />
                </div>
              </div>
            )}

            {/* Error banner (non-blocking) */}
            {error && (
              <div className="w-full my-2">
                <div className="mx-auto max-w-xl text-sm text-red-100 bg-red-600/80 rounded px-3 py-2">
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-5 right-5 p-4 bg-transparent mt-4">
          <div className="relative rounded-lg">
            <textarea
              className="flex-grow rounded-lg pl-2.5 pr-12 py-2 focus:outline-none text-base md:text-lg w-full min-h-15 resize-none mb-6"
              placeholder="Ask TutorGPT..."
              disabled={loading}
              value={stripHtmlTags(prompt)}
              onChange={(e) => updatePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt();
                }
              }}
              style={{ paddingRight: "2rem" }}
            />
            <img
              role="button"
              tabIndex={0}
              aria-label="Send prompt"
              className="absolute right-2 bottom-6 w-8 h-8 mb-6 cursor-pointer bg-transparent"
              src={send}
              alt="send icon"
              onClick={sendPrompt}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !loading) sendPrompt();
              }}
              style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? "none" : "auto" }}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2 mb-4 text-left italic">
          *TutorGPT can make mistakes. Please verify important information.
        </p>
      </div>
    </MathJaxContext>
  );
}

export default App;
