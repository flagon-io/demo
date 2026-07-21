import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OpenFeatureProvider } from "@openfeature/react-sdk";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><OpenFeatureProvider><App /></OpenFeatureProvider></StrictMode>,
);
