/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["api.muhsinzade.com", "localhost", "127.0.0.1", "images.unsplash.com"],
    remotePatterns: [
      { protocol: "https", hostname: "api.muhsinzade.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
};

export default nextConfig;
