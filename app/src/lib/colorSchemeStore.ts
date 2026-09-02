'use client';

import {
  COLOR_SCHEMES,
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_COLOR_SCHEME,
  isColorScheme,
  type ColorScheme,
} from '@/lib/colorScheme';

/**
 * An external store rather than `useState` + `useEffect`, for two reasons:
 * the source of truth genuinely lives outside React (a class on <html>, mirrored
 * to localStorage), and reading it in an effect would mean a setState-in-effect
 * round trip. `useSyncExternalStore` reads it during render on the client and
 * falls back to the SSR default on the server.
 */
const listeners = new Set<() => void>();
let current: ColorScheme | null = null;

function read(): ColorScheme {
  if (current !== null) return current;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  } catch {
    // private mode or blocked site data — fall back to following the OS
  }
  current = isColorScheme(stored) ? stored : DEFAULT_COLOR_SCHEME;
  return current;
}

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function getSnapshot(): ColorScheme {
  return read();
}

export function getServerSnapshot(): ColorScheme {
  return DEFAULT_COLOR_SCHEME;
}

export function setColorScheme(next: ColorScheme): void {
  current = next;
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next);
  } catch {
    // non-fatal: the class below still applies for this session
  }
  const root = document.documentElement;
  root.classList.remove(...COLOR_SCHEMES);
  root.classList.add(next);
  for (const listener of listeners) listener();
}

/**
 * Runs before first paint, inlined in <head>, so a stored preference never
 * flashes the default scheme. Kept in sync with `setColorScheme` above.
 */
export const COLOR_SCHEME_BOOTSTRAP = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  COLOR_SCHEME_STORAGE_KEY,
)});var a=${JSON.stringify(COLOR_SCHEMES)};if(a.indexOf(s)>-1){var r=document.documentElement;r.classList.remove.apply(r.classList,a);r.classList.add(s);}}catch(e){}})();`;
