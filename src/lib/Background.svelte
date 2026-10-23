<script lang="ts">
  import { app } from "./store.svelte";

  const bg = $derived(app.background);
  const image = $derived(bg.type === "image" && bg.value !== "");
  const color = $derived(bg.type === "color" && bg.value !== "");
</script>

{#if color}
  <div class="fixed inset-0 -z-10" style:background={bg.value}></div>
{/if}

{#if image}
  <div
    class="fixed inset-0 -z-10 bg-cover bg-center"
    style:background-image={`url("${bg.value}")`}
    style:filter={bg.blur ? `blur(${bg.blur}px)` : null}
  ></div>
  {#if bg.dim > 0}
    <div class="fixed inset-0 -z-10 bg-black" style:opacity={bg.dim}></div>
  {/if}
{/if}
