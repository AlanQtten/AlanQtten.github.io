import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import shikiRehype from "@shikijs/rehype";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        providerImportSource: "@mdx-js/react",
        /* jsxImportSource: …, otherOptions… */
        rehypePlugins: [
          [
            shikiRehype,
            {
              themes: {
                dark: "github-dark",
                light: "github-light",
              },
            },
          ],
        ],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ],
});
