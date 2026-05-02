import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        anu: {
          navy: "#1C2340",
          navyDark: "#141A31",
          gold: "#C4714A",
          goldLight: "#D4876A",
          cream: "#F5F0E8",
        },
        terra: "#C4714A",
        terraLight: "#D4876A",
        sage: "#7A9E8A",
        sageDark: "#5E8A75",
        muted: "#8A8278",
        border: "#E0D8CC",
        "soft-red": "#F5D5D0",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-shippori)", "Shippori Mincho", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
