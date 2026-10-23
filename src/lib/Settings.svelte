<script lang="ts">
  import { app } from "./store.svelte";
  import type { Background } from "./settings";
  import CityPicker from "./CityPicker.svelte";
  import ClockFace from "./ClockFace.svelte";
  import Toggle from "./Toggle.svelte";
  import { exportConfig, importConfig } from "./config";
  import { solidColors, type WallpaperCategory } from "../data/wallpapers";
  import { getBingCategory } from "../data/bingWallpapers";
  import { t } from "./i18n";
  import { maybeRotateBackground } from "./wallpaperRotation";
  import {
    hasTopSitesPermission,
    removeTopSitesPermission,
    requestTopSitesPermission,
  } from "./topSites";
  import { shortcuts } from "./shortcuts.svelte.js";
  import { modalFocus } from "./modalFocus";
  import { portal } from "./portal";

  let { onclose }: { onclose: () => void } = $props();

  let permissionGranted = $state(false);
  let permissionChecked = false;
  let permissionError = $state(false);

  $effect(() => {
    if (permissionChecked) return;
    permissionChecked = true;
    hasTopSitesPermission().then((granted) => {
      permissionGranted = granted;
    });
  });

  async function toggleAutoShortcuts(enabled: boolean) {
    permissionError = false;
    if (!enabled) {
      app.setAutoShortcutsEnabled(false);
      await removeTopSitesPermission();
      permissionGranted = false;
      return;
    }

    const granted = await requestTopSitesPermission();
    permissionGranted = granted;
    if (!granted) {
      permissionError = true;
      app.setAutoShortcutsEnabled(false);
      return;
    }
    app.setAutoShortcutsEnabled(true);
    await shortcuts.syncAuto(32);
  }

  async function resetAutoShortcuts() {
    shortcuts.resetDismissed();
    if (app.autoShortcutsEnabled) await shortcuts.syncAuto(32);
  }

  let categories = $state<WallpaperCategory[]>([]);

  $effect(() => {
    getBingCategory().then((cat) => {
      if (cat.items.length > 0) categories = [cat];
    });
  });

  type TabId = "general" | "theme" | "background" | "clock" | "weather" | "calendar";

  const nav = $derived([
    {
      section: t("settings.sectionGeneral"),
      items: [
        { id: "general" as TabId, label: t("settings.sectionGeneral") },
        { id: "theme" as TabId, label: t("settings.tabTheme") },
        { id: "background" as TabId, label: t("settings.tabBackground") },
      ],
    },
    {
      section: t("settings.sectionTools"),
      items: [
        { id: "clock" as TabId, label: t("settings.tabClock") },
        { id: "weather" as TabId, label: t("settings.tabWeather") },
        { id: "calendar" as TabId, label: t("settings.tabCalendar") },
      ],
    },
  ]);

  let tab = $state<TabId>("general");
  let importMsg = $state("");
  let fileInput = $state<HTMLInputElement | null>(null);

  function updateBg(patch: Partial<Background>) {
    app.setBackground({ ...app.background, ...patch });
  }

  function onCustomFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      updateBg({ type: "image", value: reader.result as string, randomCategory: null, randomDate: null });
    reader.readAsDataURL(file);
  }

  async function pickRandomForCategory(key: string) {
    const pending = { ...app.background, randomCategory: key, randomDate: null };
    const rotated = await maybeRotateBackground(pending);
    app.setBackground(rotated);
  }

  async function onImportFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    importMsg = (await importConfig(file)) ? t("about.importSuccess") : t("about.importError");
  }
</script>

<div data-modal-root class="fixed inset-0 z-50 flex items-center justify-center p-4" use:portal>
  <button tabindex="-1" aria-hidden="true" class="absolute inset-0 animate-overlay cursor-default bg-black/40 backdrop-blur-md" onclick={onclose}></button>

  <div
    role="dialog"
    aria-modal="true"
    aria-label={t("settings.title")}
    use:modalFocus={{ onEscape: onclose }}
    class="relative flex h-[85vh] max-h-[760px] w-full max-w-4xl animate-pop flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl outline-none"
  >
    <header class="flex items-center justify-between border-b border-border p-5">
      <h2 class="font-display text-xl font-bold text-text">{t("settings.title")}</h2>
      <button
        class="flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2"
        aria-label={t("common.close")}
        onclick={onclose}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
        </svg>
      </button>
    </header>

    <div class="flex min-h-0 flex-1">
      <nav class="w-48 shrink-0 space-y-4 overflow-y-auto p-3 sm:w-56">
        {#each nav as group (group.section)}
          <div>
            <p class="px-3 pb-1 text-xs text-muted">{group.section}</p>
            {#each group.items as item (item.id)}
              <button
                type="button"
                onclick={() => (tab = item.id)}
                class="w-full rounded-xl px-3 py-2 text-start text-sm transition
                  {tab === item.id ? 'bg-text font-semibold text-surface' : 'text-text hover:bg-surface-2'}"
              >
                {item.label}
              </button>
            {/each}
          </div>
        {/each}
      </nav>

      <div class="min-w-0 flex-1 overflow-y-auto border-s border-border p-6">
        {#if tab === "general"}
          <h3 class="mb-4 font-display text-lg font-bold text-text">{t("settings.sectionGeneral")}</h3>

          <p class="mb-2 text-sm font-medium text-muted">{t("city.selectLabel")}</p>
          <CityPicker />

          <p class="mt-6 mb-2 text-sm font-medium text-muted">{t("settings.widgetLayoutLabel")}</p>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              onclick={() => app.setLayoutType("balanced")}
              class="rounded-2xl border-2 p-3 text-center text-sm font-medium transition
                {app.layoutType === 'balanced' ? 'border-accent text-text' : 'border-border text-muted hover:bg-surface-2'}"
            >
              {t("settings.layoutBalanced")}
            </button>
            <button
              type="button"
              disabled
              class="rounded-2xl border-2 border-border p-3 text-center text-sm font-medium text-muted opacity-50 cursor-not-allowed"
            >
              {t("settings.layoutMinimalSoon")}
            </button>
          </div>

          <div class="mt-6 rounded-2xl border border-border p-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-text">{t("settings.autoShortcutsLabel")}</p>
                <p class="mt-0.5 text-xs leading-5 text-muted">{t("settings.autoShortcutsDesc")}</p>
              </div>
              <Toggle
                label={t("settings.autoShortcutsLabel")}
                checked={app.autoShortcutsEnabled && permissionGranted}
                onchange={(v) => void toggleAutoShortcuts(v)}
              />
            </div>
            <p class="mt-3 text-xs leading-5 text-muted">{t("settings.autoShortcutsPrivacy")}</p>
            {#if permissionError}
              <p class="mt-2 text-xs leading-5 text-[var(--holiday)]">
                {t("settings.autoShortcutsDenied")}
              </p>
            {/if}
            <button
              type="button"
              onclick={() => void resetAutoShortcuts()}
              class="mt-3 rounded-xl border border-border px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
            >
              {t("settings.autoShortcutsReset")}
            </button>
          </div>

          <button
            type="button"
            onclick={() => {
              onclose();
              app.openWelcome();
            }}
            class="mt-6 rounded-xl border border-border px-4 py-2 text-sm text-text transition hover:bg-surface-2"
          >
            {t("settings.replayWelcome")}
          </button>

          <p class="mt-6 mb-2 text-sm font-medium text-muted">{t("settings.languageLabel")}</p>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              onclick={() => app.setLocale("fa")}
              class="rounded-2xl border-2 p-3 text-center text-sm font-medium transition
                {app.locale === 'fa' ? 'border-accent text-text' : 'border-border text-muted hover:bg-surface-2'}"
            >
              فارسی
            </button>
            <button
              type="button"
              onclick={() => app.setLocale("en")}
              class="rounded-2xl border-2 p-3 text-center text-sm font-medium transition
                {app.locale === 'en' ? 'border-accent text-text' : 'border-border text-muted hover:bg-surface-2'}"
            >
              English
            </button>
          </div>

          <p class="mt-6 mb-2 text-sm font-medium text-muted">{t("settings.backupLabel")}</p>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              onclick={exportConfig}
              class="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-surface transition hover:opacity-90"
            >
              {t("about.exportBtn")}
            </button>
            <label class="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm text-text transition hover:bg-surface-2">
              {t("about.importBtn")}
              <input type="file" accept="application/json" class="hidden" onchange={onImportFile} />
            </label>
            <button
              type="button"
              onclick={() => app.reset()}
              class="rounded-xl px-4 py-2 text-sm text-[var(--holiday)] transition hover:bg-[var(--holiday)]/10"
            >
              {t("about.resetBtn")}
            </button>
          </div>
          {#if importMsg}
            <p class="mt-3 text-sm text-muted">{importMsg}</p>
          {/if}
        {:else if tab === "theme"}
          <h3 class="mb-4 font-display text-lg font-bold text-text">{t("settings.tabTheme")}</h3>

          <p class="mb-2 text-sm font-medium text-muted">{t("settings.paletteLabel")}</p>
          <div class="flex flex-wrap items-center gap-5">
            {#each [
              { v: "light", l: t("theme.light"), box: "#ffffff", dots: ["#eceef2", "#6b7280", "#18181b"] },
              { v: "dark", l: t("theme.dark"), box: "#17171b", dots: ["#0b0b0d", "#a1a1aa", "#fafafa"] },
            ] as opt (opt.v)}
              <button
                type="button"
                onclick={() => app.setThemeMode(opt.v as typeof app.themeMode)}
                class="flex flex-col items-center gap-2"
              >
                <span
                  class="flex h-16 w-28 items-center justify-center rounded-2xl border-2 transition
                    {app.themeMode === opt.v ? 'border-accent' : 'border-border hover:border-accent/40'}"
                  style:background={opt.box}
                >
                  <span class="flex">
                    {#each opt.dots as dot, i (dot)}
                      <span
                        class="size-8 rounded-full ring-2 {i > 0 ? '-ms-3' : ''}"
                        style:background={dot}
                        style:--tw-ring-color={opt.box}
                      ></span>
                    {/each}
                  </span>
                </span>
                <span class="text-sm {app.themeMode === opt.v ? 'font-medium text-text' : 'text-muted'}">{opt.l}</span>
              </button>
            {/each}

            <button
              type="button"
              onclick={() => app.setThemeMode("auto")}
              class="flex items-center gap-2 rounded-xl px-1 py-1 text-sm transition
                {app.themeMode === 'auto' ? 'font-medium text-text' : 'text-muted hover:text-text'}"
            >
              <span class="flex">
                <span class="size-6 rounded-full ring-2 ring-surface" style:background="#18181b"></span>
                <span class="-ms-2.5 size-6 rounded-full ring-2 ring-border" style:background="#ffffff"></span>
              </span>
              {t("theme.auto")}
            </button>
          </div>

          <p class="mt-6 mb-2 text-sm font-medium text-muted">{t("settings.widgetAlignLabel")}</p>
          <div class="grid grid-cols-2 gap-3">
            {#each [
              { v: "center", l: t("align.center"), d: t("align.centerDesc") },
              { v: "top", l: t("align.top"), d: t("align.topDesc") },
            ] as opt (opt.v)}
              <button
                type="button"
                onclick={() => app.setWidgetAlign(opt.v as typeof app.widgetAlign)}
                class="flex items-start justify-between gap-3 rounded-2xl border-2 p-4 text-start transition
                  {app.widgetAlign === opt.v ? 'border-text' : 'border-border hover:bg-surface-2'}"
              >
                <div>
                  <p class="text-sm font-medium text-text">{opt.l}</p>
                  <p class="mt-1 text-xs leading-5 text-muted">{opt.d}</p>
                </div>
                <span
                  class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2
                    {app.widgetAlign === opt.v ? 'border-text' : 'border-border'}"
                >
                  {#if app.widgetAlign === opt.v}
                    <span class="size-2.5 rounded-full bg-text"></span>
                  {/if}
                </span>
              </button>
            {/each}
          </div>
        {:else if tab === "background"}
          <h3 class="mb-4 font-display text-lg font-bold text-text">{t("settings.tabBackground")}</h3>

          <div class="mb-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onclick={() => updateBg({ type: "color", value: "", randomCategory: null, randomDate: null })}
              class="rounded-xl border-2 px-4 py-2 text-sm transition
                {app.background.type === 'color' && !app.background.value ? 'border-accent text-text' : 'border-border text-muted hover:bg-surface-2'}"
            >
              {t("bg.default")}
            </button>
            {#each solidColors as c (c)}
              <button
                type="button"
                onclick={() => updateBg({ type: "color", value: c, randomCategory: null, randomDate: null })}
                aria-label={c}
                class="size-9 rounded-xl transition {app.background.value === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}"
                style:background={c}
              ></button>
            {/each}
          </div>

          {#each categories as cat (cat.key)}
            <p class="mb-2 text-sm font-medium text-muted">{app.locale === "fa" ? cat.fa : cat.en}</p>
            <div class="mb-4 grid grid-cols-4 gap-2">
              <button
                type="button"
                onclick={() => pickRandomForCategory(cat.key)}
                class="flex aspect-video flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-border text-muted transition hover:bg-surface-2
                  {app.background.randomCategory === cat.key ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5">
                  <path d="M4 4h4l3 3M4 20h4l3-3M20 4h-4l-8 8M20 20h-4l-3-3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="text-xs">{t("bg.random")}</span>
              </button>
              {#each cat.items as w (w.full)}
                <button
                  type="button"
                  onclick={() => updateBg({ type: "image", value: w.full, randomCategory: null, randomDate: null })}
                  class="group aspect-video overflow-hidden rounded-xl transition {app.background.value === w.full && app.background.randomCategory !== cat.key ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}"
                >
                  <img src={w.thumb} alt="" class="size-full object-cover transition duration-300 group-hover:scale-110" loading="lazy" />
                </button>
              {/each}
            </div>
          {/each}

          <div class="mt-2 flex gap-3">
            <button
              type="button"
              onclick={() => fileInput?.click()}
              class="rounded-xl border border-border px-4 py-2 text-sm text-text transition hover:bg-surface-2"
            >
              {t("bg.uploadImage")}
            </button>
            <input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={onCustomFile} />
          </div>

          {#if app.background.type === "image"}
            <div class="mt-5 space-y-4">
              <label class="block text-sm text-muted">
                {t("bg.dimLabel")}
                <input
                  type="range" min="0" max="0.8" step="0.05" value={app.background.dim}
                  oninput={(e) => updateBg({ dim: Number(e.currentTarget.value) })}
                  class="mt-1 w-full accent-[var(--accent)]"
                />
              </label>
              <label class="block text-sm text-muted">
                {t("bg.blurLabel")}
                <input
                  type="range" min="0" max="20" step="1" value={app.background.blur}
                  oninput={(e) => updateBg({ blur: Number(e.currentTarget.value) })}
                  class="mt-1 w-full accent-[var(--accent)]"
                />
              </label>
            </div>
          {/if}
        {:else if tab === "clock"}
          <h3 class="mb-4 font-display text-lg font-bold text-text">{t("settings.tabClock")}</h3>

          <p class="mb-2 text-sm font-medium text-muted">{t("settings.clockFaceLabel")}</p>
          <div class="grid grid-cols-3 gap-3">
            {#each [{ v: "modern", l: t("clockFace.modern") }, { v: "classic", l: t("clockFace.classic") }, { v: "digital", l: t("clockFace.digital") }] as opt (opt.v)}
              <button
                type="button"
                onclick={() => app.setClockFace(opt.v as typeof app.clockFace)}
                class="flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition
                  {app.clockFace === opt.v ? 'border-accent' : 'border-border hover:bg-surface-2'}"
              >
                <div class="size-24 rounded-full" style="--surface: var(--surface-2)">
                  <ClockFace face={opt.v as typeof app.clockFace} digitalClass="text-2xl" />
                </div>
                <span class="text-sm {app.clockFace === opt.v ? 'font-medium text-text' : 'text-muted'}">
                  {opt.l}
                </span>
              </button>
            {/each}
          </div>

        {:else if tab === "weather"}
          <h3 class="mb-4 font-display text-lg font-bold text-text">{t("settings.tabWeather")}</h3>

          <p class="mb-2 text-sm font-medium text-muted">{t("city.selectLabel")}</p>
          <CityPicker />

          <p class="mt-6 mb-2 text-sm font-medium text-muted">{t("settings.tempUnitLabel")}</p>
          <div class="grid grid-cols-2 gap-3">
            {#each [{ v: "celsius", l: t("unit.celsius") }, { v: "fahrenheit", l: t("unit.fahrenheit") }] as opt (opt.v)}
              <button
                type="button"
                onclick={() => app.setTempUnit(opt.v as typeof app.tempUnit)}
                class="rounded-2xl border-2 p-3 text-center text-sm transition
                  {app.tempUnit === opt.v ? 'border-accent font-medium text-text' : 'border-border text-muted hover:bg-surface-2'}"
              >
                {opt.l}
              </button>
            {/each}
          </div>
        {:else if tab === "calendar"}
          <h3 class="mb-4 font-display text-lg font-bold text-text">{t("settings.tabCalendar")}</h3>

          <p class="mb-2 text-sm font-medium text-muted">{t("settings.calendarTypeLabel")}</p>
          <div class="grid grid-cols-3 gap-3">
            {#each [{ v: "persian", l: t("cal.persian") }, { v: "islamic-umalqura", l: t("cal.hijri") }, { v: "gregory", l: t("cal.gregory") }] as opt (opt.v)}
              <button
                type="button"
                onclick={() => app.setCalendarType(opt.v as typeof app.calendarType)}
                class="rounded-2xl border-2 p-3 text-center text-sm transition
                  {app.calendarType === opt.v ? 'border-accent font-medium text-text' : 'border-border text-muted hover:bg-surface-2'}"
              >
                {opt.l}
              </button>
            {/each}
          </div>

          <p class="mt-6 mb-2 text-sm font-medium text-muted">{t("settings.showOccasionsLabel")}</p>
          <div class="space-y-3">
            {#each [{ k: "national", l: t("occ.nationalLabel"), d: t("occ.nationalDesc") }, { k: "religious", l: t("occ.religiousLabel"), d: t("occ.religiousDesc") }, { k: "international", l: t("occ.internationalLabel"), d: t("occ.internationalDesc") }, { k: "cultural", l: t("occ.culturalLabel"), d: t("occ.culturalDesc") }] as opt (opt.k)}
              <div class="flex items-center justify-between rounded-2xl border border-border p-4">
                <div>
                  <p class="text-sm font-medium text-text">{opt.l}</p>
                  <p class="text-xs text-muted">{opt.d}</p>
                </div>
                <Toggle
                  label={opt.l}
                  checked={app.occasions[opt.k as keyof typeof app.occasions]}
                  onchange={(v) => app.setOccasions({ ...app.occasions, [opt.k]: v })}
                />
              </div>
            {/each}
          </div>

          <div class="mt-6 flex items-center justify-between rounded-2xl border border-border p-4">
            <div>
              <p class="text-sm font-medium text-text">{t("settings.showPrayerTimesLabel")}</p>
              <p class="text-xs text-muted">{t("settings.showPrayerTimesDesc")}</p>
            </div>
            <Toggle
              label={t("settings.showPrayerTimesLabel")}
              checked={app.showPrayerTimes}
              onchange={(v) => app.setShowPrayerTimes(v)}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
