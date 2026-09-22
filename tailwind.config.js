/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        honey: {
          50: '#FEF8F0',
          100: '#FDEBD2',
          200: '#FCD8A6',
          300: '#F8C279',
          400: '#F4AC4E',
          500: '#E8A048', // Primary Honey Caramel from reference image
          600: '#C97E2A',
          700: '#9E5B1A',
          800: '#733E10',
          900: '#4D2708',
          DEFAULT: '#E8A048',
        },
        sand: {
          light: '#fafafa',
          DEFAULT: '#f5f5f5', // Clean minimal product card background
          deep: '#f0f0f0',
        },
        'pill-gray': '#EEF2F6', // Inactive category and button pill background
        charcoal: '#1A1A1A',    // Dark Filter button and price badge
        coral: {
          DEFAULT: '#E8A048',
        },
        kinora: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
          black: '#000000',
          white: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Montserrat', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.2em',
        tightest: '-.04em',
      },
      borderRadius: {
        'luxury': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
