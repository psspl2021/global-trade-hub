import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("BOOTSTRAP: Script starting");

// Global error handlers
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log("BOOTSTRAP: App rendered");
  } catch (error) {
    console.error("BOOTSTRAP: Failed to render:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Failed to load application. Check console.</div>`;
  }
} else {
  console.error("BOOTSTRAP: Root element not found");
}
