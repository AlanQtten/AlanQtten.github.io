import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import iconSetup from './icon'

export default {
  extends: DefaultTheme,
  enhanceApp() {
    iconSetup()
  }
} satisfies Theme