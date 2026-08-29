import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "#f4efe6",
        ink: "#1f1a14",
        muted: "#6d6458",
        line: "rgba(80, 58, 32, 0.12)",
        accent: "#c45c26",
        "accent-dark": "#9a3f12",
        sage: "#3f6b55",
      },
      fontFamily: {
        sans: ['"IBM Plex Sans KR"', "sans-serif"],
        serif: ['"Song Myung"', "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
