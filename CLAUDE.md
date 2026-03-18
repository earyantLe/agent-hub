# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 项目总览

Agent Hub 是一个单体仓库 (monorepo)，包含以下核心模块：

| 模块 | 说明 | 技术栈 |
|------|------|--------|
| **protocol** | Skill Descriptor 协议定义和验证 | TypeScript + AJV + JSON Schema |
| **registry** | REST API 服务 + PostgreSQL 数据库 | Fastify + Kysely ORM |
| **sdk/typescript** | TypeScript 客户端 SDK | TypeScript + fetch API |
| **transformer** | HTML 到 Skill 转换工具 (待实现) | Playwright + Cheerio |

---

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动 Registry 服务

```bash
# 设置环境变量
export DATABASE_URL="postgresql://dev:dev@localhost:5432/agent_hub"

# 开发模式
pnpm --filter registry dev

# 或构建后运行
pnpm --filter registry build
pnpm --filter registry start
```

### 运行测试

```bash
pnpm test
```

### 类型检查

```bash
pnpm typecheck
```

---

## 架构

### Protocol 层

```
protocol/
├── src/
│   ├── skill-schema.json    # JSON Schema 定义
│   ├── validator.ts         # AJV 验证器
│   └── index.ts             # 导出
└── package.json
```

### Registry 服务

```
registry/
├── src/
│   ├── index.ts             # 入口
│   ├── server.ts            # Fastify 服务器
│   ├── db/
│   │   ├── database.ts      # 数据库连接
│   │   ├── schema.ts        # TypeScript Schema
│   │   └── repositories/
│   │       └── skill-repository.ts
│   └── routes/
│       └── skills.ts        # REST API 路由
└── package.json
```

### SDK

```
sdk/typescript/
├── src/
│   ├── client.ts            # AgentHubClient
│   └── index.ts
├── README.md
└── package.json
```

---

## 开发规范

### 代码风格

- 使用简体中文编写注释和文档
- TypeScript 严格模式
- 文件行数 < 300 行
- 每层目录文件数 < 8 个

### Git 规范

使用 Conventional Commits:
```
feat:     新功能
fix:      Bug 修复
docs:     文档更新
refactor: 重构
test:     测试
chore:    构建/工具
```

### 测试规范

- 新功能的测试覆盖率需 > 80%
- 使用 TDD 方式开发
- API 测试使用 vitest

---

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/skills` | GET | 获取技能列表 (支持 ?q=搜索) |
| `/api/skills/:name` | GET | 获取技能详情 |
| `/api/skills` | POST | 提交新技能 |

---

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串 |
| `PORT` | 否 | 服务端口 (默认 3000) |
| `HOST` | 否 | 服务地址 (默认 0.0.0.0) |
| `LOG_LEVEL` | 否 | 日志级别 (默认 info) |

---

## 技能描述符示例

```json
{
  "name": "demo-skill",
  "version": "1.0.0",
  "description": "示例技能",
  "capabilities": [
    {
      "name": "hello",
      "description": "打招呼",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": { "type": "string" }
        },
        "required": ["name"]
      }
    }
  ],
  "auth": { "type": "none" }
}
```

---

## 有用命令

```bash
# 构建所有包
pnpm build

# 运行 lint
pnpm lint

# 启动单个服务
pnpm --filter protocol build
pnpm --filter registry dev
pnpm --filter @agent-hub/sdk build
```
