<script lang="ts">
  import type { Snippet } from "svelte";
  import { t } from "./i18n";
  import { portal } from "./portal";
  import { modalFocus } from "./modalFocus";

  interface Props {
    title: string;
    onclose: () => void;
    children: Snippet;
  }

  let { title, onclose, children }: Props = $props();
</script>

<div data-modal-root class="fixed inset-0 z-50 flex items-center justify-center p-4" use:portal>
  <button
    type="button"
    tabindex="-1"
    aria-hidden="true"
    class="absolute inset-0 animate-overlay cursor-default bg-black/40 backdrop-blur-md"
    onclick={onclose}
  ></button>
  <div
    class="relative max-h-[90vh] w-full max-w-lg animate-pop overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl outline-none"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    use:modalFocus={{ onEscape: onclose }}
  >
    <header class="mb-5 flex items-center justify-between">
      <h2 class="font-display text-lg font-bold text-text">{title}</h2>
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
    {@render children()}
  </div>
</div>
