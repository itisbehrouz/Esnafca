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
        ios: {
          bg: "#F2F2F7", // Apple Grouped Background
          card: "#FFFFFF",
          secondaryBg: "#E5E5EA",
          tertiaryBg: "#F2F2F7",
          label: "#000000",
          secondaryLabel: "#8E8E93",
          tertiaryLabel: "#C7C7CC",
          separator: "rgba(60, 60, 67, 0.12)",
          blue: "#007AFF",
          green: "#34C759",
          orange: "#FF9500",
          amber: "#FFCC00",
        },
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
