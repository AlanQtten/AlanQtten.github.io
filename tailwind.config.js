const { addIconSelectors } = require('@iconify/tailwind')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './docs/**/*.{js,ts,vue,md}',
  ],
  theme: {
    colors: {
      'aq': 'var(--aq)',
      'aq.fill': 'var(--aq-fill)',
      'aq.error': {
        900: '#ff0000',
        800: 'var(--aq-error)',
      },
      'transparent': 'transparent',
    },
  },
  plugins: [
    addIconSelectors(['material-symbols']),
  ],
}
