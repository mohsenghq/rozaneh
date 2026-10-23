<script lang="ts">
  import Shortcuts from "./Shortcuts.svelte";

  interface Props {
    flow?: boolean;
  }

  let { flow = false }: Props = $props();
</script>

<div
  class="flex w-full flex-col rounded-[20px] bg-surface p-3 shadow-sm {flow ? 'h-auto' : 'h-full'}"
>
  <Shortcuts {flow} />
</div>
