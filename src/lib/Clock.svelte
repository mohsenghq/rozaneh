<script lang="ts">
  import { app } from "./store.svelte";
  import ClockFace from "./ClockFace.svelte";
</script>

<div class="flex h-full w-full items-center justify-center">
  <ClockFace face={app.clockFace} />
</div>
