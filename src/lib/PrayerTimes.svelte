<script lang="ts">
  import { app } from "./store.svelte";
  import { prayerTimes } from "./prayer";
  import { localeNum, dayMonthYear } from "./calendar";
  import { calendarSelection } from "./calendarSelection.svelte";
  import { portal } from "./portal";

  let now = $state(new Date());
  let hover = $state(false);
  let triggerEl = $state<HTMLSpanElement | null>(null);
  let tooltipPos = $state({ x: 0, y: 0 });

  $effect(() => {
    const id = setInterval(() => (now = new Date()), 60000);
    return () => clearInterval(id);
  });

  const data = $derived(prayerTimes(app.location.lat, app.location.lng, app.locale, now));
  const next = $derived(data.entries.find((e) => e.key === data.next) ?? data.entries[0]);

  const selectedDay = $derived(
    prayerTimes(app.location.lat, app.location.lng, app.locale, calendarSelection.date),
  );
  const isToday = $derived(calendarSelection.date.toDateString() === now.toDateString());

  function fmt(d: Date): string {
    return localeNum(
      d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: app.location.timezone,
      }),
      app.locale,
    );
  }

  function showTooltip() {
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90);
    tooltipPos = { x, y: rect.top };
    hover = true;
  }
</script>

<span
  bind:this={triggerEl}
  role="note"
  class="relative flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm"
  onmouseenter={showTooltip}
  onmouseleave={() => (hover = false)}
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-4 shrink-0 text-muted">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.5 2.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
  <span class="text-muted">{next.label}</span>
  <span class="font-medium text-text tabular-nums">{fmt(next.time)}</span>

  {#if hover}
    <div
      use:portal
      class="pointer-events-none fixed z-50 w-max pb-2"
      style:left="{tooltipPos.x}px"
      style:top="{tooltipPos.y}px"
      style:translate="-50% -100%"
    >
      <div class="rounded-2xl border border-white/10 bg-zinc-900/95 p-3 text-white shadow-2xl backdrop-blur-md">
        <p class="text-sm font-bold">{dayMonthYear(calendarSelection.date, app.calendarType, app.locale)}</p>
        <div class="mt-2 space-y-1 border-t border-white/10 pt-2 text-xs">
          {#each selectedDay.entries as e (e.key)}
            <p class="flex items-center justify-between gap-6">
              <span class={isToday && e.key === data.next ? "font-bold text-white" : "text-white/60"}>
                {e.label}
              </span>
              <span class="tabular-nums {isToday && e.key === data.next ? 'font-bold' : 'text-white/90'}">
                {fmt(e.time)}
              </span>
            </p>
          {/each}
        </div>
      </div>
      <div class="absolute bottom-1 left-1/2 size-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-zinc-900/95"></div>
    </div>
  {/if}
</span>
