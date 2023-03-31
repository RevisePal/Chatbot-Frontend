import React from 'react';
import { useState, useEffect } from "react";
import "./App.css";
import lens from "./assets/lens.png";
import robot from "./assets/robot.png";
import loadingGif from "./assets/loading.gif";
import { url } from './utils/utils';


function App() {
  const [prompt, updatePrompt] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(undefined);

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

  return (
    <div className="app">
      <h1 className="h1">Welcome to TutorGPT</h1>
      <h2 className="h2">Ask me anything!</h2>
      <input
          type="text"
          className="spotlight__input"
          placeholder="What do you want to know?"
          disabled={loading}
          style={{
          backgroundImage: loading ? `url(${loadingGif})` : `url(${lens})`,
          }}
          onChange={(e) => updatePrompt(e.target.value)}
          onKeyDown={(e) => sendPrompt(e)}
      />
          <h3 className="h3">Press enter to submit your question to our AI Tutor</h3>
        <div className="spotlight__answer">{answer && <p>{answer}</p>}</div>
        <img src={robot} alt="loading" />
      </div>
  );
}

export default App;
