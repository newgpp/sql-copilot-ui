### 一个将自然语言问题转化为可解释、可校验 SQL 的后端服务，负责语义解析、数据库元数据检索、SQL 生成与交互式澄清。

sql-orchestrator 是一个基于 Python 的后端服务，用于将用户的自然语言查询逐步转换为结构化 SQL。
它通过数据库表/字段/关系的元数据检索、规则校验和必要的交互式追问，生成安全、可理解、可复查的 SQL 查询结果。
该服务本身不直接执行 SQL，专注于生成与决策逻辑的编排（orchestration）。

### 核心职责

- 解析用户查询意图（IR）

- 检索相关数据库表、字段和关联关系

- 生成并校验 SQL

- 在信息不充分时发起结构化追问

- 输出 SQL 及其生成依据（explanation）


### 项目结构

```shell
sql-copilot-ui/
├── DEV_NOTES.md                 # 开发过程文档（内部）：记录当前进度、设计决策、下一步计划
├── README.md                    # 项目对外说明：用途、启动方式、整体介绍
├── index.html                   # Vite 应用入口 HTML
├── package.json                 # 项目依赖与脚本定义
├── package-lock.json            # npm 依赖锁定文件
├── vite.config.ts               # Vite 构建与开发配置
├── tsconfig.json                # TypeScript 基础配置
├── tsconfig.app.json            # 应用代码 TS 配置
├── tsconfig.node.json           # Node / Vite 相关 TS 配置
├── public/                      # 不参与打包处理的静态资源（会原样拷贝到 dist）
│   └── vite.svg                 # 示例静态资源（可替换为 logo / favicon）
└── src/                         # 前端核心源码目录
    ├── main.ts                  # 应用入口：创建 Vue App，注册 Pinia / Router
    ├── App.vue                  # 根组件，仅作为 router-view 容器
    ├── styles/
    │   └── global.css           # 全局样式（reset、字体、基础布局）
    ├── router/
    │   └── index.ts             # 路由定义（当前只有 ChatPage）
    ├── pages/
    │   └── ChatPage.vue         # 页面级组件：左聊天 / 右 SQL 的整体布局
    ├── components/              # UI 组件目录
    │   ├── chat/                # 聊天相关组件
    │   │   ├── ChatWindow.vue   # 聊天主容器：消息列表 + clarify / sql 渲染
    │   │   ├── ChatComposer.vue # 底部输入框：用户输入与发送
    │   │   └── ClarifyRenderer.vue # 结构化追问渲染器（当前支持 single_select）                        
    │   └── sql/
    │       └── SqlPanel.vue     # SQL 展示面板：SQL / summary / explanation / copy
    ├── stores/
    │   └── chatStore.ts         # Pinia 状态管理：
    │                              # session_id / 消息流 / clarify / sql / loading
    ├── services/
    │   ├── http.ts              # Axios 实例配置（baseURL / timeout）
    │   └── chatApi.ts           # /api/chat 封装 + mock fallback
    ├── types/
    │   └── interaction.ts       # 前后端交互协议定义（三态：clarify / sql / blocked）
    └── utils/                   # 通用工具函数（当前预留）
```

