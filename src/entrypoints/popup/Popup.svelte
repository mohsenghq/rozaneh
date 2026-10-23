<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "wxt/browser";
  import { app } from "../../lib/store.svelte";
  import { shortcuts } from "../../lib/shortcuts.svelte.js";
  import { t } from "../../lib/i18n";
  import Toggle from "../../lib/Toggle.svelte";
  import {
    hasTopSitesPermission,
    removeTopSitesPermission,
    requestTopSitesPermission,
  } from "../../lib/topSites";

  let granted = $state(false);
  let permissionBusy = $state(false);
  let permissionError = $state(false);

  const version = browser.runtime.getManifest().version ?? "1.0.0";

  onMount(() => {
    hasTopSitesPermission().then((value) => (granted = value));
  });

  function setTheme(mode: typeof app.themeMode) {
    app.setThemeMode(mode);
    app.applyTheme();
  }

  async function openNewTab(query = "") {
    const url = `${browser.runtime.getURL("/newtab.html")}${query}`;
    await browser.tabs.create({ url });
    window.close();
  }

  async function toggleAuto(value: boolean) {
    permissionError = false;
    if (!value) {
      app.setAutoShortcutsEnabled(false);
      await removeTopSitesPermission();
      granted = false;
      return;
    }

    permissionBusy = true;
    const ok = granted || (await requestTopSitesPermission());
    permissionBusy = false;
    granted = ok;

    if (!ok) {
      permissionError = true;
      app.setAutoShortcutsEnabled(false);
      return;
    }

    app.setAutoShortcutsEnabled(true);
    await shortcuts.syncAuto(30);
  }
</script>

<div class="flex w-[340px] flex-col bg-bg text-text">
  <header class="flex items-center justify-between border-b border-border px-4 py-3">
    <div class="flex items-center gap-2.5">
      <span class="flex size-9 items-center justify-center rounded-xl bg-accent text-surface shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <div>
        <p class="font-display text-sm font-bold leading-5">{t("app.name")}</p>
        <p class="text-[10px] leading-3 text-muted">{t("popup.tagline")}</p>
      </div>
    </div>
    <span class="rounded-full bg-surface-2 px-2 py-1 text-[10px] text-muted" dir="ltr">
      v{version}
    </span>
  </header>

  <main class="flex flex-col gap-3 p-4">
    <section
      class="flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition
        {app.enabled ? 'border-accent/35 bg-accent/5' : 'border-border bg-surface-2/40'}"
    >
      <div class="flex items-center gap-2.5">
        <span
          class="flex size-9 items-center justify-center rounded-xl transition
            {app.enabled ? 'bg-accent text-surface' : 'bg-surface-2 text-muted'}"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" class="size-5">
            <path d="M12 3v9" stroke-linecap="round" />
            <path d="M6.3 6.3a8 8 0 1 0 11.4 0" stroke-linecap="round" />
          </svg>
        </span>
        <div>
          <p class="text-sm font-semibold">
            {app.enabled ? t("popup.active") : t("popup.inactive")}
          </p>
          <p class="mt-0.5 text-[10px] leading-4 text-muted">
            {app.enabled ? t("popup.activeHint") : t("popup.inactiveHint")}
          </p>
        </div>
      </div>
      <Toggle
        label={t("popup.active")}
        checked={app.enabled}
        onchange={(value) => app.setEnabled(value)}
      />
    </section>

    <section class="rounded-2xl border border-border p-3">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-medium">{t("popup.theme")}</p>
        <span class="text-[10px] text-muted">{t("popup.themeHint")}</span>
      </div>
      <div class="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
        {#each [
          { value: "auto", label: t("theme.auto") },
          { value: "light", label: t("theme.light") },
          { value: "dark", label: t("theme.dark") },
        ] as option (option.value)}
          <button
            type="button"
            onclick={() => setTheme(option.value as typeof app.themeMode)}
            class="rounded-lg px-2 py-1.5 text-[11px] transition
              {app.themeMode === option.value
              ? 'bg-surface font-medium text-text shadow-sm'
              : 'text-muted hover:text-text'}"
          >
            {option.label}
          </button>
        {/each}
      </div>
    </section>

    <section class="rounded-2xl border border-border p-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-medium">{t("popup.auto")}</p>
          <p class="mt-0.5 text-[10px] leading-4 text-muted">{t("popup.autoHint")}</p>
        </div>
        <Toggle
          label={t("popup.auto")}
          checked={app.autoShortcutsEnabled && granted}
          disabled={permissionBusy}
          onchange={(value) => void toggleAuto(value)}
        />
      </div>

      {#if !granted}
        <button
          type="button"
          disabled={permissionBusy}
          onclick={() => void toggleAuto(true)}
          class="mt-2 text-[10px] font-medium text-muted underline underline-offset-2 transition hover:text-text disabled:opacity-50"
        >
          {permissionBusy ? t("popup.permissionBusy") : t("popup.permissionGrant")}
        </button>
      {/if}

      {#if permissionError}
        <p class="mt-1.5 text-[10px] leading-4 text-[var(--holiday)]">{t("popup.permissionDenied")}</p>
      {/if}
    </section>

    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        onclick={() => void openNewTab("?settings=1")}
        class="flex items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-2 text-[11px] text-text transition hover:bg-surface-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-3.5">
          <path d="M4 8h9M17 8h3M4 16h3M11 16h9" stroke-linecap="round" />
          <circle cx="15" cy="8" r="2.2" />
          <circle cx="9" cy="16" r="2.2" />
        </svg>
        {t("popup.settings")}
      </button>
      <button
        type="button"
        onclick={() => void openNewTab("?welcome=1")}
        class="flex items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-2 text-[11px] text-text transition hover:bg-surface-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-3.5">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 11v5M12 8h.01" stroke-linecap="round" />
        </svg>
        {t("popup.guide")}
      </button>
    </div>
  </main>

  <footer class="flex items-center gap-1.5 border-t border-border px-4 py-2.5 text-[10px] text-muted">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-3.5 shrink-0">
      <path d="M12 3l7 3v5c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6l7-3Z" stroke-linejoin="round" />
      <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    {t("popup.privacy")}
  </footer>
</div>
