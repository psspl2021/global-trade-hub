import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("main.tsx: Starting application initialization");

// Global error handlers for debugging
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
  } catch (error) {
    console.error("main.tsx: Failed to render App:", error);
    rootElement.innerHTML = '<div style="padding: 20px; color: red;">Failed to load application. Check console for details.</div>';
  }
} else {
  console.error("main.tsx: Root element not found!");
}
