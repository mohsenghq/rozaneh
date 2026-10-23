import { mount } from "svelte";
import { app } from "../../lib/store.svelte";
import { shortcuts } from "../../lib/shortcuts.svelte.js";
import Popup from "./Popup.svelte";
import "../../assets/app.css";
import "./popup.css";

async function start() {
  await Promise.all([app.init(), shortcuts.init()]);
  mount(Popup, { target: document.getElementById("app")! });
}

start();
