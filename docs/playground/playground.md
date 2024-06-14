<script setup>
  import { ref } from "vue"
  import Wrapper from "../components/memory-graph/Wrapper.vue";
  import MemoryGraph from "../components/memory-graph/MemoryGraph.vue";
  import DetailMode from "../components/memory-graph/DetailMode.vue";
  import ShikiCode from "../components/code/ShikiCode.vue";
  import { lr } from "../utils/renderer"
  import { Vec } from "../utils/generateStructure"

  const vec11_0 = ref({ title: 'String', body: [{ name: 'vec', value: Vec({ cap: 11, point2: 0 }) }] }) 
</script>

