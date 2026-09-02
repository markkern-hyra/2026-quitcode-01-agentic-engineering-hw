import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

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
