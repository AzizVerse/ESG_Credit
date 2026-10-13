import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ScoringActionsProvider } from "./context/ScoringActionsContext";
import "./styles.css";
import "./theme.css";
import "./enhancements.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ScoringActionsProvider><App /></ScoringActionsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
