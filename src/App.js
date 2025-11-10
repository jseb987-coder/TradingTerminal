

import React, { useState } from "react";
import AutoTrader from "./AutoTrader";
import "./App.css";

function App() {

  // const [authCode, setAuthCode] = useState("");
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

   const [authCode, setAuthCode] = useState("eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIzQUE1SlAiLCJqdGkiOiI2OTExZTBlMmVhOTljNDY0YzUzNjRhMjMiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYyNzc5MzYyLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjI4MTIwMDB9.9ZikMBfsZjJspqEHMQzqEd62KaZkLgVMi9L3ZuYUwVY");
   const [isAuthenticated, setIsAuthenticated] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authCode.trim() !== "") {
      setIsAuthenticated(true);
      console.log("Authenticated successfully");
    }
  };

  if (!isAuthenticated) {

    return (
      <div className="auth-container">
        <h2 className="auth-title">Enter Authentication Code</h2>
        <form className="auth-form" onSubmit={handleSubmit} autoComplete="on">
          <input
            type="text"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            placeholder="Authentication Code"
            required
            autoComplete="on"
            className="auth-input"
          />
          <button type="submit" className="auth-button">Submit</button>
        </form>
      </div>
    );
  }

  return <AutoTrader token={authCode} />;
}

export default App;
