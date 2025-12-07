// BOOTSTRAP: First line of JavaScript execution
console.log("BOOTSTRAP: Script starting at", new Date().toISOString());

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

console.log("BOOTSTRAP: React imports loaded");

// Check environment variables before anything else
console.log("ENV CHECK:", {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? "SET" : "MISSING",
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "SET" : "MISSING",
});

// Import CSS
import "./index.css";
console.log("BOOTSTRAP: CSS loaded");

// Global error handlers - set up before App import
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  const errorDisplay = document.getElementById("error-display");
  if (errorDisplay) {
    errorDisplay.innerHTML = `<pre style="color: red; padding: 20px;">Error: ${event.error?.message || event.message}</pre>`;
    errorDisplay.style.display = "block";
  }
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

console.log("BOOTSTRAP: Error handlers set up");

// Import App component - this is where most issues occur
let App: React.ComponentType;
try {
  console.log("BOOTSTRAP: Starting App import...");
  const AppModule = await import("./App.tsx");
  App = AppModule.default;
  console.log("BOOTSTRAP: App imported successfully");
} catch (error) {
  console.error("BOOTSTRAP: Failed to import App:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
    <h1>Failed to load application</h1>
    <pre>${error instanceof Error ? error.message : String(error)}</pre>
    <pre>${error instanceof Error ? error.stack : ""}</pre>
  </div>`;
  throw error;
}

const rootElement = document.getElementById("root");
console.log("BOOTSTRAP: Root element found:", !!rootElement);

if (rootElement) {
  try {
    console.log("BOOTSTRAP: Creating React root...");
    const root = createRoot(rootElement);
    console.log("BOOTSTRAP: Rendering App...");
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log("BOOTSTRAP: Render called successfully");
  } catch (error) {
    console.error("BOOTSTRAP: Failed to render App:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
      <h1>Failed to render application</h1>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
      <pre>${error instanceof Error ? error.stack : ""}</pre>
    </div>`;
  }
} else {
  console.error("BOOTSTRAP: Root element not found!");
  document.body.innerHTML = '<h1 style="color: red; padding: 20px;">Root element not found</h1>';
}
