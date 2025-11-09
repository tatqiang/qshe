/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F9FA',
          100: '#D9F0F2',
          200: '#BADFE7',
          300: '#6FB3B8',
          400: '#52A1A7',
          500: '#388087',
          600: '#2D6970',
          700: '#234F54',
          800: '#1A3B3F',
          900: '#122A2D',
        },
        accent: {
          50: '#F0FAF4',
          100: '#E1F5E9',
          200: '#C2EDCE',
          300: '#A3E5B4',
          400: '#84DD9A',
          500: '#65D580',
          600: '#4DC066',
          700: '#3A9B4F',
          800: '#2C7639',
          900: '#1E5127',
        },
        background: {
          light: '#F6F6F2',
          DEFAULT: '#FFFFFF',
        }
      },
    },
  },
  plugins: [],
}
