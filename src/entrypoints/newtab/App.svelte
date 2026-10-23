<script lang="ts">
  import { untrack, onMount } from "svelte";
  import { app } from "../../lib/store.svelte";
  import type { WidgetId } from "../../lib/settings";
  import Background from "../../lib/Background.svelte";
  import TopBar from "../../lib/TopBar.svelte";
  import ShortcutsCard from "../../lib/ShortcutsCard.svelte";
  import Clock from "../../lib/Clock.svelte";
  import Calendar from "../../lib/Calendar.svelte";
  import Weather from "../../lib/Weather.svelte";
  import OccasionsStrip from "../../lib/OccasionsStrip.svelte";
  import WidgetGrid from "../../lib/WidgetGrid.svelte";
  import Settings from "../../lib/Settings.svelte";
  import Welcome from "../../lib/Welcome.svelte";
  import { setOnboarded } from "../../lib/onboarding";
  import { t } from "../../lib/i18n";

  interface Props {
    onboarded?: boolean;
  }

  let { onboarded = false }: Props = $props();

  let settingsOpen = $state(false);
  let seen = $state(untrack(() => onboarded));
  const welcomeOpen = $derived(app.welcomeOpen || !seen);

  async function finishWelcome() {
    seen = true;
    app.closeWelcome();
    await setOnboarded(true);
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const wantsSettings = params.has("settings");
    const wantsWelcome = params.has("welcome");
    if (!wantsSettings && !wantsWelcome) return;
    history.replaceState(null, "", window.location.pathname);
    if (wantsSettings) settingsOpen = true;
    if (wantsWelcome) app.openWelcome();
  });

  $effect(() => {
    app.applyTheme();
  });
</script>

{#snippet widget(id: WidgetId, flow: boolean)}
  {#if id === "shortcuts"}
    <ShortcutsCard {flow} />
  {:else if id === "calendar"}
    <Calendar />
  {:else if id === "weather"}
    <div class="flex h-full rounded-[28px] bg-surface p-4 shadow-[0_10px_40px_var(--shadow)]">
      <Weather />
    </div>
  {:else if id === "clock"}
    <div class="flex h-full items-center justify-center">
      <Clock />
    </div>
  {:else if id === "occasions"}
    <OccasionsStrip class="h-full overflow-y-auto" />
  {/if}
{/snippet}

{#if app.enabled}
  <Background />

  <div class="flex h-dvh flex-col overflow-hidden">
    <TopBar onsettings={() => (settingsOpen = true)} />

    <main
      class="animate-rise mx-auto flex w-full max-w-5xl flex-1 min-h-0 flex-col px-4 pb-4 sm:px-6
        {app.widgetAlign === 'center' ? 'justify-center pt-4' : 'pt-[3vh]'}"
    >
      <WidgetGrid {widget} />
    </main>
  </div>

  {#if settingsOpen}
    <Settings onclose={() => (settingsOpen = false)} />
  {/if}

  {#if welcomeOpen}
    <Welcome ondone={finishWelcome} />
  {/if}
{:else}
  <div class="flex h-dvh items-center justify-center bg-bg px-6">
    <div class="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 text-center shadow-[0_20px_60px_var(--shadow)]">
      <span class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-surface">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-7">
          <path d="M12 3v9" stroke-linecap="round" />
          <path d="M6.3 6.3a8 8 0 1 0 11.4 0" stroke-linecap="round" />
        </svg>
      </span>
      <h1 class="mt-5 font-display text-xl font-bold text-text">{t("disabled.title")}</h1>
      <p class="mt-2 text-sm leading-6 text-muted">{t("disabled.body")}</p>
      <button
        type="button"
        onclick={() => app.setEnabled(true)}
        class="mt-6 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-surface transition hover:opacity-90"
      >
        {t("disabled.enable")}
      </button>
    </div>
  </div>
{/if}
