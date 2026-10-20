import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./i18n";
import "./styles.css";
import "./scene.css";
import "./curriculum.css";
import "./hydrogen-entrance.css";
import "./keycaps.css";
import "./dark-theme.css";
import "./knowledge-map.css";
import "./reading-reveal.css";
import "./home-explorations.css";
import "./reaction-notation.css";
import "./feedback.css";
import "./language.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
