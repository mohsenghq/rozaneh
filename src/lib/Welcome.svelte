<script lang="ts">
  import { tick } from "svelte";
  import { app } from "./store.svelte";
  import { t } from "./i18n";
  import CityPicker from "./CityPicker.svelte";
  import { shortcuts } from "./shortcuts.svelte.js";
  import { hasTopSitesPermission, requestTopSitesPermission } from "./topSites";

  interface Props {
    ondone: () => void;
  }

  let { ondone }: Props = $props();

  let step = $state(0);
  let dialog = $state<HTMLDivElement | null>(null);
  let primary = $state<HTMLButtonElement | null>(null);
  let granted = $state(false);
  let permissionBusy = $state(false);
  let permissionError = $state(false);
  let permissionChecked = false;

  const steps = 3;

  $effect(() => {
    if (permissionChecked) return;
    permissionChecked = true;
    hasTopSitesPermission().then((value) => (granted = value));
  });

  $effect(() => {
    step;
    tick().then(() => {
      if (step === 2) {
        dialog?.querySelector<HTMLInputElement>("input")?.focus();
      } else {
        primary?.focus();
      }
    });
  });

  function next() {
    if (step < steps - 1) step += 1;
    else finish();
  }

  function back() {
    if (step > 0) step -= 1;
  }

  function finish() {
    ondone();
  }

  async function grantPermission() {
    permissionBusy = true;
    permissionError = false;
    const ok = await requestTopSitesPermission();
    granted = ok;
    permissionBusy = false;
    if (!ok) {
      permissionError = true;
      app.setAutoShortcutsEnabled(false);
      return;
    }
    app.setAutoShortcutsEnabled(true);
    await shortcuts.syncAuto(32);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      finish();
      return;
    }
    if (e.key !== "Tab" || !dialog) return;

    const focusable = [...dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
    )].filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
  <div class="absolute inset-0 animate-overlay bg-black/35 backdrop-blur-md"></div>

  <div
    bind:this={dialog}
    role="dialog"
    aria-modal="true"
    aria-label={t("welcome.greeting")}
    class="relative max-h-[92vh] w-full max-w-lg animate-pop overflow-y-auto rounded-3xl bg-surface p-7 shadow-2xl sm:p-9"
  >
    <button
      type="button"
      onclick={finish}
      class="absolute end-5 top-5 rounded-full px-3 py-1.5 text-xs text-muted transition hover:bg-surface-2 hover:text-text"
    >
      {t("welcome.skip")}
    </button>

    <div class="flex flex-col items-center text-center">
      <div class="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent text-surface shadow-lg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-7">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
        {t("app.name")}
      </p>

      {#key step}
        <div class="mt-3 w-full animate-pop">
          {#if step === 0}
            <h2 class="font-display text-2xl font-bold text-text sm:text-3xl">
              {t("welcome.greeting")}
            </h2>
            <p class="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
              {t("welcome.subtitle")}
            </p>

            <div class="relative mx-auto mt-7 flex h-36 w-full max-w-xs items-center justify-center">
              <div class="absolute inset-0 rounded-[32px] bg-surface-2"></div>
              <div class="relative flex items-end gap-4">
                <div class="flex size-24 items-center justify-center rounded-full bg-surface shadow-md">
                  <svg viewBox="0 0 100 100" class="size-20" aria-hidden="true">
                    <circle cx="50" cy="50" r="47" fill="var(--surface)" stroke="var(--border)" stroke-width="2" />
                    {#each Array.from({ length: 12 }, (_, i) => i + 1) as h (h)}
                      <line x1="50" y1="8" x2="50" y2="13" stroke="var(--muted)" stroke-width="2" transform={`rotate(${h * 30} 50 50)`} />
                    {/each}
                    <line x1="50" y1="53" x2="50" y2="30" stroke="var(--text)" stroke-width="4" stroke-linecap="round" />
                    <line x1="50" y1="54" x2="50" y2="19" stroke="var(--text)" stroke-width="2.5" stroke-linecap="round" />
                    <line x1="50" y1="56" x2="50" y2="14" stroke="#e5484d" stroke-width="1.2" stroke-linecap="round" />
                    <circle cx="50" cy="50" r="3" fill="var(--text)" />
                  </svg>
                </div>
                <div class="mb-1 flex w-20 flex-col gap-1.5 rounded-2xl bg-surface p-3 shadow-md">
                  <span class="h-2 w-8 rounded-full bg-muted/40"></span>
                  <div class="grid grid-cols-3 gap-1">
                    {#each Array.from({ length: 9 }, (_, i) => i) as i (i)}
                      <span class="size-2 rounded-sm {i === 4 ? 'bg-accent' : 'bg-surface-2'}"></span>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          {:else if step === 1}
            <h2 class="font-display text-2xl font-bold text-text sm:text-3xl">
              {t("welcome.featuresTitle")}
            </h2>
            <p class="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
              {t("welcome.featuresSubtitle")}
            </p>

            <div class="mt-6 grid grid-cols-2 gap-3 text-start">
              {#each [
                { title: t("welcome.featureClock"), icon: "clock" },
                { title: t("welcome.featureCalendar"), icon: "calendar" },
                { title: t("welcome.featureWeather"), icon: "cloud" },
                { title: t("welcome.featureShortcuts"), icon: "grid" },
              ] as feature (feature.icon)}
                <div class="rounded-2xl border border-border bg-surface-2/60 p-4">
                  <span class="flex size-9 items-center justify-center rounded-xl bg-surface text-muted shadow-sm">
                    {#if feature.icon === "clock"}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" stroke-linecap="round" /></svg>
                    {:else if feature.icon === "calendar"}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" stroke-linecap="round" /></svg>
                    {:else if feature.icon === "cloud"}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><path d="M7 18h9a4 4 0 0 0 .6-7.96A6 6 0 0 0 5.3 11.5 3.5 3.5 0 0 0 7 18Z" stroke-linejoin="round" /></svg>
                    {:else}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>
                    {/if}
                  </span>
                  <p class="mt-3 text-sm font-medium text-text">{feature.title}</p>
                </div>
              {/each}
            </div>
          {:else}
            <h2 class="font-display text-2xl font-bold text-text sm:text-3xl">
              {t("welcome.personalizeTitle")}
            </h2>
            <p class="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
              {t("welcome.personalizeSubtitle")}
            </p>

            <div class="mt-5 text-start">
              <CityPicker autofocus />
            </div>

            <div class="mt-5 rounded-2xl border border-border bg-surface-2/60 p-4 text-start">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-medium text-text">{t("welcome.autoTitle")}</p>
                  <p class="mt-1 text-xs leading-5 text-muted">{t("welcome.autoDesc")}</p>
                </div>
                {#if granted}
                  <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-surface">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="size-3.5"><path d="M5 12l4 4L19 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </span>
                {/if}
              </div>
              {#if !granted}
                <button
                  type="button"
                  onclick={() => void grantPermission()}
                  disabled={permissionBusy}
                  class="mt-3 rounded-xl bg-accent px-4 py-2 text-xs font-medium text-surface transition hover:opacity-90 disabled:opacity-50"
                >
                  {permissionBusy ? t("welcome.autoWorking") : t("welcome.autoGrant")}
                </button>
                {#if permissionError}
                  <p class="mt-2 text-xs leading-5 text-[var(--holiday)]">{t("welcome.autoDenied")}</p>
                {/if}
              {/if}
            </div>
          {/if}
        </div>
      {/key}
    </div>

    <div class="mt-7 flex items-center justify-between gap-3">
      <div class="flex items-center gap-1.5">
        {#each Array.from({ length: steps }, (_, i) => i) as i (i)}
          <span class="h-1.5 rounded-full transition-all {i === step ? 'w-5 bg-accent' : 'w-1.5 bg-border'}"></span>
        {/each}
      </div>

      <div class="flex items-center gap-2">
        {#if step > 0}
          <button
            type="button"
            onclick={back}
            class="rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-text"
          >
            {t("welcome.back")}
          </button>
        {/if}
        <button
          bind:this={primary}
          type="button"
          onclick={next}
          class="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-surface shadow-sm transition hover:opacity-90"
        >
          {step === steps - 1 ? t("welcome.start") : t("welcome.next")}
        </button>
      </div>
    </div>
  </div>
</div>
