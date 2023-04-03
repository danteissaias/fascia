import "@danteissaias/ds/index.css";
import "./app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import type { Config } from "../config";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("No root element found");

async function getConfig(): Promise<Config> {
  const configPath = new URL("./config.js", location.href);
  return import(/* @vite-ignore */ configPath.href).then((mod) => mod.default);
}

const config = await getConfig();

createRoot(root).render(
  <StrictMode>
    <App config={config} rpcPath="/rpc" />
  </StrictMode>
);
