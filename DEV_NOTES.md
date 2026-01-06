# DEV_NOTES

## 当前进度（Frontend）

- 项目：sql-copilot-ui
- 技术栈：Vue3 + Vite + TypeScript + Pinia + Axios
- 已完成：
  - ChatWindow / ChatComposer
  - ClarifyRenderer（支持 single_select）
  - SqlPanel（展示 SQL + explanation + copy）
  - chatStore（session / message / clarify / sql）
  - mock fallback（后端未启动也可完整跑通）

## 当前交互协议（三态）

POST /api/chat

后端返回：
- type = clarify
- type = sql
- type = blocked

前端依据 type 渲染不同 UI。

## Mock 行为说明

- 第一次提问 → 返回 clarify（销售额口径）
- 提交 clarify（answers.metric） → 返回 sql
- mock 逻辑在 src/services/chatApi.ts

## 明天要做的事情（Backend）

1. 初始化 Python 后端项目：sql-orchestrator
2. 定义 /api/chat 接口（FastAPI）
3. 返回结构必须对齐 src/types/interaction.ts
4. 先 hardcode 一个 clarify / sql（替换 mock）
5. 后续再接 LangChain / Qdrant / LLM

## 注意事项

- 前端已经依赖 answers.metric 这个字段
- session_id 必须每次返回
