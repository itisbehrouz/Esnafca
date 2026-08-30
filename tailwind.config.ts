import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#E05A36",
          hover: "#C94C2B",
          light: "#FFF3EF",
          dark: "#1C1C1E",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      boxShadow: {
        'ios-card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
        'ios-sheet': '0 -4px 24px rgba(0, 0, 0, 0.12)',
        'ios-floating': '0 8px 24px -4px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'ios': '14px',
        'ios-card': '18px',
        'ios-sheet': '28px',
      }
    },
  },
  plugins: [],
};
export default config;
