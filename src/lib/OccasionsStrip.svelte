<script lang="ts">
  import { app } from "./store.svelte";
  import { dayMonthYear, gregorianFullDate, localeNum } from "./calendar";
  import { occasionsOn, categoryColor, categoryLabel, occasionTitle } from "./occasions";
  import { calendarSelection } from "./calendarSelection.svelte";
  import { prices } from "./prices.svelte";
  import { formatToman } from "./prices";
  import { t } from "./i18n";

  interface Props {
    class?: string;
  }

  let { class: klass = "" }: Props = $props();

  const selectedDate = $derived(calendarSelection.date);
  const persian = $derived(dayMonthYear(selectedDate, "persian", app.locale));
  const hijri = $derived(dayMonthYear(selectedDate, "islamic-umalqura", app.locale));
  const gregorian = $derived(gregorianFullDate(selectedDate));

  const list = $derived(occasionsOn(selectedDate, app.occasions));

  $effect(() => {
    app.locale;
    prices.refresh();
  });
</script>

<div class="w-full rounded-[28px] bg-surface p-5 shadow-[0_10px_40px_var(--shadow)] {klass}">
  <div
    class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-3 text-sm text-text"
  >
    <span>{persian}</span>
    <span class="text-muted">•</span>
    <span>{hijri}</span>
    <span class="text-muted">•</span>
    <span dir="ltr">{gregorian}</span>
  </div>

  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-border py-2.5 text-sm">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-4 shrink-0 text-muted">
      <path d="M4 20V10M10 20V4M16 20v-7M20 20H3" stroke-linecap="round" />
    </svg>

    {#each prices.items as p (p.key)}
      <span class="flex items-center gap-1 whitespace-nowrap">
        <span class="text-muted">{p.prefix}{p.prefix ? " " : ""}{p.label}</span>
        <span class="font-medium text-text">{formatToman(p.value, app.locale)} {t("prices.tomanSuffix")}</span>
        <span
          class="text-xs"
          style:color={p.up ? "var(--gain)" : "var(--holiday)"}
        >
          {p.up ? "+" : "−"}{localeNum(p.changePct, app.locale)}{app.locale === "fa" ? "٪" : "%"}
        </span>
      </span>
    {:else}
      <span class="text-muted">{prices.loading ? t("prices.loading") : t("prices.unavailable")}</span>
    {/each}

    <button
      type="button"
      onclick={() => prices.refresh(true)}
      aria-label={t("prices.refresh")}
      class="ms-auto flex size-7 shrink-0 items-center justify-center text-muted transition hover:text-text"
      class:animate-spin={prices.loading}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-4">
        <path
          d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>

  {#if list.length}
    <ul class="mt-1 divide-y divide-border">
      {#each list as occasion (occasion.title)}
        <li class="flex items-center gap-3 py-2.5">
          <span
            class="size-2.5 shrink-0 rounded-full"
            style:background={categoryColor(occasion.category)}
          ></span>
          <span class="text-sm text-text">{occasionTitle(occasion, app.locale)}</span>
          <span class="ms-auto whitespace-nowrap text-xs text-muted">
            {categoryLabel(occasion.category, app.locale)}
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="mt-4 text-center text-sm text-muted">{t("occasions.none")}</p>
  {/if}
</div>
