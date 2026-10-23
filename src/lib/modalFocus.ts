const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalFocusOptions {
  onEscape: () => void;
}

const stack: HTMLElement[] = [];
let lockCount = 0;
let inerted: HTMLElement[] = [];

function lockBackground(wrapper: HTMLElement | null) {
  lockCount += 1;
  if (lockCount > 1) return;

  inerted = Array.from(document.body.children).filter(
    (element): element is HTMLElement => element instanceof HTMLElement && element !== wrapper,
  );
  for (const element of inerted) element.setAttribute("inert", "");
}

function unlockBackground() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  for (const element of inerted) element.removeAttribute("inert");
  inerted = [];
}

/**
 * Focus management for a dialog panel: initial focus, Tab/Shift+Tab trap,
 * Escape handling, background inerting, and focus restoration on close.
 * The panel must sit inside an element marked with `data-modal-root`.
 */
export function modalFocus(node: HTMLElement, options: ModalFocusOptions) {
  const wrapper = node.closest<HTMLElement>("[data-modal-root]") ?? node.parentElement;
  const previouslyFocused =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let current = options;

  stack.push(node);
  lockBackground(wrapper);
  node.setAttribute("tabindex", "-1");
  queueMicrotask(() => {
    if (node.isConnected) node.focus();
  });

  function onkeydown(e: KeyboardEvent) {
    // Only the topmost dialog reacts when dialogs are stacked.
    if (stack[stack.length - 1] !== node) return;

    if (e.key === "Escape") {
      e.preventDefault();
      current.onEscape();
      return;
    }

    if (e.key !== "Tab") return;

    const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null || element === document.activeElement,
    );

    if (focusables.length === 0) {
      e.preventDefault();
      node.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || active === node)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  window.addEventListener("keydown", onkeydown);

  return {
    update(next: ModalFocusOptions) {
      current = next;
    },
    destroy() {
      window.removeEventListener("keydown", onkeydown);
      const index = stack.indexOf(node);
      if (index >= 0) stack.splice(index, 1);
      unlockBackground();
      node.removeAttribute("tabindex");
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    },
  };
}
