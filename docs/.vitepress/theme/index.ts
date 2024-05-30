import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import iconSetup from './icon'

import StrongHr from '../../components/hr/StrongHr.vue'
import Thinking from '../../components/thinking/Thinking.vue'

import './global-var.css'
import 'virtual:uno.css'

/** @type {import('vitepress').Theme} */
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    iconSetup()

    app.component('StrongHr', StrongHr)
    app.component('Thinking', Thinking)
  }
} satisfies Theme