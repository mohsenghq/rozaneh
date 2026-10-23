<script lang="ts">
  import Modal from "./Modal.svelte";
  import BookmarkTreeItem from "./BookmarkTreeItem.svelte";
  import { shortcuts } from "./shortcuts.svelte.js";
  import { normalizeUrl } from "./search";
  import { t } from "./i18n";
  import {
    getBookmarkTree,
    flattenBookmarks,
    hasBookmarksPermission,
    requestBookmarksPermission,
    type BookmarkNode,
  } from "./bookmarks";

  interface Props {
    onclose: () => void;
    onimported: () => void;
  }

  let { onclose, onimported }: Props = $props();

  let phase = $state<"gate" | "loading" | "tree" | "error">("gate");
  let tree = $state<BookmarkNode[]>([]);
  let selected = $state(new Set<string>());

  init();

  async function init() {
    if (await hasBookmarksPermission()) await load();
  }

  async function grant() {
    phase = "loading";
    const granted = await requestBookmarksPermission();
    if (granted) await load();
    else phase = "gate";
  }

  async function load() {
    phase = "loading";
    try {
      tree = await getBookmarkTree();
      phase = "tree";
    } catch {
      phase = "error";
    }
  }

  function leafIds(node: BookmarkNode): string[] {
    if (node.url) return [node.id];
    return (node.children ?? []).flatMap(leafIds);
  }

  function toggle(node: BookmarkNode) {
    const ids = leafIds(node);
    const allSelected = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    for (const id of ids) {
      if (allSelected) next.delete(id);
      else next.add(id);
    }
    selected = next;
  }

  function confirm() {
    const chosen = flattenBookmarks(tree).filter((n) => selected.has(n.id) && n.url);
    for (const b of chosen) {
      shortcuts.add({ title: b.title || b.url!, url: normalizeUrl(b.url!), icon: "" });
    }
    onimported();
  }
</script>

<Modal title={t("bookmarks.importTitle")} {onclose}>
  {#if phase === "gate"}
    <div class="flex flex-col items-center gap-4 py-6 text-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-12 text-muted">
        <path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke-linejoin="round" />
        <path d="M9 9h6M9 13h6M9 17h3" stroke-linecap="round" />
      </svg>
      <p class="text-sm text-muted">{t("bookmarks.permissionExplain")}</p>
      <button
        type="button"
        onclick={grant}
        class="rounded-xl bg-accent px-5 py-2.5 font-medium text-surface transition hover:opacity-90"
      >
        {t("bookmarks.grantContinue")}
      </button>
    </div>
  {:else if phase === "loading"}
    <p class="py-8 text-center text-sm text-muted">{t("bookmarks.loading")}</p>
  {:else if phase === "error"}
    <p class="py-8 text-center text-sm text-muted">{t("bookmarks.loadError")}</p>
  {:else}
    <div dir="ltr" class="max-h-96 overflow-y-auto rounded-xl border border-border p-1">
      {#each tree as node (node.id)}
        <BookmarkTreeItem {node} {selected} onToggle={toggle} />
      {/each}
    </div>

    <div class="mt-5 flex items-center gap-3">
      <button
        type="button"
        onclick={onclose}
        class="rounded-xl border border-border px-4 py-2.5 text-sm text-text transition hover:bg-surface-2"
      >
        {t("common.back")}
      </button>
      <button
        type="button"
        onclick={confirm}
        disabled={selected.size === 0}
        class="ms-auto rounded-xl bg-accent px-5 py-2.5 font-medium text-surface transition hover:opacity-90 disabled:opacity-40"
      >
        {t("bookmarks.confirmCount", { count: selected.size })}
      </button>
    </div>
  {/if}
</Modal>
