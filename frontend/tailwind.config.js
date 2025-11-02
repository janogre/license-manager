/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NEAS Primary Color - Pine Green
        primary: {
          50: '#e6f2ef',
          100: '#cce6df',
          200: '#99ccbe',
          300: '#66b39e',
          400: '#33997d',
          500: '#003d2d', // Pine Green
          600: '#003124',
          700: '#00251b',
          800: '#001812',
          900: '#000c09',
        },
        // NEAS Brand Colors
        'neas-pine': '#003d2d',
        'neas-moss': '#95c672',
        'neas-sunlight': '#f1e967',
        'neas-petal': '#eebbca',
        'neas-mid-grey': '#cccccc',
        'neas-light-grey': '#efefef',
      },
    },
  },
  plugins: [],
}
