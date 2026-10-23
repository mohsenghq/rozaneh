<script lang="ts">
  import type { Condition } from "./weather";

  interface Props {
    condition: Condition;
    isDay?: boolean;
    class?: string;
  }

  let { condition, isDay = true, class: klass = "size-16" }: Props = $props();

  const sun = "#f59e0b";
  const cloud = "#9ca3af";
  const rain = "#3b82f6";
  const snow = "#93c5fd";
  const bolt = "#f59e0b";
</script>

<svg viewBox="0 0 24 24" class={klass} fill="none" stroke-linecap="round" stroke-linejoin="round">
  {#if condition === "clear"}
    {#if isDay}
      <circle cx="12" cy="12" r="4.5" fill={sun} />
      <g stroke={sun} stroke-width="1.8">
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
      </g>
    {:else}
      <path d="M20 14.5A7.5 7.5 0 1 1 10.5 4a6 6 0 0 0 9.5 10.5z" fill={sun} stroke="none" />
    {/if}
  {:else if condition === "partly"}
    <circle cx="8" cy="8" r="3.4" fill={sun} />
    <path d="M18 19H8a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 18 19z" fill={cloud} stroke="none" />
  {:else if condition === "fog"}
    <path d="M17.5 13H8a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1.4A3.4 3.4 0 0 1 17.5 13z" fill={cloud} stroke="none" />
    <g stroke={cloud} stroke-width="1.8"><path d="M4 17h16M6 20.5h12" /></g>
  {:else if condition === "rain"}
    <path d="M17.5 15H8a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1.4A3.4 3.4 0 0 1 17.5 15z" fill={cloud} stroke="none" />
    <g stroke={rain} stroke-width="1.9"><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5" /></g>
  {:else if condition === "snow"}
    <path d="M17.5 14H8a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1.4A3.4 3.4 0 0 1 17.5 14z" fill={cloud} stroke="none" />
    <g fill={snow}><circle cx="8.5" cy="18.5" r="1" /><circle cx="12" cy="20" r="1" /><circle cx="15.5" cy="18.5" r="1" /></g>
  {:else if condition === "thunder"}
    <path d="M17.5 13H8a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1.4A3.4 3.4 0 0 1 17.5 13z" fill={cloud} stroke="none" />
    <path d="M12.5 13l-2.5 4h2l-1 4 3.5-5h-2z" fill={bolt} stroke="none" />
  {:else}
    <path d="M17.5 15H7.5a4.5 4.5 0 0 1 0-9 5.5 5.5 0 0 1 10.4 1.6A3.7 3.7 0 0 1 17.5 15z" fill={cloud} stroke="none" />
  {/if}
</svg>
