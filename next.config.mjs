/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so Next doesn't get confused by stray lockfiles
  // elsewhere on the machine (e.g. ~/pnpm-lock.yaml).
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
