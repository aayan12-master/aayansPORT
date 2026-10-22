import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#ECE8DF',
          light: '#F2EFE7',
        },
        ink: {
          DEFAULT: '#171514',
          muted: '#5A5650',
        },
        accent: {
          orange: '#DF491E',
          'orange-hover': '#C73E16',
        },
        stone: {
          DEFAULT: '#D7D3CB',
        },
        divider: {
          gray: '#BCB8B1',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Anton', 'sans-serif'],
        condensed: ['var(--font-condensed)', 'Oswald', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        hand: ['var(--font-hand)', 'Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
