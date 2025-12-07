// Force rebuild: 2025-12-07T12:00:00Z - v3
console.log("[MAIN] Module loading started", Date.now());

// Immediate DOM feedback before React loads
try {
  const loadingEl = document.getElementById("root-loading");
  if (loadingEl) {
    loadingEl.querySelector("p")!.textContent = "Initializing React...";
  }
  console.log("[MAIN] Updated loading text");
} catch (e) {
  console.error("[MAIN] Error updating loading:", e);
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("[MAIN] All imports loaded successfully");

// Global error handlers
window.addEventListener("error", (event) => {
  console.error("[MAIN] Window error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[MAIN] Unhandled rejection:", event.reason);
});

const rootElement = document.getElementById("root");
console.log("[MAIN] Root element found:", !!rootElement);

if (rootElement) {
  try {
    console.log("[MAIN] Creating React root...");
    const root = createRoot(rootElement);
    
    console.log("[MAIN] Rendering App component...");
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    console.log("[MAIN] Render called successfully");
  } catch (error) {
    console.error("[MAIN] Failed to render:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">
      <h1>Failed to load application</h1>
      <pre>${error}</pre>
    </div>`;
  }
} else {
  console.error("[MAIN] Root element not found!");
}
