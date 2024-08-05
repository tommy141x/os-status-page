import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import bun from "@nurodev/astro-bun";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  adapter: bun(),
  output: "server",
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
