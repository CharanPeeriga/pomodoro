import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/roboto-flex/full.css";
import App from "./App";
import { applyTheme } from "./theme/scheme";

applyTheme();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
