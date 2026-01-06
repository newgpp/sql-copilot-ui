// src/stores/chatStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  ChatRequest,
  ChatResponse,
  ClarifyResponse,
  SqlResponse,
  BlockedResponse,
} from "@/types/interaction";
import { postChat } from "@/services/chatApi";

// ====== UI Message Types ======
export type MessageRole = "user" | "assistant" | "system";

export type MessageKind = "text" | "clarify" | "sql" | "blocked";

export interface ChatMessageBase {
  id: string;
  role: MessageRole;
  kind: MessageKind;
  createdAt: number;
}

export interface TextMessage extends ChatMessageBase {
  kind: "text";
  text: string;
}

export interface ClarifyMessage extends ChatMessageBase {
  kind: "clarify";
  payload: ClarifyResponse;
}

export interface SqlMessage extends ChatMessageBase {
  kind: "sql";
  payload: SqlResponse;
}

export interface BlockedMessage extends ChatMessageBase {
  kind: "blocked";
  payload: BlockedResponse;
}

export type ChatMessage = TextMessage | ClarifyMessage | SqlMessage | BlockedMessage;

// ====== Helpers ======
function newId(prefix = "m"): string {
  // 足够用于前端本地消息 id
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toMessage(resp: ChatResponse): ChatMessage {
  const base = {
    id: newId("a"),
    role: "assistant" as const,
    createdAt: Date.now(),
  };

  if (resp.type === "clarify") {
    return { ...base, kind: "clarify", payload: resp };
  }
  if (resp.type === "sql") {
    return { ...base, kind: "sql", payload: resp };
  }
  return { ...base, kind: "blocked", payload: resp };
}

// ====== Store ======
export const useChatStore = defineStore("chat", () => {
  const sessionId = ref<string | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const lastError = ref<string | null>(null);

  // 最近一次 SQL 响应（右侧面板可直接用）
  const lastSql = ref<SqlResponse | null>(null);

  const lastClarify = computed<ClarifyResponse | null>(() => {
    // 从后往前找最近一次 clarify
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const m = messages.value[i];
      if (!m) continue;
      if (m.kind === "clarify") return m.payload;
    }
    return null;
  });

  function resetConversation() {
    sessionId.value = null;
    messages.value = [];
    isLoading.value = false;
    lastError.value = null;
    lastSql.value = null;
  }

  function pushUserText(text: string) {
    messages.value.push({
      id: newId("u"),
      role: "user",
      kind: "text",
      text,
      createdAt: Date.now(),
    });
  }

  function pushSystemText(text: string) {
    messages.value.push({
      id: newId("s"),
      role: "system",
      kind: "text",
      text,
      createdAt: Date.now(),
    });
  }

  async function callBackend(payload: ChatRequest): Promise<ChatResponse> {
    // 你可以在这里加：重试、超时提示、mock fallback 等
    return await postChat(payload);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    lastError.value = null;
    pushUserText(trimmed);

    isLoading.value = true;
    try {
      const resp = await callBackend({
        session_id: sessionId.value ?? undefined,
        message: trimmed,
      });

      // 更新 sessionId（后端必须返回）
      sessionId.value = resp.session_id;

      // 写入消息列表
      const msg = toMessage(resp);
      messages.value.push(msg);

      // 若是 SQL，更新右侧面板数据
      if (resp.type === "sql") {
        lastSql.value = resp;
      }
    } catch (e: any) {
      console.error(e);
      lastError.value = e?.message ?? "请求失败";
      pushSystemText(`请求失败：${lastError.value}`);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 提交追问答案：
   * - 前端可以传 answers（结构化）
   * - 同时给 message 一个可读文本（便于日志与回放）
   */
  async function submitClarify(
    userVisibleText: string,
    answers: Record<string, unknown>
  ) {
    lastError.value = null;

    // 把用户选择/输入也作为用户消息展示出来
    pushUserText(userVisibleText);

    isLoading.value = true;
    try {
      const resp = await callBackend({
        session_id: sessionId.value ?? undefined,
        message: userVisibleText,
        answers,
      });

      sessionId.value = resp.session_id;

      const msg = toMessage(resp);
      messages.value.push(msg);

      if (resp.type === "sql") {
        lastSql.value = resp;
      }
    } catch (e: any) {
      console.error(e);
      lastError.value = e?.message ?? "请求失败";
      pushSystemText(`请求失败：${lastError.value}`);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // state
    sessionId,
    messages,
    isLoading,
    lastError,
    lastSql,

    // computed
    lastClarify,

    // actions
    resetConversation,
    sendMessage,
    submitClarify,
    pushSystemText,
  };
});
