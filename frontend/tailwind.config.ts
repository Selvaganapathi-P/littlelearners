import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#FF6B9D',
          orange: '#FFB347',
          purple: '#7C3AED',
          cyan: '#06B6D4',
          yellow: '#FCD34D',
          green: '#10B981',
        },
        lkg: {
          primary: '#FF6B9D',
          secondary: '#FFB347',
          bg: '#FFF5F8',
        },
        ukg: {
          primary: '#7C3AED',
          secondary: '#06B6D4',
          bg: '#F5F3FF',
        },
      },
      fontFamily: {
        display: ['var(--font-fredoka)', 'cursive'],
        body: ['var(--font-nunito)', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
