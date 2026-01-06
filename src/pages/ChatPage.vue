<template>
  <div class="layout">
    <div class="left">
      <ChatWindow />
    </div>
    <div class="right">
      <SqlPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatWindow from "@/components/chat/ChatWindow.vue";
import SqlPanel from "@/components/sql/SqlPanel.vue";
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;
  height: 100vh;
  padding: 12px;
  box-sizing: border-box;
}
.left,
.right {
  border: 1px solid #eee;
  border-radius: 10px;
  overflow: hidden;
  min-height: 0;
}
</style>
