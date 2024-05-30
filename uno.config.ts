import { defineConfig } from 'unocss'

export default defineConfig({
  content: {
    filesystem: [
      '.vitepress/transformers/*.ts',
    ],
  },
  theme: {
    colors: {
      'aq': 'var(--aq)',
      'aq.error': {
        900: '#ff0000',
        800: 'var(--aq-error)',
      },
    },
  },
})
