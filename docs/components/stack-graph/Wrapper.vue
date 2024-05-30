<template>
  <div :class="$style.wrapper" class="border-dashed border border-aq p-4">
    <slot name="code" />

    <slot name="graph" />
  </div>
</template>

<style module>
.wrapper :global(div[class*='language-']) {
  margin: 16px 0;
}
</style>