<template>
  <div class="chat-window">
    <div class="header">
      <div class="title">SQL Copilot</div>
      <div class="meta">
        <span v-if="store.sessionId" class="pill">session: {{ store.sessionId }}</span>
        <button class="link" @click="onReset" :disabled="store.isLoading">重置</button>
      </div>
    </div>

    <div ref="scrollEl" class="messages">
      <div v-if="store.messages.length === 0" class="empty">
        <div class="empty-title">开始提问</div>
        <div class="empty-desc">
          示例：查询2024年广东省销售额最高的前10个客户
        </div>
      </div>

      <div v-for="m in store.messages" :key="m.id" class="msg-row" :class="m.role">
        <div class="bubble">
          <!-- 普通文本（user/system） -->
          <template v-if="m.kind === 'text'">
            <div class="text">{{ m.text }}</div>
          </template>

          <!-- clarify -->
          <template v-else-if="m.kind === 'clarify'">
            <div class="label">需要补充信息</div>
            <ClarifyRenderer
            :payload="m.payload"
            :disabled="store.isLoading"
            @submit="onClarifySubmit"
            />
          </template>


          <!-- sql -->
          <template v-else-if="m.kind === 'sql'">
            <div class="label">SQL 已生成</div>
            <div v-if="m.payload.explanation?.summary" class="text">
              {{ m.payload.explanation.summary }}
            </div>
            <details class="details" open>
              <summary>SQL</summary>
              <pre class="code">{{ m.payload.sql }}</pre>
            </details>
            <details class="details">
              <summary>explanation（结构化）</summary>
              <pre>{{ pretty(m.payload.explanation ?? {}) }}</pre>
            </details>
          </template>

          <!-- blocked -->
          <template v-else-if="m.kind === 'blocked'">
            <div class="label warn">已拦截</div>
            <div class="text">{{ m.payload.reason }}</div>
            <div v-if="m.payload.suggested_questions?.length" class="suggestions">
              <div class="suggest-title">你可以这样补充：</div>
              <ul>
                <li v-for="(q, idx) in m.payload.suggested_questions" :key="idx">
                  {{ q }}
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>

      <div v-if="store.isLoading" class="loading">
        正在生成…
      </div>

      <div v-if="store.lastError" class="error">
        {{ store.lastError }}
      </div>
    </div>

    <ChatComposer :disabled="store.isLoading" @send="onSend" />
  </div>
</template>

<script setup lang="ts">
import ClarifyRenderer from "@/components/chat/ClarifyRenderer.vue";
import { nextTick, onMounted, ref, watch } from "vue";
import ChatComposer from "@/components/chat/ChatComposer.vue";
import { useChatStore } from "@/stores/chatStore";

const store = useChatStore();
const scrollEl = ref<HTMLDivElement | null>(null);

function pretty(obj: any) {
  return JSON.stringify(obj, null, 2);
}

async function onSend(text: string) {
  await store.sendMessage(text);
}

function onReset() {
  store.resetConversation();
}

async function scrollToBottom() {
  await nextTick();
  if (!scrollEl.value) return;
  scrollEl.value.scrollTop = scrollEl.value.scrollHeight;
}

watch(
  () => store.messages.length,
  () => {
    scrollToBottom();
  }
);

onMounted(() => {
  // 给用户一个开场提示
  if (store.messages.length === 0) {
    store.pushSystemText("你好，我会把你的自然语言问题转换成 SQL。你可以从一个具体问题开始。");
  }
});

async function onClarifySubmit(userVisibleText: string, answers: Record<string, unknown>) {
  await store.submitClarify(userVisibleText, answers);
}

</script>

<style scoped>
.chat-window {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #fafafa;
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
.meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pill {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #f9fafb;
  color: #374151;
}
.link {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
}
.link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.messages {
  padding: 12px;
  overflow: auto;
  display: grid;
  gap: 10px;
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
.empty-desc {
  font-size: 13px;
}

.msg-row {
  display: flex;
}
.msg-row.user {
  justify-content: flex-end;
}
.msg-row.assistant,
.msg-row.system {
  justify-content: flex-start;
}

.bubble {
  max-width: 78%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg-row.user .bubble {
  background: #111827;
  color: #fff;
  border-color: #111827;
}
.msg-row.system .bubble {
  background: #f3f4f6;
  color: #374151;
}

.label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111827;
}
.label.warn {
  color: #b45309;
}
.text {
  font-size: 14px;
  line-height: 1.45;
}

.details {
  margin-top: 8px;
}
.details summary {
  cursor: pointer;
  font-size: 12px;
  color: #2563eb;
}
pre {
  margin: 8px 0 0;
  padding: 10px;
  border-radius: 10px;
  background: #0b1020;
  color: #e5e7eb;
  overflow: auto;
  font-size: 12px;
}
pre.code {
  background: #0b1020;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.suggestions {
  margin-top: 8px;
  font-size: 13px;
}
.suggest-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.loading {
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  padding: 6px 0;
}
.error {
  text-align: center;
  font-size: 13px;
  color: #b91c1c;
  padding: 6px 0;
}
</style>
