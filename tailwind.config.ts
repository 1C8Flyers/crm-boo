import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E4A62',
        accent: '#A38B5C',
        background: '#F0F4F7',
        surface: '#ffffff',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
        'pt-sans': ['var(--font-pt-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;