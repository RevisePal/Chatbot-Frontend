import React from 'react';
import { useState, useEffect } from "react";
import "./App.css";
import send from "./assets/send.png";
import robot from "./assets/robot.png";
import loadingGif from "./assets/loading.gif";
import { url } from './utils/utils';


function App() {
  const [prompt, updatePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(undefined);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const question = urlParams.get('question');
    updatePrompt(question || ""); // Use empty string if question is null
  }, []);
  

  useEffect(() => {
    if (prompt != null && prompt.trim() === "") {
      setAnswer(undefined);
    }
  }, [prompt]);

  const sendPrompt = async (event) => {
    if (event.key !== "Enter") {
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
      setAnswer(message);
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
      <div className="same-width" style={{ backgroundColor: "white", display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          className="spotlight__input"
          placeholder="What do you want to know?"
          disabled={loading}
          value={prompt}

          onChange={(e) => updatePrompt(e.target.value)}
          onKeyDown={(e) => sendPrompt(e)}
        />
        <img
          className="enter"
          src={send}
          alt="search icon"
          onClick={handleIconClick}
          style={{ width: 20, height: 20, cursor: "pointer", marginRight: 15 }}
        />
      </div>
      <div className="same-width spotlight__answer" style={{
  backgroundImage: loading ? `url(${loadingGif})` : ``,
}}>
  {answer && <p>{answer}</p>}
</div>
      <h4 className="h3">*ChatGPT may produce inaccurate information about people, places, or facts.</h4>
      <img className='image' src={robot} alt="loading" />
    </div>
  );
}

export default App;
