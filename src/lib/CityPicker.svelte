<script lang="ts">
  import { tick } from "svelte";
  import { app } from "./store.svelte";
  import { searchCities, type City } from "./weather";
  import { cityMeta, normalizeCityResults } from "./city";
  import { t } from "./i18n";

  interface Props {
    onselect?: () => void;
    autofocus?: boolean;
  }

  let { onselect, autofocus = false }: Props = $props();

  let query = $state("");
  let results = $state<City[]>([]);
  let searching = $state(false);
  let highlight = $state(0);
  let input = $state<HTMLInputElement | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  const suggestions =
    app.locale === "fa"
      ? ["تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج"]
      : ["Tehran", "Mashhad", "Isfahan", "Shiraz", "Tabriz", "Karaj"];

  $effect(() => {
    if (autofocus) tick().then(() => input?.focus());
    return () => {
      clearTimeout(timer);
      controller?.abort();
    };
  });

  async function search(queryValue: string) {
    const q = queryValue.trim();
    controller?.abort();
    if (q.length < 2) {
      results = [];
      searching = false;
      return;
    }
    controller = new AbortController();
    const active = controller;
    searching = true;
    try {
      const raw = await searchCities(q, app.locale, active.signal);
      if (!active.signal.aborted) {
        results = normalizeCityResults(raw, q, app.locale);
        highlight = 0;
      }
    } catch {
      if (!active.signal.aborted) results = [];
    } finally {
      if (!active.signal.aborted) searching = false;
    }
  }

  function onInput() {
    clearTimeout(timer);
    timer = setTimeout(() => search(query), 250);
  }

  function useSuggestion(name: string) {
    query = name;
    onInput();
    input?.focus();
  }

  function choose(c: City) {
    app.setLocation({
      name: c.name,
      admin1: c.admin1,
      countryCode: c.countryCode,
      lat: c.lat,
      lng: c.lng,
      timezone: c.timezone,
    });
    onselect?.();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      highlight = (highlight + 1) % results.length;
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      highlight = (highlight - 1 + results.length) % results.length;
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      choose(results[highlight] ?? results[0]);
    }
  }
</script>

<div class="flex flex-col gap-3">
  <input
    bind:this={input}
    bind:value={query}
    oninput={onInput}
    onkeydown={onKeydown}
    placeholder={t("city.placeholder")}
    aria-label={t("city.placeholder")}
    autocomplete="off"
    class="rounded-xl bg-surface-2 px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent"
  />

  {#if query.trim().length === 0}
    <div class="flex flex-wrap gap-2">
      {#each suggestions as name (name)}
        <button
          type="button"
          onclick={() => useSuggestion(name)}
          class="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
        >
          {name}
        </button>
      {/each}
    </div>
  {/if}

  <div class="max-h-72 overflow-y-auto" aria-live="polite">
    {#if searching}
      <p class="py-3 text-center text-sm text-muted">{t("city.searching")}</p>
    {:else if results.length}
      <ul class="flex flex-col" role="listbox" aria-label={t("city.selectLabel")}>
        {#each results as c, i (c.lat + "," + c.lng + "," + c.name)}
          <li role="option" aria-selected={i === highlight}>
            <button
              type="button"
              onclick={() => choose(c)}
              onmouseenter={() => (highlight = i)}
              class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start transition
                {i === highlight ? 'bg-surface-2' : 'hover:bg-surface-2'}"
            >
              <span class="flex min-w-0 flex-col">
                <span class="truncate text-text">{c.name}</span>
                <span class="truncate text-xs text-muted">{cityMeta(c)}</span>
              </span>
              <span class="shrink-0 text-[10px] text-muted" dir="ltr">{c.countryCode}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else if query.trim().length >= 2}
      <p class="py-3 text-center text-sm text-muted">{t("city.notFound")}</p>
    {/if}
  </div>
</div>
