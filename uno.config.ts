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
      'aq.op0': 'var(--aq-op-0)',
      'aq.error': {
        900: '#ff0000',
        800: 'var(--aq-error)',
      },
    },
  },
})
