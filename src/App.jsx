import React from 'react';
import { useState, useEffect } from "react";
import "./App.css";
import lens from "./assets/lens.png";
import send from "./assets/send.png";
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
  const handleIconClick = () => {
    if (!loading) {
      sendPrompt({ key: "Enter" });
    }
  };

  return (
    <div className="app">
      <h1 className="h1">Welcome to TutorGPT</h1>
        <h2 className="h2">Powered by GPT-3</h2>
      <div style={{backgroundColor: "white", display:'flex', flexDirection: 'row', justifyContent: 'space-between' , alignItems: 'center', width: '90%', borderRadius: '5px'}}>
      <input
          type="text"
          className="spotlight__input"
          placeholder="What do you want to know?"
          disabled={loading}
          
          onChange={(e) => updatePrompt(e.target.value)}
          onKeyDown={(e) => sendPrompt(e)}
      />
      <img
          className="enter"
          src={send}
          alt="search icon"
          onClick={handleIconClick}
          style={{width: 20, height: 20, cursor: "pointer", marginRight: 15}}
        />
        </div>
        <div style={{
          backgroundImage: loading ? `url(${loadingGif})` : ``,
          }} className="spotlight__answer">{answer && <p>{answer}</p>}</div>
        <h4 className="h3">The first response may take up to 10 seconds to load, but after that it will be instant!</h4>
        <img className='image' src={robot} alt="loading" />
      </div>
  );
}

export default App;
