/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'blumelli': 'var(--blumelli)'
      }
    },
  },
  plugins: [
    PrimeUI
  ],
}

