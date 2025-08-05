import { defineComponent, h } from 'vue'
import doesNotCompileSvg from './does_not_compile.svg'
import notDesiredBehaviorSvg from './not_desired_behavior.svg'
import panicSvg from './panics.svg'

interface FerrisProps {
  width?: number
}

export const DoesNotCompile = defineComponent<FerrisProps>({
  name: 'DoesNotCompile',
  render() {
    return h('img', { src: doesNotCompileSvg, width: this.$props.width ?? 100 })
  },
})

export const NotDesiredBehavior = defineComponent<FerrisProps>({
  name: 'NotDesiredBehavior',
  render() {
    return h('img', { src: notDesiredBehaviorSvg, width: this.$props.width ?? 100 })
  },
})

export const Panics = defineComponent<FerrisProps>({
  name: 'Panics',
  render() {
    return h('img', { src: panicSvg, width: this.$props.width ?? 100 })
  },
})
