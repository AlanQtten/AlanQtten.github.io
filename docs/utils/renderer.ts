import type { Component } from 'vue'
import { h } from 'vue'
import LetterTable from '../components/letter/LetterTable.vue'

function createRenderer(comp: Component) {
  return (props: any) => {
    return h(comp, props)
  }
}

export const lr = createRenderer(LetterTable)
