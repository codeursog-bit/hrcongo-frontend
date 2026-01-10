
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#0EA5E9', // Sky Blue
        secondary: '#10B981', // Green
        dark: '#1F2937',
        gray: {
          750: '#2d3748',
          850: '#1a202c',
          950: '#0d1117',
        }
      }
    },
  },
  plugins: [],
}
