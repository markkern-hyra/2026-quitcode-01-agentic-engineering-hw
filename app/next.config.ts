import type { NextConfig } from 'next';

/**
 * GitHub Pages serves this repo from a subpath
 * (https://<user>.github.io/<repo>/), so the base path has to be baked into the
 * build. It is opt-in via an env var rather than always-on: `npm run dev` and a
 * plain `npm run build` must keep working at the root, and the graded build is
 * the plain one.
 */
const pagesBasePath = process.env.PAGES_BASE_PATH;

const nextConfig: NextConfig = {
  reactStrictMode: true,

  ...(pagesBasePath
    ? {
        // A fully static export — there is no server-side anything in this app.
        output: 'export',
        basePath: pagesBasePath,
        assetPrefix: pagesBasePath,
        // Pages has no rewrite layer, so emit /path/index.html.
        trailingSlash: true,
      }
    : {}),

  experimental: {
    /**
     * The Porsche Design System's whole palette is built on CSS `light-dark()`.
     * Lightning CSS lowers `light-dark()` to a single static value based on the
     * browserslist targets, which collapses both schemes into one and silently
     * breaks dark mode. `lightningCssFeatures.exclude` needs `useLightningcss`.
     *
     * https://github.com/porsche-design-system/porsche-design-system/issues/4257
     */
    useLightningcss: true,
    lightningCssFeatures: { exclude: ['light-dark'] },
  },
};

export default nextConfig;
