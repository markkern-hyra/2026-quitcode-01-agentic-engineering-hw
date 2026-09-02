import { PButton, PHeading, PText } from '@porsche-design-system/components-react/ssr';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main style={{ padding: 'var(--p-spacing-fluid-lg)' }}>
      <PHeading tag="h1" size="xl">
        Porsche Chess
      </PHeading>
      <PText color="contrast-high">Design system wiring check.</PText>
      <PButton type="button" icon="reset">
        New game
      </PButton>
      <ThemeToggle />
    </main>
  );
}
