<script lang="ts">
  import { t } from "./i18n";

  interface Props {
    checked: boolean;
    onchange: (value: boolean) => void;
    label?: string;
    disabled?: boolean;
  }

  let { checked, onchange, label, disabled = false }: Props = $props();
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label ?? t("toggle.defaultLabel")}
  {disabled}
  onclick={() => onchange(!checked)}
  class="flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition disabled:opacity-40
    {checked ? 'justify-end bg-accent' : 'justify-start bg-surface-2'}"
>
  <span class="size-5 rounded-full bg-white shadow"></span>
</button>
