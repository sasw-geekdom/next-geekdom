import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Luma event cover art, served off their CDN.
      { protocol: "https", hostname: "images.lumacdn.com" },
      { protocol: "https", hostname: "cdn.lu.ma" },
      // Firebase Storage (brand assets, member media).
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      // Google account avatars, shown in the admin shell.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    // Paths from the coworking-era geekdom.com. `permanent: true` is a 308.
    //
    // CAUTION: this matcher is case-INSENSITIVE, so a source that differs from
    // its destination only by case matches its own destination and 308s in a
    // loop forever. Every source below differs by more than case; case-only
    // rules belong in proxy.ts, which compares exactly.
    return [
      // Coworking is sunsetting. Anyone landing on the old membership or
      // pricing pages should get the club's story, not a 404 — /membership is
      // the page that explains what replaced them.
      { source: "/join", destination: "/membership", permanent: true },
      { source: "/pricing", destination: "/membership", permanent: true },
      { source: "/coworking", destination: "/membership", permanent: true },
      { source: "/why-geekdom", destination: "/membership", permanent: true },
      { source: "/tour", destination: "/membership", permanent: true },

      // Programs and events now run through the club calendar.
      { source: "/programs", destination: "/events", permanent: true },
      { source: "/programs/:slug*", destination: "/events", permanent: true },
      { source: "/incubator", destination: "/events", permanent: true },

      // The announcement itself is the "about us" of this moment.
      { source: "/about-us", destination: "/whats-changing", permanent: true },
      { source: "/press", destination: "/whats-changing", permanent: true },

      // NOT redirected, on purpose: the old blog archive and its ~dozens of
      // posts. None has a counterpart here, and pointing them all at the
      // homepage is what Google reads as a soft 404. A clean 404 is honest.
    ];
  },
};

// withBotId injects the client-side challenge script and the proxy rewrites
// BotID needs. Without this wrapper, `checkBotId()` has nothing to verify
// against and the protection silently does nothing.
export default withBotId(nextConfig);
