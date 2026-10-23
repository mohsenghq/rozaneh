<script lang="ts">
  import { untrack } from "svelte";
  import type { BookmarkNode } from "./bookmarks";
  import BookmarkTreeItem from "./BookmarkTreeItem.svelte";
  import Favicon from "./Favicon.svelte";
  import { t } from "./i18n";

  interface Props {
    node: BookmarkNode;
    selected: Set<string>;
    onToggle: (node: BookmarkNode) => void;
    depth?: number;
  }

  let { node, selected, onToggle, depth = 0 }: Props = $props();

  let expanded = $state(untrack(() => depth === 0));

  const isFolder = $derived(!node.url);
  const checked = $derived(selected.has(node.id));
</script>

<div dir="ltr">
  <div
    class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
    style:padding-inline-start={`${depth * 20 + 8}px`}
  >
    <label class="flex min-w-0 flex-1 items-center gap-2 text-sm text-text">
      <input
        type="checkbox"
        {checked}
        onchange={() => onToggle(node)}
        class="size-4 shrink-0 accent-[var(--accent)]"
      />
      {#if isFolder}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-4 shrink-0 text-muted">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke-linejoin="round" />
        </svg>
      {:else}
        <Favicon url={node.url ?? ""} title={node.title} px={18} />
      {/if}
      <span class="truncate">{node.title || node.url}</span>
    </label>

    {#if isFolder && node.children?.length}
      <button
        type="button"
        onclick={() => (expanded = !expanded)}
        aria-label={expanded ? t("bookmarks.collapseFolder") : t("bookmarks.expandFolder")}
        class="flex size-5 shrink-0 items-center justify-center text-muted transition"
      >
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          class="size-3.5 transition-transform"
          style:transform={expanded ? "rotate(90deg)" : "rotate(0deg)"}
        >
          <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    {/if}
  </div>

  {#if isFolder && expanded && node.children?.length}
    {#each node.children as child (child.id)}
      <BookmarkTreeItem node={child} {selected} {onToggle} depth={depth + 1} />
    {/each}
  {/if}
</div>
