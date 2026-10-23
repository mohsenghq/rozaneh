<script lang="ts">
  import { app } from "./store.svelte";
  import { weather } from "./weather.svelte.js";
  import { localeNum } from "./calendar";
  import { t } from "./i18n";
  import WeatherIcon from "./WeatherIcon.svelte";
  import Modal from "./Modal.svelte";
  import CityPicker from "./CityPicker.svelte";
  import PrayerTimes from "./PrayerTimes.svelte";

  let picking = $state(false);

  $effect(() => {
    app.location.lat;
    app.location.lng;
    app.locale;
    weather.refresh();
  });

  function toUnit(c: number): string {
    return localeNum(app.tempUnit === "fahrenheit" ? Math.round((c * 9) / 5 + 32) : c, app.locale);
  }

  const data = $derived(weather.data);
  const cityLabel = $derived(
    app.location.admin1
      ? `${app.location.name} · ${app.location.admin1}`
      : app.location.name,
  );
</script>

<div class="@container relative flex min-h-0 min-w-0 w-full flex-1 flex-col">
  <button
    type="button"
    onclick={() => (picking = true)}
    class="absolute -top-3 end-0 flex min-h-7 items-center px-1 text-[11px] leading-none text-muted underline underline-offset-2 transition hover:text-text"
  >
    {cityLabel}
  </button>

  {#if app.showPrayerTimes}
    <div class="absolute -top-1 start-0 text-xs">
      <PrayerTimes />
    </div>
  {/if}

  {#if data}
    <div class="flex flex-1 items-end justify-between gap-2 pt-2">
      <div class="flex flex-col items-center justify-end">
        <WeatherIcon
          condition={data.condition}
          isDay={data.isDay}
          class="size-14 shrink-0 @min-[280px]:size-16"
        />
        <span class="max-w-32 truncate text-center text-sm text-text">{data.label}</span>
      </div>

      <div class="flex flex-col items-center justify-end gap-3">
        <div class="flex items-center gap-3">
          <div class="flex flex-col items-end justify-end gap-1">
            <span class="text-sm text-muted">{toUnit(data.high)}<span class="font-mono" aria-hidden="true">°</span></span>
            <span class="text-sm text-muted">{toUnit(data.low)}<span class="font-mono" aria-hidden="true">°</span></span>
          </div>
          <span
            class="inline-flex text-4xl font-normal leading-none tracking-tighter text-text rtl:flex-row-reverse
              @min-[240px]:text-5xl @min-[300px]:text-6xl"
          >
            {toUnit(data.temp)}<span class="-mt-1 text-2xl font-light @min-[240px]:text-3xl @min-[300px]:text-4xl" aria-hidden="true">°</span>
          </span>
        </div>
        <span class="block text-center text-xs leading-none text-muted">{data.message}</span>
      </div>
    </div>
  {:else}
    <div class="flex h-[104px] items-center justify-center text-sm text-muted">
      {weather.loading ? t("weather.loading") : t("weather.unavailable")}
    </div>
  {/if}
</div>

{#if picking}
  <Modal title={t("city.selectLabel")} onclose={() => (picking = false)}>
    <CityPicker autofocus onselect={() => (picking = false)} />
  </Modal>
{/if}
