import React from 'react';
import { useState, useEffect } from "react";
import "./App.css";
import send from "./assets/send.png";
import robot from "./assets/robot.png";
import loadingGif from "./assets/loading.gif";
import { url } from './utils/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';


function App() {
  const [prompt, updatePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null); // null indicates nothing is copied
  const [conversation, setConversation] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const question = urlParams.get('question');
    updatePrompt(question || ""); // Use empty string if question is null
  }, []);
  

  const handleCopyClick = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopied(index); // Pass the index of the copied message
    setTimeout(() => setCopied(null), 1000); // Reset the copied state after 1 second
  };
  

  // useEffect(() => {
  //   if (prompt != null && prompt.trim() === "") {
  //     setAnswer(undefined);
  //   }
  // }, [prompt]);

  const sendPrompt = async (event) => {
    if (event.key !== "Enter" || prompt.trim() === "") {
      return;
    }
  
    try {
      setLoading(true);

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      };

      const res = await fetch(`${url}/ask`, requestOptions);

      if (!res.ok) {
        throw new Error("Something went wrong");
      }

      const { message } = await res.json();
    setConversation([...conversation, { prompt, response: message }]);
    updatePrompt("");
  } catch (err) {
    console.error(err, "err");
  } finally {
    setLoading(false);
  }
};

  const handleIconClick = () => {
    if (!loading) {
      sendPrompt({ key: "Enter" });
    }
  };

  return (
    <div className="app">
      <h1 className="h1">Welcome to TutorGPT</h1>
      <h2 className="h2">Powered by GPT-3</h2>
      <div className="chat-window">
        <div className="conversation">
        {conversation.slice().reverse().map((item, index) => (
  <div key={index}>
    <div className="message user-message"><p>{item.prompt}</p></div>
    <div className="message bot-message">
      <div className='avatar-and-text'>
        <img className="bot-avatar" src={robot} alt="robot avatar" />
        <p>{index === 0 && loading ? <img style={{height: '20px', marginLeft: '10px'}} src={loadingGif} alt="loading" /> : item.response}</p>
      </div>
      {copied === index ? (
        <FontAwesomeIcon
          className="copy-icon"
          icon={faCheck} // Import and use the tick icon from FontAwesome
          onClick={() => handleCopyClick(item.response, index)}
        />
      ) : (
        <FontAwesomeIcon
          className="copy-icon"
          icon={faCopy}
          onClick={() => handleCopyClick(item.response, index)}
        />
      )}
    </div>
  </div>
))}

        </div>
        <div className="input-area">
          <div className="input-wrapper">
            <input
              type="text"
              className="input"
              placeholder="What do you want to know?"
              disabled={loading}
              value={prompt}
              onChange={(e) => updatePrompt(e.target.value)}
              onKeyDown={(e) => sendPrompt(e)}
            />
            <img
              className="send-icon"
              src={send}
              alt="send icon"
              onClick={handleIconClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
