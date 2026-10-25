<script lang="ts">
  import { app } from "./store.svelte";
  import { shortcuts } from "./shortcuts.svelte.js";
  import ShortcutModal from "./ShortcutModal.svelte";
  import Favicon from "./Favicon.svelte";
  import { normalizeUrl } from "./search";
  import { t } from "./i18n";
  import { shortLabel, type Shortcut } from "./shortcuts";
  import {
    SHORTCUT_CAPACITY,
    SHORTCUT_ROW_GAP,
    SHORTCUT_ROW_PITCH,
    SHORTCUT_TILE,
    desktopLayout,
    flowLayout,
    gridHeight,
  } from "./shortcutLayout";

  interface Props {
    flow?: boolean;
  }

  let { flow = false }: Props = $props();

  let modal = $state<{ mode: "add" | "edit"; shortcut?: Shortcut } | null>(null);

  let width = $state(0);
  let inner = $state<HTMLDivElement | null>(null);
  const rtl = $derived(app.locale === "fa");

  const layout = $derived(flow ? flowLayout(width) : desktopLayout(width));
  const cols = $derived(layout.cols);
  const slot = $derived(layout.slot);
  const rowStep = SHORTCUT_ROW_PITCH + SHORTCUT_ROW_GAP;

  const capacity = $derived(flow ? Infinity : SHORTCUT_CAPACITY);
  const canAdd = $derived(shortcuts.items.length < capacity);
  const visibleCount = $derived(
    Number.isFinite(capacity)
      ? Math.min(shortcuts.items.length, canAdd ? capacity - 1 : capacity)
      : shortcuts.items.length,
  );
  const visible = $derived(shortcuts.items.slice(0, visibleCount));
  const slots = $derived(visible.length + (canAdd ? 1 : 0));

  const usedCols = $derived(Math.max(1, Math.min(cols, slots)));
  const usedRows = $derived(Math.max(1, Math.ceil(slots / cols)));
  const innerW = $derived(usedCols * slot - layout.gap);
  // Desktop shows a single row; narrow layouts grow with their content.
  const innerH = $derived(gridHeight(usedRows));

  function baseX(i: number): number {
    const c = i % cols;
    return rtl ? innerW - SHORTCUT_TILE - c * slot : c * slot;
  }
  function baseY(i: number): number {
    return Math.floor(i / cols) * rowStep;
  }

  let autoSynced = false;
  $effect(() => {
    if (autoSynced || !app.autoShortcutsEnabled || width <= 0) return;
    autoSynced = true;
    void shortcuts.syncAuto(SHORTCUT_CAPACITY);
  });

  // Drag reorder (absolute, pointer-follow, RTL-safe)
  let dragId = $state<string | null>(null);
  let dragPx = $state({ x: 0, y: 0 });
  let moved = $state(false);
  let draggedEl: HTMLElement | null = null;
  let pointerId = 0;
  let start = { px: 0, py: 0, ox: 0, oy: 0 };

  const dragging = $derived(dragId !== null && moved);

  // The shortcut bar can sit inside the scaled desktop stage, so pointer
  // distances are converted back into layout pixels using the rendered size.
  function displayScale(): number {
    const r = inner?.getBoundingClientRect();
    return r && innerW > 0 && r.width > 0 ? r.width / innerW : 1;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function open(url: string) {
    window.location.href = normalizeUrl(url);
  }

  function hostLabel(url: string): string {
    try {
      return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  function targetAt(clientX: number, clientY: number): number {
    if (!inner || visible.length === 0) return 0;
    const r = inner.getBoundingClientRect();
    const k = displayScale();
    const relX = (clientX - r.left) / k;
    const relY = (clientY - r.top) / k;
    const c = rtl
      ? Math.round((innerW - SHORTCUT_TILE / 2 - relX) / slot)
      : Math.round((relX - SHORTCUT_TILE / 2) / slot);
    const row = Math.round((relY - SHORTCUT_TILE / 2) / rowStep);
    const index = clamp(row, 0, usedRows - 1) * cols + clamp(c, 0, cols - 1);
    return clamp(index, 0, visible.length - 1);
  }

  function down(e: PointerEvent, s: Shortcut, i: number) {
    if ((e.target as HTMLElement).closest("button[aria-label]")) return;
    if (e.button !== 0) return;
    dragId = s.id;
    draggedEl = e.currentTarget as HTMLElement;
    pointerId = e.pointerId;
    moved = false;
    start = { px: e.clientX, py: e.clientY, ox: baseX(i), oy: baseY(i) };
    dragPx = { x: start.ox, y: start.oy };
  }

  function move(e: PointerEvent) {
    if (dragId === null || !draggedEl) return;
    const dx = e.clientX - start.px;
    const dy = e.clientY - start.py;
    if (!moved) {
      if (Math.abs(dx) <= 4 && Math.abs(dy) <= 4) return; // still a potential click
      moved = true;
      // Capture lazily so the inner button's click isn't swallowed.
      draggedEl.setPointerCapture(pointerId);
    }
    const k = displayScale();
    dragPx = { x: start.ox + dx / k, y: start.oy + dy / k };
    const target = visible[targetAt(e.clientX, e.clientY)];
    if (target && target.id !== dragId) {
      shortcuts.move(dragId, target.id);
    }
  }

  function up() {
    dragId = null;
    moved = false;
    draggedEl = null;
  }
</script>

<div bind:clientWidth={width} class="w-full select-none {flow ? 'h-auto' : 'h-full'}">
  {#if width > 0}
    <div
      bind:this={inner}
      class="relative mx-auto transition-[width,height] duration-300"
      style:width="{innerW}px"
      style:height="{innerH}px"
    >
      <div role="list" aria-label={t("shortcuts.listLabel")} class="absolute inset-0">
        {#each visible as s, i (s.id)}
        {@const isDragged = dragging && dragId === s.id}
        {@const above = Math.floor(i / cols) === 0}
        <div
          class="group absolute left-0 top-0 animate-pop touch-none {isDragged
            ? 'z-30'
            : dragging
              ? ''
              : 'transition-transform duration-300'}"
          role="listitem"
          style:transform={isDragged
            ? `translate(${dragPx.x}px, ${dragPx.y}px)`
            : `translate(${baseX(i)}px, ${baseY(i)}px)`}
          style:width="{SHORTCUT_TILE}px"
          ondragstart={(e) => e.preventDefault()}
          onpointerdown={(e) => down(e, s, i)}
          onpointermove={move}
          onpointerup={up}
          onpointercancel={up}
        >
          <button
            type="button"
            onclick={() => open(s.url)}
            aria-label={s.title}
            class="flex items-center justify-center rounded-2xl border border-border transition-colors hover:border-accent hover:text-accent
              {isDragged ? 'cursor-grabbing shadow-lg' : 'cursor-default'}"
            style:width="{SHORTCUT_TILE}px"
            style:height="{SHORTCUT_TILE}px"
          >
            <Favicon url={s.url} icon={s.icon} title={s.title} px={Math.round(SHORTCUT_TILE * 0.57)} />
          </button>

          {#if !dragging}
            <span
              class="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 truncate text-center text-[10px] leading-[12px] text-muted"
              style:width="{slot - 6}px"
              title={s.title}
            >
              {shortLabel(s.title, s.url)}
            </span>

            <div
              class="pointer-events-none absolute inset-x-0 z-40 flex justify-center scale-95 opacity-0 transition duration-150 ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:delay-300
                {above ? 'bottom-full mb-4 translate-y-1' : 'top-full mt-6 -translate-y-1'} group-hover:translate-y-0"
            >
              <div class="rounded-lg bg-text px-2 py-1 shadow-lg">
                <p class="text-[10px] text-surface/80" dir="ltr">{hostLabel(s.url)}</p>
              </div>
            </div>
          {/if}

          <button
            type="button"
            onclick={() => shortcuts.remove(s.id)}
            aria-label={t("shortcuts.remove")}
            class="absolute flex size-6 items-center justify-center rounded-full bg-text text-surface opacity-0 shadow transition group-hover:opacity-100 group-focus-within:opacity-100"
            style:left="-6px"
            style:top="-6px"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="size-3">
              <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onclick={() => (modal = { mode: "edit", shortcut: s })}
            aria-label={t("shortcuts.edit")}
            class="absolute flex size-6 items-center justify-center rounded-full bg-text text-surface opacity-0 shadow transition group-hover:opacity-100 group-focus-within:opacity-100"
            style:right="-6px"
            style:top="-6px"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="size-3">
              <path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.83-2.83L5 17v3z" stroke-linejoin="round" />
            </svg>
          </button>

          {#if s.source === "auto"}
            <span
              class="pointer-events-none absolute -bottom-0.5 -end-0.5 size-2 rounded-full bg-accent/70 ring-2 ring-surface"
              title={t("shortcuts.autoHint")}
              aria-hidden="true"
            ></span>
          {/if}
        </div>
        {/each}
      </div>

      {#if canAdd}
        <button
          type="button"
          onclick={() => (modal = { mode: "add" })}
          aria-label={t("shortcut.addTitle")}
          class="absolute left-0 top-0 flex items-center justify-center rounded-full border border-border text-muted transition-transform duration-300 hover:border-accent hover:text-accent"
          style:width="{SHORTCUT_TILE}px"
          style:height="{SHORTCUT_TILE}px"
          style:transform="translate({baseX(visible.length)}px, {baseY(visible.length)}px)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
          </svg>
        </button>
      {/if}
    </div>
  {/if}
</div>

{#if modal}
  <ShortcutModal mode={modal.mode} shortcut={modal.shortcut} onclose={() => (modal = null)} />
{/if}
