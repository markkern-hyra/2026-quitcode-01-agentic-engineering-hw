'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { nextColorScheme, type ColorScheme } from '@/lib/colorScheme';
import {
  getServerSnapshot,
  getSnapshot,
  setColorScheme,
  subscribe,
} from '@/lib/colorSchemeStore';

export function useColorScheme(): {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  cycleColorScheme: () => void;
} {
  const colorScheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const cycleColorScheme = useCallback(() => {
    setColorScheme(nextColorScheme(getSnapshot()));
  }, []);
  return { colorScheme, setColorScheme, cycleColorScheme };
}
