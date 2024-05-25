<template>
  <div :class="$style.wrapper">
    <slot name="code" />

    <slot name="graph" />
  </div>
</template>

<style module>
.wrapper {
  border: 2px dashed var(--vp-c-text-1);
  padding: 16px;
}

.wrapper :global(div[class*='language-']) {
  margin: 16px 0;
}
</style>