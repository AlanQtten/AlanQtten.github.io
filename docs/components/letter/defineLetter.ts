import { defineComponent, h } from 'vue'
import Letter from './Letter.vue'

function defineLetter(letter: any, themeColor: string) {
  return defineComponent({
    render() {
      return h(Letter, { themeColor }, {
        default: () => letter,
      })
    },
  })
}

const R = defineLetter('R', '#ff9500')
const W = defineLetter('W', '#399cf2')
const O = defineLetter('O', 'var(--aq-error)')
const F = defineLetter('F', '#5ed100')

export { F, O, R, W }
