// Path: NextFrontend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Critical: static export for embedding in MAUI WebView
  output: 'export',

  // Absolute paths — virtual host https://hrm.app/ handles this
  basePath: '',
  assetPrefix: '',

  // Disable image optimization (no server)
  images: {
    unoptimized: true,
  },

  // Create dashboard/index.html etc.
  trailingSlash: true,
};

export default nextConfig;
