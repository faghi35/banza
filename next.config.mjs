/** @type {import('next').NextConfig} */

// ============================================================
// Banza AI Frontend — Configuration de production
// ------------------------------------------------------------
// PROXY API : le navigateur ne parle JAMAIS directement au
// backend PHP. Toutes les requêtes /api/... sont réécrites par
// Next.js (rewrites) vers le backend via BACKEND_ORIGIN :
//   - Dev  : http://localhost/banza-ai-api  (Apache/XAMPP)
//   - Prod : http://banza-ai.hopetrade-rdc.com
// Surcharge possible avec la variable BACKEND_ORIGIN (Vercel).
// ============================================================

const BACKEND_ORIGIN = (
  process.env.BACKEND_ORIGIN ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost/banza-ai-api"
    : "http://banza-ai.hopetrade-rdc.com")
).replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
