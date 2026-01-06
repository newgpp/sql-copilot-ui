// src/types/interaction.ts

/** ====== Request ====== */
export interface ChatRequest {
  session_id?: string;
  message: string;

  /**
   * 当用户在 clarify 表单中提交选择/输入时，建议用 answers 带结构化值；
   * MVP 阶段后端也可以只用 message 来继续对话，不强依赖 answers。
   */
  answers?: Record<string, unknown>;
}

/** ====== Clarify ====== */
export type ClarifyUI =
  | "single_select"
  | "multi_select"
  | "text"
  | "number"
  | "date"
  | "date_range";

export type ClarifyType =
  | "TIME_RANGE_MISSING"
  | "TIME_FIELD_AMBIGUOUS"
  | "METRIC_DEFINITION_AMBIGUOUS"
  | "ENTITY_MAPPING_AMBIGUOUS"
  | "FILTER_VALUE_UNKNOWN"
  | "JOIN_PATH_AMBIGUOUS"
  | "GROUPING_LEVEL_AMBIGUOUS"
  | "LIMIT_OR_TOPN_AMBIGUOUS";

export interface ClarifyFieldOption {
  value: unknown;
  label: string;
}

export interface ClarifyField {
  key: string;
  ui: ClarifyUI;

  options?: ClarifyFieldOption[];
  default?: unknown;

  // 数字/日期范围可用
  min?: number;
  max?: number;

  // 前端可用作占位符或说明
  hint?: string;
}

export interface ClarifyResponse {
  type: "clarify";
  clarify_type: ClarifyType;
  question: string;
  fields: ClarifyField[];
  session_id: string;
  context_hint?: string;
}

/** ====== SQL ====== */
export type SqlDialect = "mysql" | "postgres" | "sqlite" | "unknown";

export type LogicalType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "timestamp"
  | "enum"
  | "json";

export interface DataType {
  db_type: string; // varchar(64), bigint, decimal(18,2), datetime ...
  logical_type: LogicalType;

  // timestamp/datetime 常见
  timezone?: string;

  // timestamp: s / ms，金额：CNY
  unit?: string;

  // date: YYYY-MM-DD
  format?: string;
}

export interface ExplainTable {
  name: string;
  alias?: string;
  role?: "fact" | "dimension" | "bridge" | "unknown";
  description?: string;
}

export interface ExplainJoin {
  type: "INNER" | "LEFT" | "RIGHT" | "FULL";
  left: { table: string; alias?: string; column: string };
  right: { table: string; alias?: string; column: string };
  cardinality?: "1:1" | "1:N" | "N:1" | "N:N";
  reason?: string;
  source?: "fk" | "relation_card" | "inferred";
}

export interface ExplainSelectItem {
  expr: string;
  alias?: string;
  semantic_type?: "dimension" | "metric" | "unknown";
  data_type?: DataType;
  definition?: string;
}

export interface ExplainFilter {
  expr: string;
  field?: { table: string; alias?: string; column: string };
  op?: string;

  value?: {
    type: "string" | "number" | "date" | "date_range" | "enum" | "json" | "raw";
    raw?: string;
    [k: string]: unknown;
  };

  source?: "user" | "clarified" | "default" | "inferred";
}

export interface Explanation {
  summary?: string;
  tables?: ExplainTable[];
  joins?: ExplainJoin[];
  select?: ExplainSelectItem[];
  filters?: ExplainFilter[];
  group_by?: Array<{ table: string; alias?: string; column: string }>;
  order_by?: Array<{ expr: string; direction: "ASC" | "DESC" }>;
  limit?: { value: number; source?: "user" | "clarified" | "default" | "inferred" };
}

export interface SqlResponse {
  type: "sql";
  sql: string;
  dialect: SqlDialect;
  explanation?: Explanation;
  validation?: {
    status: "pass" | "warn" | "fail";
    warnings?: Array<{ code: string; message: string }>;
  };
  session_id: string;
}

/** ====== Blocked ====== */
export interface BlockedResponse {
  type: "blocked";
  reason: string;
  suggested_questions?: string[];
  session_id: string;
}

/** ====== Union ====== */
export type ChatResponse = ClarifyResponse | SqlResponse | BlockedResponse;
