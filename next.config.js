/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  // Disable React strict mode for compatibility with the terminal
  reactStrictMode: false,
  // Ensure Next.js doesn't try to handle routing for Tauri
  trailingSlash: false,
  // We're using static export for Tauri
};

module.exports = nextConfig;
