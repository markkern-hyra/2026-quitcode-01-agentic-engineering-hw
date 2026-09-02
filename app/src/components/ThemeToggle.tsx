'use client';

import { PButtonPure } from '@porsche-design-system/components-react/ssr';
import { useColorScheme } from '@/hooks/useColorScheme';
import { COLOR_SCHEME_META, nextColorScheme } from '@/lib/colorScheme';

export function ThemeToggle() {
  const { colorScheme, cycleColorScheme } = useColorScheme();
  const current = COLOR_SCHEME_META[colorScheme];
  const upcoming = COLOR_SCHEME_META[nextColorScheme(colorScheme)];

  return (
    <PButtonPure
      type="button"
      icon={current.icon}
      hideLabel={true}
      onClick={cycleColorScheme}
      aria={{ 'aria-label': `${current.label}. Activate for ${upcoming.label.toLowerCase()}.` }}
    >
      {/* #4684: a real string child, never null — splitChildren crashes on bare null */}
      {current.label}
    </PButtonPure>
  );
}
