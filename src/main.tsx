import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  // Hide loading indicator
  const loadingEl = document.getElementById("app-loading");
  if (loadingEl) loadingEl.style.display = "none";
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
