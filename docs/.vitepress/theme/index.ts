import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import StrongHr from '../../components/hr/StrongHr.vue'
import Thinking from '../../components/thinking/Thinking.vue'
import iconSetup from './icon'

import './global-var.css'
import './global-style.css'
import './tailwind.css'

/** @type {import('vitepress').Theme} */
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    iconSetup()

    app.component('StrongHr', StrongHr)
    app.component('Thinking', Thinking)
  },
} satisfies Theme
