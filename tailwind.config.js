/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cm-blue': '#2B3D9C',
        'cm-red': '#E01F1F',
        'cm-yellow': '#FBD700',
        'cm-black': '#000000',
        'cm-white': '#FFFFFF',
        'light-bg-primary': '#FFFFFF',
        'light-bg-secondary': '#F5F5F5',
        'light-bg-tertiary': '#E5E5E5',
        'light-text-primary': '#121212',
        'light-text-secondary': '#333333',
        'dark-bg-primary': '#121212',
        'dark-bg-secondary': '#1F1F1F',
        'dark-bg-tertiary': '#2D2D2D',
        'dark-text-primary': '#FFFFFF',
        'dark-text-secondary': '#AAAAAA',
      },
      fontFamily: {
        'league-spartan': ['"League Spartan"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-to-b': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 