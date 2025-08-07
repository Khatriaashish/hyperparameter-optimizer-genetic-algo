// src/index.js
import React from "react";
import ReactDOM from "react-dom/client"; // Updated import
import App from "./App"; // Ensure App.js exists
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")); // Create a root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
