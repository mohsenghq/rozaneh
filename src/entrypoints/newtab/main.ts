import { mount } from "svelte";
import App from "./App.svelte";
import { app } from "../../lib/store.svelte";
import { shortcuts } from "../../lib/shortcuts.svelte.js";
import { weather } from "../../lib/weather.svelte.js";
import { prices } from "../../lib/prices.svelte";
import { initFaviconCache } from "../../lib/faviconCache";
import { hasOnboarded } from "../../lib/onboarding";
import "../../assets/app.css";

async function start() {
  await Promise.all([
    app.init(),
    shortcuts.init(),
    weather.init(),
    prices.init(),
    initFaviconCache(),
  ]);
  const onboarded = await hasOnboarded().catch(() => false);
  mount(App, {
    target: document.getElementById("app")!,
    props: { onboarded },
  });
  document.documentElement.classList.add("loaded");
  document.body.classList.add("loaded");
}

start();
