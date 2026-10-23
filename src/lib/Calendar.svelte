<script lang="ts">
  import { app } from "./store.svelte";
  import {
    buildMonth,
    monthYearLabel,
    monthNames,
    calYearMonth,
    shiftMonth,
    localeNum,
    dayMonthYear,
    gregorianFullDate,
    weekdayName,
  } from "./calendar";
  import { occasionsOn, categoryColor, categoryLabel, occasionTitle } from "./occasions";
  import { calendarSelection } from "./calendarSelection.svelte";
  import { t } from "./i18n";

  let anchor = $state(new Date());
  let mode = $state<"days" | "months">("days");
  let pickerYear = $state(0);
  let hoverKey = $state<number | null>(null);
  let hoverTimer: ReturnType<typeof setTimeout>;

  function hoverEnter(key: number) {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => (hoverKey = key), 150);
  }
  function hoverLeave() {
    clearTimeout(hoverTimer);
    hoverKey = null;
  }

  const cal = $derived(app.calendarType);
  const view = $derived(buildMonth(anchor, cal, app.locale));
  const decorated = $derived(
    view.cells.map((c) => {
      const occ = occasionsOn(c.date, app.occasions);
      return { ...c, occ, holiday: c.friday || occ.some((o) => o.holiday) };
    }),
  );
  const label = $derived(monthYearLabel(anchor, cal, app.locale));
  const anchorYM = $derived(calYearMonth(anchor, cal));
  const todayYM = $derived(calYearMonth(new Date(), cal));
  const isCurrentMonth = $derived(
    anchorYM.year === todayYM.year && anchorYM.month === todayYM.month,
  );
  const months = $derived(monthNames(cal, app.locale));
  const selectedKey = $derived(calendarSelection.date.getTime());

  function prevMonth() {
    anchor = shiftMonth(anchor, cal, -1);
  }
  function nextMonth() {
    anchor = shiftMonth(anchor, cal, 1);
  }
  function goToday() {
    anchor = new Date();
    mode = "days";
    calendarSelection.resetToToday();
  }
  function openPicker() {
    pickerYear = anchorYM.year;
    mode = "months";
  }
  function pickMonth(i: number) {
    const a = calYearMonth(anchor, cal);
    anchor = shiftMonth(anchor, cal, (pickerYear - a.year) * 12 + (i + 1 - a.month));
    mode = "days";
  }
</script>

<div class="flex h-full w-full flex-col rounded-[28px] bg-surface p-6 shadow-[0_10px_40px_var(--shadow)]">
  <div class="mb-4 flex shrink-0 items-center justify-between">
    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={openPicker}
        class="rounded-lg px-2 py-1 text-xl font-bold text-text transition hover:bg-surface-2"
      >
        {label}
      </button>
      {#if !isCurrentMonth}
        <button
          type="button"
          onclick={goToday}
          class="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs text-muted transition hover:text-text"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5">
            <path d="M9 14l-4-4 4-4M5 10h9a5 5 0 0 1 0 10h-1" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {t("calendar.backToToday")}
        </button>
      {/if}
    </div>

    <div class="flex items-center gap-1">
      <button
        type="button"
        onclick={prevMonth}
        aria-label={t("calendar.prevMonth")}
        class="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
          <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onclick={nextMonth}
        aria-label={t("calendar.nextMonth")}
        class="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
          <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>

  <div class="min-h-0 flex-1">
    {#if mode === "months"}
      <div class="mb-4 flex items-center justify-between">
        <button
          type="button"
          onclick={() => (pickerYear -= 1)}
          aria-label={t("calendar.prevYear")}
          class="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
            <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <span class="text-lg font-bold text-text">{localeNum(pickerYear, app.locale)}</span>
        <button
          type="button"
          onclick={() => (pickerYear += 1)}
          aria-label={t("calendar.nextYear")}
          class="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
            <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="grid animate-pop grid-cols-3 gap-2">
        {#each months as name, i (name)}
          <button
            type="button"
            onclick={() => pickMonth(i)}
            class="rounded-xl py-4 text-sm transition
              {pickerYear === anchorYM.year && i + 1 === anchorYM.month
              ? 'bg-surface-2 font-bold text-text'
              : 'text-text hover:bg-surface-2'}"
          >
            {name}
          </button>
        {/each}
      </div>
    {:else}
      {#key label}
        <div class="grid h-full animate-pop grid-cols-7 grid-rows-[auto] auto-rows-[minmax(0,1fr)] gap-y-1 text-center">
          {#each view.weekdays as w (w)}
            <div class="pb-1 text-sm font-medium text-muted sm:text-base">{w}</div>
          {/each}

          {#each decorated as c, i (c.date.getTime())}
            {@const flip = Math.floor(i / 7) >= decorated.length / 7 - 2}
            <div class="relative flex h-full items-center justify-center [container-type:size]">
              <button
                type="button"
                onclick={() => calendarSelection.select(c.date)}
                onmouseenter={() => hoverEnter(c.date.getTime())}
                onmouseleave={hoverLeave}
                class="relative flex items-center justify-center rounded-full text-sm transition duration-150 active:scale-90 sm:text-base
                  {c.today
                  ? 'bg-text font-bold text-surface'
                  : selectedKey === c.date.getTime()
                    ? 'bg-accent/15 font-bold ring-2 ring-accent'
                    : 'hover:bg-surface-2/60'}
                  {!c.today && !c.inMonth ? 'text-muted' : ''}
                  {!c.today && c.inMonth && c.holiday ? 'text-[var(--holiday)]' : ''}
                  {!c.today && c.inMonth && !c.holiday ? 'text-text' : ''}"
                style:width="min(calc(100cqw - 4px), calc(100cqh - 4px), 4rem)"
                style:height="min(calc(100cqw - 4px), calc(100cqh - 4px), 4rem)"
              >
                {localeNum(c.day, app.locale)}
                {#if c.occ.length}
                  <span class="absolute bottom-0.5 flex gap-0.5">
                    {#each c.occ.slice(0, 3) as o (o.title)}
                      <span class="size-1 rounded-full" style:background={categoryColor(o.category)}></span>
                    {/each}
                  </span>
                {/if}
              </button>

              {#if hoverKey === c.date.getTime()}
                <div
                  class="pointer-events-none absolute left-1/2 z-20 w-max max-w-[280px] -translate-x-1/2 animate-pop
                    {flip ? 'bottom-full mb-2' : 'top-full mt-2'}"
                >
                  <div
                    class="absolute left-1/2 size-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-zinc-900/95
                      {flip ? '-bottom-1' : '-top-1'}"
                  ></div>
                  <div class="rounded-2xl border border-white/10 bg-zinc-900/95 p-3 text-white shadow-2xl backdrop-blur-md">
                    <p class="text-sm font-bold">
                      {weekdayName(c.date, app.locale)} {dayMonthYear(c.date, cal, app.locale)}
                    </p>
                    <div class="mt-2 space-y-1 border-t border-white/10 pt-2 text-[11px]">
                      <p class="flex items-center justify-between gap-4">
                        <span class="text-white/50">{t("cal.persian")}</span>
                        <span class="text-white/90">{dayMonthYear(c.date, "persian", app.locale)}</span>
                      </p>
                      <p class="flex items-center justify-between gap-4">
                        <span class="text-white/50">{t("cal.hijri")}</span>
                        <span class="text-white/90">{dayMonthYear(c.date, "islamic-umalqura", app.locale)}</span>
                      </p>
                      <p class="flex items-center justify-between gap-4">
                        <span class="text-white/50">{t("cal.gregory")}</span>
                        <span class="text-white/90" dir="ltr">{gregorianFullDate(c.date)}</span>
                      </p>
                    </div>
                    {#if c.occ.length}
                      <ul class="mt-2 space-y-1.5 border-t border-white/10 pt-2">
                        {#each c.occ as o (o.title)}
                          <li class="flex items-center gap-2 text-xs">
                            <span class="size-2 shrink-0 rounded-full" style:background={categoryColor(o.category)}></span>
                            <span class="flex-1">{occasionTitle(o, app.locale)}</span>
                            <span class="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                              {categoryLabel(o.category, app.locale)}
                            </span>
                          </li>
                        {/each}
                      </ul>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/key}
    {/if}
  </div>
</div>
