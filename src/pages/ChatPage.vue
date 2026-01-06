<template>
  <div class="layout">
    <div class="left">Chat Area</div>
    <div class="right">SQL Area</div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  height: 100%;
}
.left, .right {
  border: 1px solid #eee;
}
</style>
