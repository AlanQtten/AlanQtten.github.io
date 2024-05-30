<script setup lang="ts">
import { ref } from 'vue'

const collapsed = ref(false)
</script>

<template>
  <span v-if="!collapsed" class="cursor-pointer" @click="collapsed = true">🤔</span>

  <span v-else>（<slot />）</span>
</template>
