<script lang="ts">
  import type { ClockFace } from "./settings";
  import { app } from "./store.svelte";
  import { localeNum } from "./calendar";
  import { clockAngles } from "./clock";
  import { dialNumerals, dialTicks, handLine, polar } from "./clockDial";

  interface Props {
    face: ClockFace;
    digitalClass?: string;
  }

  let { face, digitalClass = "text-5xl" }: Props = $props();

  let now = $state(Date.now());

  $effect(() => {
    const id = setInterval(() => {
      now = Date.now();
    }, 1000);

    // A hidden tab throttles timers. Resync the instant it becomes visible so
    // the first painted frame is the current time, with no catch-up animation.
    function resync() {
      if (document.hidden) return;
      now = Date.now();
    }

    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
    window.addEventListener("pageshow", resync);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
      window.removeEventListener("pageshow", resync);
    };
  });

  const TICKS = dialTicks();
  const NUMERALS = dialNumerals();

  const date = $derived(new Date(now));
  const angles = $derived(clockAngles(date));

  const time = $derived(
    localeNum(
      `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
      app.locale,
    ),
  );

  const hourHand = $derived(handLine(angles.hour, 19, 5));
  const minuteHand = $derived(handLine(angles.minute, 29, 5));
  const secondHand = $derived(handLine(angles.second, 32, 8));

  function dotPos(index: number, radius = 40): { x: number; y: number } {
    return polar(radius, index * 30);
  }
</script>

{#if face === "digital"}
  <div
    class="flex aspect-square h-full w-auto max-h-full max-w-full items-center justify-center rounded-full bg-surface tabular-nums shadow-sm"
  >
    <span class="font-display text-text {digitalClass}">{time}</span>
  </div>
{:else if face === "modern"}
  <svg viewBox="0 0 100 100" class="size-full drop-shadow-sm" role="img" aria-label={time}>
    <circle cx="50" cy="50" r="48" fill="var(--surface)" />
    <circle cx="50" cy="50" r="47" fill="none" stroke="var(--border)" stroke-width="0.8" />

    {#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
      {@const p = dotPos(i)}
      <circle
        cx={p.x}
        cy={p.y}
        r={i % 3 === 0 ? 1.6 : 0.9}
        fill={i % 3 === 0 ? "var(--text)" : "var(--muted)"}
      />
    {/each}

    <line
      x1="50" y1="53" x2="50" y2="27"
      stroke="var(--text)" stroke-width="4.2" stroke-linecap="round"
      transform={`rotate(${angles.hour} 50 50)`}
    />
    <line
      x1="50" y1="55" x2="50" y2="16"
      stroke="var(--text)" stroke-width="2.4" stroke-linecap="round"
      transform={`rotate(${angles.minute} 50 50)`}
    />
    <line
      x1="50" y1="57" x2="50" y2="11"
      stroke="#e5484d" stroke-width="1" stroke-linecap="round"
      transform={`rotate(${angles.second} 50 50)`}
    />
    <circle cx="50" cy="50" r="2.6" fill="var(--text)" />
    <circle cx="50" cy="50" r="1.1" fill="var(--surface)" />
  </svg>
{:else}
  <svg viewBox="0 0 100 100" class="size-full" role="img" aria-label={time}>
    <circle cx="50" cy="50" r="48" fill="var(--surface-2)" />

    {#each TICKS as tick, i (i)}
      <line
        x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
        stroke="var(--muted)"
        stroke-width={tick.major ? 1.4 : 0.55}
        opacity={tick.major ? 0.75 : 0.45}
        stroke-linecap="round"
      />
    {/each}

    {#each NUMERALS as n (n.hour)}
      <text
        x={n.x} y={n.y}
        text-anchor="middle" dominant-baseline="central"
        font-size="8.5" font-weight="600" fill="var(--text)"
      >
        {localeNum(n.hour, app.locale)}
      </text>
    {/each}

    <line
      x1={hourHand.x1} y1={hourHand.y1} x2={hourHand.x2} y2={hourHand.y2}
      stroke="var(--text)" stroke-width="3.6" stroke-linecap="round"
    />
    <line
      x1={minuteHand.x1} y1={minuteHand.y1} x2={minuteHand.x2} y2={minuteHand.y2}
      stroke="var(--text)" stroke-width="2.4" stroke-linecap="round"
    />
    <line
      x1={secondHand.x1} y1={secondHand.y1} x2={secondHand.x2} y2={secondHand.y2}
      stroke="#e5484d" stroke-width="0.9" stroke-linecap="round"
    />
    <circle cx="50" cy="50" r="2.4" fill="var(--text)" />
    <circle cx="50" cy="50" r="1" fill="#e5484d" />
  </svg>
{/if}
