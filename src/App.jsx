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
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const question = urlParams.get("question");
    updatePrompt(question || "");
  }, []);

  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }, [conversation, loading]);

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

      const res = await fetch(`${import.meta.env.VITE_API_URL}/ask`, {
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
      <div className="flex flex-col items-center justify-start w-full min-h-screen bg-gradient-to-b from-blue-700 to-blue-400 pt-6 sm:pt-10 overflow-hidden">
        <h1 className="text-white text-2xl sm:text-4xl font-sans text-center px-4">
          Welcome to TutorGPT
        </h1>
        <h2 className="text-white text-sm sm:text-base font-light font-sans mb-4">
          Powered by GPT-5.5
        </h2>

        <div className="flex-grow w-11/12 sm:w-9/12 flex flex-col items-center justify-end pb-28 sm:pb-24">
          <div
            id="chat-container"
            className="w-full flex flex-col-reverse overflow-y-auto px-2 sm:px-4"
            style={{ maxHeight: "calc(100vh - 12rem)" }}
          >
            {/* Messages */}
            {conversation
              .slice()
              .reverse()
              .map((item, index) => (
                <div key={index} className="flex flex-col mb-4">
                  <div className="self-end bg-white text-gray-900 max-w-[90%] sm:max-w-[80%] text-sm sm:text-base flex flex-col p-3 rounded-2xl mb-2">
                    <div className="flex items-start mb-1">
                      <img
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2"
                        src={student}
                        alt="user avatar"
                      />
                      <div className="break-words">{stripHtmlTags(item.prompt)}</div>
                    </div>
                  </div>

                  <div className="self-start bg-blue-100 text-gray-900 max-w-[90%] sm:max-w-[80%] text-sm sm:text-base flex flex-col p-3 rounded-2xl">
                    <div className="flex items-start mb-1">
                      <img
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2"
                        src={robot}
                        alt="bot avatar"
                      />
                      <div className="mathjax-wrapper break-words">
                        <MathJax className="mathjax-content">
                          {cleanResponse(item.response)}
                        </MathJax>
                      </div>
                    </div>
                    {item.response && (
                      <FontAwesomeIcon
                        className="hover:cursor-pointer p-1 self-end text-gray-500 hover:text-gray-700"
                        icon={copied === index ? faCheck : faCopy}
                        onClick={() => handleCopyClick(item.response, index)}
                      />
                    )}
                  </div>
                </div>
              ))}

            {/* Loading bubble */}
            {loading && (
              <div className="self-start bg-blue-100 rounded-2xl p-3 shadow max-w-[85%] flex items-center">
                <img
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2"
                  src={robot}
                  alt="bot avatar"
                />
                <img
                  className="h-4 sm:h-5"
                  src={loadingGif}
                  alt="loading"
                />
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="w-full my-2">
                <div className="mx-auto max-w-xl text-sm text-red-100 bg-red-600/80 rounded px-3 py-2">
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-blue-700/40 backdrop-blur-md">
          <div className="relative flex items-center">
            <textarea
              className="flex-grow rounded-lg pl-3 pr-12 py-2 focus:outline-none text-sm sm:text-base w-full resize-none bg-white"
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
            />
            <img
              role="button"
              tabIndex={0}
              aria-label="Send prompt"
              className="absolute right-3 bottom-2 w-7 h-7 sm:w-8 sm:h-8 cursor-pointer"
              src={send}
              alt="send icon"
              onClick={sendPrompt}
              style={{ opacity: loading ? 0.5 : 1 }}
            />
          </div>
        </div>

        <p className="text-xs text-gray-200 mt-2 mb-4 text-center italic px-3">
          *TutorGPT can make mistakes. Please verify important information.
        </p>
      </div>
    </MathJaxContext>
  );
}

export default App;
