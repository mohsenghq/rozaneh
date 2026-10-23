export interface Wallpaper {
  thumb: string;
  full: string;
}

export interface WallpaperCategory {
  key: string;
  fa: string;
  en: string;
  items: Wallpaper[];
}

// Muted, low-saturation tones (dark + soft mid-tone) chosen for reduced eye strain
// over long viewing sessions vs. pure/high-saturation colors.
export const solidColors = [
  "#0b0b0d",
  "#111827",
  "#1e293b",
  "#3b0764",
  "#0f3d3e",
  "#7c2d12",
  "#8399a8",
  "#a3ccbe",
  "#bf9d9d",
  "#dbc09e",
];
