/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow both api subdomain and main domain
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.muhsinzade.com",
        // Allow all paths from api subdomain
      },
      {
        protocol: "https",
        hostname: "muhsinzade.com",
        // Allow all paths from main domain
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
      },
      {
        protocol: "http",
        hostname: "backend",
        port: "4000",
      },
    ],
    // Allow unoptimized images for external domains if needed
    unoptimized: false,
  },
};

export default nextConfig;
