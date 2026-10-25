<script lang="ts">
  import Shortcuts from "./Shortcuts.svelte";
  import { SHORTCUT_CARD_H } from "./shortcutLayout";

  interface Props {
    flow?: boolean;
  }

  let { flow = false }: Props = $props();
</script>

<div
  class="flex w-full flex-col rounded-[20px] bg-surface p-2 shadow-sm"
  style:height={flow ? undefined : `${SHORTCUT_CARD_H}px`}
>
  <Shortcuts {flow} />
</div>
