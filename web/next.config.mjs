import path from "node:path";
import { fileURLToPath } from "node:url";
import nextPwa from "next-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

const withPwa = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  // On désactive le SW en dev pour éviter les caches trompeurs.
  disable: process.env.NODE_ENV === "development",
});

export default withPwa(nextConfig);
