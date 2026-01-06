<template>
  <div class="composer">
    <textarea
      v-model="text"
      class="input"
      placeholder="用自然语言描述你要查询的数据，例如：查询2024年广东省销售额最高的前10个客户"
      :disabled="disabled"
      @keydown.enter.exact.prevent="onSend"
      @keydown.enter.shift.exact.stop
    />
    <div class="actions">
      <button class="btn" :disabled="disabled || !canSend" @click="onSend">
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "send", text: string): void;
}>();

const text = ref("");

const canSend = computed(() => text.value.trim().length > 0);

function onSend() {
  const v = text.value.trim();
  if (!v) return;
  emit("send", v);
  text.value = "";
}
</script>

<style scoped>
.composer {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #eee;
  background: #fff;
}
.input {
  width: 100%;
  min-height: 72px;
  resize: vertical;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  outline: none;
  font-size: 14px;
  line-height: 1.4;
}
.input:disabled {
  background: #f7f7f7;
}
.actions {
  display: flex;
  justify-content: flex-end;
}
.btn {
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
