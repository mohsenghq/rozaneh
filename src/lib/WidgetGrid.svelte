<script lang="ts">
  import type { Snippet } from "svelte";
  import { app } from "./store.svelte";
  import type { WidgetId } from "./settings";
  import { compact, toItems } from "./grid";
  import {
    REF_COL_W,
    REF_GAP,
    REF_GRID_W,
    REF_ROW_H,
    STACK_BREAKPOINT,
    refHeight,
    rowExtra,
    stackClass,
    stageScale,
  } from "./gridGeometry";

  interface Props {
    widget: Snippet<[WidgetId, boolean]>;
  }

  let { widget }: Props = $props();

  let width = $state(0);
  let height = $state(0);

  const stacked = $derived(width > 0 && width < STACK_BREAKPOINT);
  const items = $derived(compact(toItems(app.widgetLayout)));
  const rows = $derived(Math.max(1, items.reduce((max, item) => Math.max(max, item.y + item.h), 0)));
  const scale = $derived(stacked ? 1 : stageScale({ width, height, rows }));
  const stageHeight = $derived(refHeight(rows));
  const stackOrder = $derived([...items].sort((a, b) => a.y - b.y || a.x - b.x));

  function pxX(x: number): number {
    return x * (REF_COL_W + REF_GAP);
  }
  function pxY(y: number): number {
    return y * (REF_ROW_H + REF_GAP) + rowExtra(y);
  }
  function itemW(w: number): number {
    return w * REF_COL_W + (w - 1) * REF_GAP;
  }
  function itemH(h: number): number {
    return h * REF_ROW_H + (h - 1) * REF_GAP;
  }
</script>

<div
  class="relative h-full w-full {stacked ? 'overflow-y-auto' : ''}"
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  {#if stacked}
    <div class="flex flex-col gap-4">
      {#each stackOrder as it (it.i)}
        <div class={stackClass(it.i)}>
          {@render widget(it.i, true)}
        </div>
      {/each}
    </div>
  {:else if width > 0 && height > 0}
    <div
      class="absolute left-1/2 top-0"
      style:width="{REF_GRID_W}px"
      style:height="{stageHeight}px"
      style:transform="translateX(-50%) scale({scale})"
      style:transform-origin="top center"
    >
      {#each items as it (it.i)}
        <div
          class="absolute left-0 top-0 z-10 transition-[z-index] hover:z-30 focus-within:z-30"
          style:transform="translate({pxX(it.x)}px, {pxY(it.y)}px)"
          style:width="{itemW(it.w)}px"
          style:height="{itemH(it.h)}px"
        >
          <div class="h-full">
            {@render widget(it.i, false)}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
