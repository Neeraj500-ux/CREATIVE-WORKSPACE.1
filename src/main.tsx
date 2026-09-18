import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { ToastProvider } from "./components/ui";
import { AuthProvider } from "./services/auth";
import { WorkspaceProvider } from "./services/workspace";

import "./style.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <WorkspaceProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </WorkspaceProvider>
    </AuthProvider>
  </StrictMode>,
);