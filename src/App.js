

import React, { useState } from "react";
import AutoTrader from "./AutoTrader";
import "./App.css";

function App() {

  const [authCode, setAuthCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authCode.trim() !== "") {
      setIsAuthenticated(true);
      console.log("Ann mary is an oola")
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
