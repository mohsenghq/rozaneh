<script lang="ts">
  import { directFaviconUrl, isSafeIconUrl } from "./search";
  import { getCachedFavicon, resolveAndCacheBrowserFavicon } from "./faviconCache";

  interface Props {
    url: string;
    icon?: string;
    title: string;
    px?: number;
  }

  let { url, icon = "", title, px = 24 }: Props = $props();

  let src = $state("");

  const letter = $derived(((title || url).trim().charAt(0) || "?").toUpperCase());

  interface LoadedImage {
    src: string;
    width: number;
    height: number;
  }

  function loadImage(source: string): Promise<LoadedImage | null> {
    if (!source) return Promise.resolve(null);
    return new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () =>
        resolve({
          src: source,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      image.onerror = () => resolve(null);
      image.src = source;
    });
  }

  /**
   * Icons are resolved locally first: the browser's own favicon store (Chrome
   * `_favicon`, cached in extension storage). If that has nothing, the
   * shortcut's own `/favicon.ico` is requested. No shortcut hostname is sent to
   * a third-party favicon service.
   */
  $effect(() => {
    url;
    icon;
    px;

    if (icon && isSafeIconUrl(icon)) {
      src = icon;
      return;
    }

    let cancelled = false;
    src = "";

    (async () => {
      const cached = await getCachedFavicon(url, px);
      if (cancelled) return;
      if (cached) {
        src = cached;
        return;
      }

      const local = await resolveAndCacheBrowserFavicon(url, px);
      if (cancelled) return;
      if (local) {
        src = local;
        return;
      }

      const direct = directFaviconUrl(url);
      if (!direct) return;
      const image = await loadImage(direct);
      if (cancelled) return;
      src = image?.src ?? "";
    })();

    return () => {
      cancelled = true;
    };
  });
</script>

{#if src}
  <img
    {src}
    alt=""
    class="rounded object-contain"
    style:width={`${px}px`}
    style:height={`${px}px`}
    onerror={() => (src = "")}
  />
{:else}
  <span
    class="flex items-center justify-center rounded bg-accent/15 font-semibold text-accent"
    style:width={`${px}px`}
    style:height={`${px}px`}
    style:font-size={`${Math.round(px * 0.45)}px`}
  >
    {letter}
  </span>
{/if}
