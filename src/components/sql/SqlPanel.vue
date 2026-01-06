<template>
  <div class="panel">
    <div class="header">
      <div class="title">SQL</div>
      <div class="actions">
        <button class="btn" :disabled="!sqlText" @click="copySql">
          复制 SQL
        </button>
      </div>
    </div>

    <div class="body">
      <div v-if="!lastSql" class="empty">
        <div class="empty-title">暂无 SQL</div>
        <div class="empty-desc">在左侧输入问题，生成的 SQL 会显示在这里。</div>
      </div>

      <template v-else>
        <div class="summary" v-if="lastSql.explanation?.summary">
          {{ lastSql.explanation.summary }}
        </div>

        <div class="meta">
          <span class="pill">dialect: {{ lastSql.dialect }}</span>
          <span class="pill">session: {{ lastSql.session_id }}</span>
          <span v-if="lastSql.validation?.status" class="pill">
            validation: {{ lastSql.validation.status }}
          </span>
        </div>

        <div v-if="lastSql.validation?.warnings?.length" class="warnings">
          <div class="warn-title">提示</div>
          <ul>
            <li v-for="(w, idx) in lastSql.validation.warnings" :key="idx">
              <b>{{ w.code }}:</b> {{ w.message }}
            </li>
          </ul>
        </div>

        <div class="code-wrap">
          <pre class="code"><code>{{ sqlText }}</code></pre>
        </div>

        <details class="details">
          <summary>explanation（结构化）</summary>
          <pre class="json">{{ pretty(lastSql.explanation ?? {}) }}</pre>
        </details>
      </template>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useChatStore } from "@/stores/chatStore";

const store = useChatStore();
const lastSql = computed(() => store.lastSql);

const sqlText = computed(() => lastSql.value?.sql ?? "");
const toast = ref<string | null>(null);

function pretty(obj: any) {
  return JSON.stringify(obj, null, 2);
}

async function copySql() {
  if (!sqlText.value) return;
  await navigator.clipboard.writeText(sqlText.value);
  toast.value = "已复制到剪贴板";
  setTimeout(() => (toast.value = null), 1200);
}
</script>

<style scoped>
.panel {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  background: #fff;
  position: relative;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  background: #fff;
}
.title {
  font-weight: 600;
}
.actions {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 8px 12px;
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
.body {
  padding: 12px;
  overflow: auto;
}
.empty {
  padding: 24px 10px;
  text-align: center;
  color: #6b7280;
}
.empty-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
}
.summary {
  font-size: 14px;
  margin-bottom: 10px;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.pill {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #f9fafb;
  color: #374151;
}
.warnings {
  border: 1px solid #fde68a;
  background: #fffbeb;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
  color: #92400e;
}
.warn-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.code-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}
pre.code {
  margin: 0;
  padding: 12px;
  background: #0b1020;
  color: #e5e7eb;
  overflow: auto;
  font-size: 12px;
  line-height: 1.45;
}
.details {
  margin-top: 10px;
}
.details summary {
  cursor: pointer;
  font-size: 12px;
  color: #2563eb;
}
pre.json {
  margin: 8px 0 0;
  padding: 12px;
  border-radius: 10px;
  background: #111827;
  color: #e5e7eb;
  overflow: auto;
  font-size: 12px;
}

.toast {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: #111827;
  color: #fff;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
}
</style>
