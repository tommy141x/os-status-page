/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Use "export" for static site generation (SSG) and exporting
  distDir: "landing/out", // Directory where the build output will go
  assetPrefix: "/os-status-page", // GitHub repository name
  basePath: "/os-status-page", // GitHub repository name
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
