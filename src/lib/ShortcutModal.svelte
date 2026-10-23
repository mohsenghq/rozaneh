<script lang="ts">
  import { untrack } from "svelte";
  import Modal from "./Modal.svelte";
  import Favicon from "./Favicon.svelte";
  import BookmarkPicker from "./BookmarkPicker.svelte";
  import { shortcuts } from "./shortcuts.svelte.js";
  import { suggestedSites, type SuggestedSite } from "./suggested";
  import { normalizeUrl } from "./search";
  import { t } from "./i18n";
  import type { Shortcut } from "./shortcuts";

  interface Props {
    mode: "add" | "edit";
    shortcut?: Shortcut;
    onclose: () => void;
  }

  let { mode, shortcut, onclose }: Props = $props();

  let title = $state(untrack(() => shortcut?.title ?? ""));
  let url = $state(untrack(() => shortcut?.url ?? ""));
  let icon = $state(untrack(() => shortcut?.icon ?? ""));
  let fileInput = $state<HTMLInputElement | null>(null);
  let importing = $state(false);

  const canSave = $derived(url.trim() !== "");

  function onFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => (icon = reader.result as string);
    reader.readAsDataURL(file);
  }

  function useSuggestion(site: SuggestedSite) {
    title = site.name;
    url = site.url;
    icon = "";
  }

  function finalTitle(): string {
    const t = title.trim();
    if (t) return t;
    try {
      return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
    } catch {
      return url.trim();
    }
  }

  function save() {
    if (!canSave) return;
    const data = { title: finalTitle(), url: normalizeUrl(url.trim()), icon };
    if (mode === "edit" && shortcut) shortcuts.update(shortcut.id, data);
    else shortcuts.add(data);
    onclose();
  }

  function remove() {
    if (mode === "edit" && shortcut) shortcuts.remove(shortcut.id);
    onclose();
  }
</script>

<Modal title={mode === "edit" ? t("shortcut.editTitle") : t("shortcut.addTitle")} {onclose}>
  <div class="flex gap-4">
    <div class="flex flex-1 flex-col gap-3">
      <label class="flex flex-col gap-1">
        <span class="text-sm text-muted">{t("shortcut.titleLabel")}</span>
        <input
          bind:value={title}
          placeholder={t("shortcut.titlePlaceholder")}
          class="rounded-xl bg-surface-2 px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm text-muted">{t("shortcut.urlLabel")}</span>
        <input
          bind:value={url}
          dir="ltr"
          placeholder="example.com"
          class="rounded-xl bg-surface-2 px-3 py-2 text-left outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
    </div>

    <button
      type="button"
      onclick={() => fileInput?.click()}
      class="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-muted transition hover:opacity-80"
      aria-label={t("shortcut.uploadIcon")}
    >
      {#if icon}
        <img src={icon} alt="" class="size-16 rounded-xl object-contain" />
      {:else if url.trim()}
        <Favicon {url} title={title || url} px={56} />
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-10">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
        </svg>
      {/if}
    </button>
    <input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={onFile} />
  </div>

  <p class="mt-6 text-sm font-medium text-muted">{t("shortcut.suggested")}</p>
  <div class="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
    {#each suggestedSites as site (site.url)}
      <button
        type="button"
        onclick={() => useSuggestion(site)}
        class="flex flex-col items-center gap-1.5 rounded-xl p-2 transition hover:bg-surface-2"
      >
        <Favicon url={site.url} title={site.name} px={26} />
        <span class="w-full truncate text-center text-[11px] text-muted">{site.name}</span>
      </button>
    {/each}
  </div>

  <div class="mt-7 flex items-center gap-3">
    {#if mode === "edit"}
      <button
        type="button"
        onclick={remove}
        class="rounded-xl px-4 py-2.5 font-medium text-red-500 transition hover:bg-red-500/10"
      >
        {t("common.delete")}
      </button>
    {:else}
      <button
        type="button"
        onclick={() => (importing = true)}
        class="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm text-text transition hover:bg-surface-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-4">
          <path d="M9 15L15 9M10 6l.7-.7a4 4 0 0 1 5.6 5.6l-.7.7M14 18l-.7.7a4 4 0 0 1-5.6-5.6l.7-.7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {t("bookmarks.importTitle")}
      </button>
    {/if}
    <button
      type="button"
      onclick={save}
      disabled={!canSave}
      class="ms-auto rounded-xl bg-accent px-5 py-2.5 font-medium text-surface transition hover:opacity-90 disabled:opacity-40"
    >
      {mode === "edit" ? t("common.save") : t("common.add")}
    </button>
  </div>
</Modal>

{#if importing}
  <BookmarkPicker onclose={() => (importing = false)} onimported={onclose} />
{/if}
