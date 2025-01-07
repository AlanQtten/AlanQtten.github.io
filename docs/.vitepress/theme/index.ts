import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'

import Thinking from '../../components/thinking/Thinking.vue'
import iconSetup from './icon'

import './fonts/index.css'
import './global-var.css'
import './global-style.css'
import './tailwind.css'

/** @type {import('vitepress').Theme} */
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    iconSetup()

    app.component('Thinking', Thinking)
  },
} satisfies Theme
