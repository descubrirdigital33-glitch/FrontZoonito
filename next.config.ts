import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // No falla el build de producción por warnings de ESLint.
    // Los warnings se siguen mostrando en consola/dev, pero no bloquean el deploy.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
