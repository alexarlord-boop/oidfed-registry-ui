import { serve } from "bun";
import index from "./index.html";
import { hello } from "./api/hello";
import { dashboard } from "./api/dashboard";
import { test } from "./api/test";

const server = serve({
  routes: {
    // API routes (must come before catch-all)
    ...hello,
    ...dashboard,
    ...test,
    
    // Serve index.html for all unmatched routes (SPA fallback)
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
