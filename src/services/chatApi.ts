// src/services/chatApi.ts
import { http } from "./http";
import type {
  ChatRequest,
  ChatResponse,
  ClarifyResponse,
  SqlResponse,
} from "@/types/interaction";

/**
 * 是否启用 mock fallback：
 * - 默认启用（开发阶段）
 * - 你也可以通过环境变量关闭
 */
const MOCK_FALLBACK = (import.meta.env.VITE_MOCK_FALLBACK ?? "true") === "true";

export async function postChat(payload: ChatRequest): Promise<ChatResponse> {
  try {
    const { data } = await http.post<ChatResponse>("/api/chat", payload);
    return data;
  } catch (e) {
    if (!MOCK_FALLBACK) throw e;
    console.warn("[mock-fallback] backend unavailable, using mock response");
    return mockChat(payload);
  }
}

/**
 * Mock 规则：
 * - 没有 answers 或 answers 为空：返回 clarify（问销售额口径）
 * - 有 answers.metric：返回 sql
 */
function mockChat(payload: ChatRequest): ChatResponse {
  const sessionId = payload.session_id ?? "mock_session_001";

  const hasAnswers = payload.answers && Object.keys(payload.answers).length > 0;

  if (!hasAnswers || !payload.answers?.["metric"]) {
    const resp: ClarifyResponse = {
      type: "clarify",
      clarify_type: "METRIC_DEFINITION_AMBIGUOUS",
      question: "你说的“销售额”是指哪个口径？",
      fields: [
        {
          key: "metric",
          ui: "single_select",
          options: [
            { value: "SUM(o.order_amount)", label: "订单金额（未扣退款）" },
            { value: "SUM(o.paid_amount)", label: "实付金额（已扣优惠/退款）" },
          ],
          default: "SUM(o.paid_amount)",
        },
      ],
      session_id: sessionId,
      context_hint: "不同口径会影响结果，请选择一种用于生成 SQL。",
    };
    return resp;
  }

  const metric = String(payload.answers?.["metric"] ?? "SUM(o.paid_amount)");

  const sql = `
SELECT
  c.customer_name AS customer_name,
  ${metric} AS total_sales
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
WHERE o.province = '广东'
  AND o.paid_at >= '2024-01-01' AND o.paid_at < '2025-01-01'
GROUP BY c.customer_name
ORDER BY total_sales DESC
LIMIT 10;
`.trim();

  const resp: SqlResponse = {
    type: "sql",
    dialect: "mysql",
    sql,
    explanation: {
      summary: "按客户汇总2024年广东省销售额，取前10名。",
      tables: [
        { name: "orders", alias: "o", role: "fact", description: "订单事实表" },
        { name: "customers", alias: "c", role: "dimension", description: "客户维表" },
      ],
      joins: [
        {
          type: "INNER",
          left: { table: "orders", alias: "o", column: "customer_id" },
          right: { table: "customers", alias: "c", column: "id" },
          cardinality: "N:1",
          reason: "获取客户名称并按客户聚合订单",
          source: "relation_card",
        },
      ],
      select: [
        {
          expr: "c.customer_name",
          alias: "customer_name",
          semantic_type: "dimension",
          data_type: { db_type: "varchar(128)", logical_type: "string" },
        },
        {
          expr: metric,
          alias: "total_sales",
          semantic_type: "metric",
          data_type: { db_type: "decimal(18,2)", logical_type: "number", unit: "CNY" },
          definition: metric.includes("paid_amount") ? "实付金额汇总" : "订单金额汇总",
        },
      ],
      filters: [
        {
          expr: "o.province = '广东'",
          field: { table: "orders", alias: "o", column: "province" },
          op: "=",
          value: { type: "string", raw: "'广东'" },
          source: "user",
        },
        {
          expr: "o.paid_at >= '2024-01-01' AND o.paid_at < '2025-01-01'",
          field: { table: "orders", alias: "o", column: "paid_at" },
          op: "between",
          value: {
            type: "date_range",
            start: "2024-01-01",
            end: "2025-01-01",
            inclusive_start: true,
            exclusive_end: true,
          },
          source: "default",
        },
      ],
      group_by: [{ table: "customers", alias: "c", column: "customer_name" }],
      order_by: [{ expr: "total_sales", direction: "DESC" }],
      limit: { value: 10, source: "default" },
    },
    validation: {
      status: "pass",
      warnings: [{ code: "MOCK_MODE", message: "当前为 mock 模式返回的示例 SQL" }],
    },
    session_id: sessionId,
  };

  return resp;
}
