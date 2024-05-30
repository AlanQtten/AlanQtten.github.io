<template>
  <span @click="collapsed = true" v-if="!collapsed" class="cursor-pointer">🤔</span>

  <span v-else>（<slot></slot>）</span>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const collapsed = ref(false)
</script>