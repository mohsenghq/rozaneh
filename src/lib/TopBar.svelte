<script lang="ts">
  import { t } from "./i18n";

  interface Props {
    onsettings?: () => void;
  }

  let { onsettings }: Props = $props();
</script>

<header class="flex items-center justify-end gap-3 px-6 pt-6 sm:px-10">
  <button
    type="button"
    onclick={onsettings}
    aria-label={t("settings.title")}
    title={t("settings.title")}
    class="flex size-11 items-center justify-center rounded-full bg-surface text-muted shadow-[0_6px_20px_var(--shadow)] transition hover:text-text"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
      <path d="M4 8h9M17 8h3M4 16h3M11 16h9" stroke-linecap="round" />
      <circle cx="15" cy="8" r="2.2" />
      <circle cx="9" cy="16" r="2.2" />
    </svg>
  </button>
</header>
