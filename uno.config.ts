import { defineConfig, presetIcons } from 'unocss'
import presetUno from '@unocss/preset-uno'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
  ],
  content: {
    filesystem: [
      '.vitepress/**/*.ts',
    ],
  },
  theme: {
    colors: {
      'aq': 'var(--aq)',
      'aq.fill': 'var(--aq-fill)',
      'aq.error': {
        900: '#ff0000',
        800: 'var(--aq-error)',
      },
    },
  },
})
