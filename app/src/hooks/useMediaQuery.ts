'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribing to `matchMedia` is what useSyncExternalStore is for: reading it
 * in an effect and calling setState would be a cascading render, and would only
 * sample the viewport once instead of tracking it.
 *
 * The server snapshot is always `false`, so the first client render matches the
 * markup and then settles to the real value.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
