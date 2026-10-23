import { storage } from "wxt/utils/storage";

export const onboardedItem = storage.defineItem<boolean>("local:onboarded", {
  fallback: false,
});

export async function hasOnboarded(): Promise<boolean> {
  try {
    return await onboardedItem.getValue();
  } catch {
    return false;
  }
}

export async function setOnboarded(value: boolean): Promise<void> {
  await onboardedItem.setValue(value).catch(() => {});
}
