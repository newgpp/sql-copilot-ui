<template>
  <div class="clarify">
    <div class="question">{{ payload.question }}</div>
    <div v-if="payload.context_hint" class="hint">{{ payload.context_hint }}</div>

    <div class="form">
      <template v-for="field in payload.fields" :key="field.key">
        <!-- ===== single_select ===== -->
        <div v-if="field.ui === 'single_select'" class="field">
          <div class="field-title">{{ field.key }}</div>

          <div class="options" role="radiogroup" :aria-label="field.key">
            <label
              v-for="(opt, idx) in field.options ?? []"
              :key="idx"
              class="opt"
            >
              <input
                type="radio"
                :name="field.key"
                :value="stringify(opt.value)"
                v-model="answers[field.key]"
              />
              <span class="opt-label">{{ opt.label }}</span>
            </label>
          </div>

          <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
        </div>

        <!-- ===== others (MVP not supported yet) ===== -->
        <div v-else class="field unsupported">
          <div class="field-title">{{ field.key }}</div>
          <div class="unsupported-text">
            暂不支持该追问类型：<code>{{ field.ui }}</code>
          </div>
        </div>
      </template>

      <div class="actions">
        <button class="btn" :disabled="disabled || !canSubmit" @click="onSubmit">
          提交
        </button>
      </div>
    </div>

    <details class="debug">
      <summary>查看结构化追问（debug）</summary>
      <pre>{{ pretty(payload) }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import type { ClarifyResponse } from "@/types/interaction";

const props = defineProps<{
  payload: ClarifyResponse;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", userVisibleText: string, answers: Record<string, unknown>): void;
}>();

/**
 * answers 里存的值：统一用 string 存（radio v-model 方便）
 * 提交时再把它转回原始/可用表达（这里先直接用 string）
 */
const answers = reactive<Record<string, string>>({});

// 初始化默认值
for (const f of props.payload.fields) {
  if (f.ui === "single_select") {
    const def = f.default ?? (f.options && f.options[0]?.value);
    if (def !== undefined && answers[f.key] === undefined) {
      answers[f.key] = stringify(def);
    }
  }
}

const canSubmit = computed(() => {
  // MVP：要求所有 single_select 字段都选了值
  for (const f of props.payload.fields) {
    if (f.ui === "single_select") {
      if (!answers[f.key]) return false;
    }
  }
  return true;
});

function stringify(v: unknown): string {
  // 这里简单处理：mock 的 metric 就是字符串
  // 后续如果 value 是对象，可用 JSON.stringify
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

function pretty(obj: any) {
  return JSON.stringify(obj, null, 2);
}

function onSubmit() {
  // 组装提交 answers：把 string 转回 unknown（这里先原样传）
  const submitAnswers: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(answers)) {
    // 如果像 JSON（以 { 或 [ 开头），尝试 parse
    const trimmed = v.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        submitAnswers[k] = JSON.parse(trimmed);
        continue;
      } catch {
        // ignore
      }
    }
    submitAnswers[k] = v;
  }

  // 生成一段用户可读的回答文本（用于消息展示/日志）
  const parts: string[] = [];
  for (const f of props.payload.fields) {
    const val = submitAnswers[f.key];
    // 尝试把选项 label 找出来
    if (f.ui === "single_select") {
      const opt = (f.options ?? []).find((o) => stringify(o.value) === String(val));
      parts.push(`${f.key}: ${opt?.label ?? String(val)}`);
    } else {
      parts.push(`${f.key}: ${String(val)}`);
    }
  }

  const userVisibleText = `已确认：${parts.join("；")}`;
  emit("submit", userVisibleText, submitAnswers);
}
</script>

<style scoped>
.clarify {
  display: grid;
  gap: 8px;
}
.question {
  font-size: 14px;
  line-height: 1.45;
  font-weight: 600;
}
.hint {
  font-size: 12px;
  color: #6b7280;
}
.form {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: 10px;
}
.field-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}
.options {
  display: grid;
  gap: 8px;
}
.opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
}
.opt input {
  cursor: pointer;
}
.opt-label {
  font-size: 13px;
}
.field-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}
.unsupported-text {
  font-size: 12px;
  color: #b45309;
}
.actions {
  display: flex;
  justify-content: flex-end;
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
.debug summary {
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
</style>
