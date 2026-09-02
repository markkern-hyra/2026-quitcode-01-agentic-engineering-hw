/**
 * PDS v4 theming is pure CSS: `color-scheme` + `light-dark()`, driven by a class
 * on <html>. There is no `theme` prop on the provider or on any component.
 */
export const COLOR_SCHEMES = ['scheme-light-dark', 'scheme-light', 'scheme-dark'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const COLOR_SCHEME_STORAGE_KEY = 'porsche-chess:color-scheme';
export const DEFAULT_COLOR_SCHEME: ColorScheme = 'scheme-light-dark';

export function isColorScheme(value: unknown): value is ColorScheme {
  return typeof value === 'string' && (COLOR_SCHEMES as readonly string[]).includes(value);
}

/** Label + PDS icon for the toggle. `settings`/`crown`/`undo` do not exist in v4. */
export const COLOR_SCHEME_META: Record<ColorScheme, { label: string; icon: 'theme' | 'sun' | 'moon' }> = {
  'scheme-light-dark': { label: 'System theme', icon: 'theme' },
  'scheme-light': { label: 'Light theme', icon: 'sun' },
  'scheme-dark': { label: 'Dark theme', icon: 'moon' },
};

export function nextColorScheme(current: ColorScheme): ColorScheme {
  const i = COLOR_SCHEMES.indexOf(current);
  return COLOR_SCHEMES[(i + 1) % COLOR_SCHEMES.length];
}
