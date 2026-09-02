import type { Metadata, Viewport } from 'next';
import {
  getComponentChunkLinks,
  getFontLinks,
  getIconLinks,
  getMetaTagsAndIconLinks,
} from '@porsche-design-system/components-react/partials';
import { PorscheDesignSystemProvider, PToast } from '@porsche-design-system/components-react/ssr';
import { COLOR_SCHEME_BOOTSTRAP } from '@/lib/colorSchemeStore';
import './globals.css';

const APP_TITLE = 'Porsche Chess';

/**
 * `format: 'js'` returns a Next-shaped metadata object
 * ({ themeColor, appleWebApp, icons, manifest, openGraph }). `themeColor` has to
 * live on the `viewport` export since Next 13.4, otherwise every build logs
 * "Unsupported metadata themeColor is configured in metadata export".
 * The partial is server-only by construction, so module scope of a Server
 * Component is exactly the right place to call it.
 */
const { themeColor, openGraph, ...pdsMetadata } = getMetaTagsAndIconLinks({
  appTitle: APP_TITLE,
  format: 'js',
});

export const viewport: Viewport = {
  themeColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  ...pdsMetadata,
  // The partial emits `openGraph.image` (singular); Next's Metadata schema
  // expects `images`. Remap rather than dropping the Porsche OG image.
  openGraph: { images: [openGraph.image], title: APP_TITLE },
  title: APP_TITLE,
  description:
    'A fully playable chess game — local two-player or against a bot — built with Next.js and the Porsche Design System.',
};

/** Only the chunks actually rendered. An invalid name throws at build time. */
const CHUNKS = [
  'canvas',
  'heading',
  'text',
  'button',
  'button-pure',
  'icon',
  'tag',
  'table',
  'segmented-control',
  'switch',
  'modal',
  'inline-notification',
  'spinner',
  'divider',
  'scroller',
  'toast',
] as const;

/** PCanvas renders its own sidebar/close buttons, so preload those icons too. */
const ICONS = [
  'reset',
  'return',
  'switch',
  'theme',
  'sun',
  'moon',
  'close',
  'check',
  'sidebar',
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: ColorSchemeProvider swaps this class after mount
    <html lang="en" className="scheme-light-dark" suppressHydrationWarning>
      <head>
        {/* 'semi-bold' is hyphenated here — the partial throws on 'semibold' */}
        {getFontLinks({ subset: 'latin', weights: ['regular', 'semi-bold', 'bold'], format: 'jsx' })}
        {getComponentChunkLinks({ components: [...CHUNKS], format: 'jsx' })}
        {getIconLinks({ icons: [...ICONS], format: 'jsx' })}
        {/* Applies a stored theme before first paint, so a dark-mode user
            never sees a light flash. Must run blocking, hence inline. */}
        <script dangerouslySetInnerHTML={{ __html: COLOR_SCHEME_BOOTSTRAP }} />
      </head>
      <body>
        <PorscheDesignSystemProvider>
          {children}
          {/* role="status" — only announces messages added after mount, so it
              must be rendered once, high in the tree, not created on demand. */}
          <PToast />
        </PorscheDesignSystemProvider>
      </body>
    </html>
  );
}
