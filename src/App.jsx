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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const question = urlParams.get("question");
    updatePrompt(question || "");
  }, []);

  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [conversation]);

  const handleCopyClick = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 1000);
  };
  const cleanResponse = (text) => {
    return text
      .replace(/^### /gm, "") // Remove leading ###
      .replace(/\*\*\*(.*?)\*\*\*/gm, "$1") // Remove ***bold italic***
      .replace(/\*\*(.*?)\*\*/gm, "$1") // Remove **bold**
      .replace(/\*(.*?)\*/gm, "$1") // Remove *italic*
      .replace(/`(.*?)`/gm, "$1") // Remove inline code blocks
      .replace(/^- /gm, "\n• ") // Ensure bullet points start on a new line
      .replace(/\n{3,}/g, "\n\n") // Prevent excessive empty lines
      .trim();
  };

  const stripHtmlTags = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const sendPrompt = async () => {
    if (loading || prompt.trim() === "") return;

    setLoading(true);
    try {
      const conversations = conversation
        .map((conv) => ({
          role: "user",
          content: conv.prompt,
        }))
        .concat({
          role: "user",
          content: prompt,
        });

      const res = await fetch("https://ai-bot-backend.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversations }),
      });

      if (!res.ok) throw new Error("Something went wrong");

      const { message } = await res.json();
      setConversation([...conversation, { prompt, response: message }]);
      updatePrompt("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MathJaxContext>
      <div className="flex flex-col items-center justify-start w-screen pt-10 text-center overflow-auto min-h-screen bg-gradient-to-b from-blue-700 to-blue-400">
        <h1 className="text-white w-full text-4xl font-sans">
          Welcome to TutorGPT
        </h1>
        <h2 className="text-white w-full text-base font-light font-sans">
          Powered by GPT-4o
        </h2>
        <div
          className="flex-grow w-10/12 flex flex-col items-center justify-end"
          style={{ paddingBottom: "6rem" }}
        >
          <div
            id="chat-container"
            className="w-full flex flex-col-reverse overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 12rem)" }}
          >
            {conversation
              .slice()
              .reverse()
              .map((item, index) => (
                <div key={index}>
                  <div
                    className="message user-message"
                    style={{ marginBottom: "1rem", textAlign: "left" }}
                  >
                    <div className="flex flex-row">
                      <img
                        className="bot-avatar"
                        src={student}
                        alt="user avatar"
                      />
                      <p className="text-gray-900 font-semibold">
                        {stripHtmlTags(item.prompt)}
                      </p>
                    </div>
                  </div>
                  <div className="message bot-message">
                    <div className="avatar-and-text">
                      {index === 0 && loading ? (
                        <img
                          style={{ height: "20px", marginLeft: "10px" }}
                          src={loadingGif}
                          alt="loading"
                        />
                      ) : (
                        <div className="mathjax-wrapper">
                          <MathJax className="mathjax-content">
                            {cleanResponse(item.response)}
                          </MathJax>
                        </div>
                      )}
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
                if (e.key === "Enter") sendPrompt();
              }}
              style={{ paddingRight: "2rem" }}
            />
            <img
              className="absolute right-2 bottom-6 w-8 h-8 mb-6 cursor-pointer bg-transparent"
              src={send}
              alt="send icon"
              onClick={sendPrompt}
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
