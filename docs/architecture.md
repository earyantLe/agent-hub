# Agent Hub 架构设计

## 系统概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Hub Ecosystem                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   Registry   │◄────│   Protocol   │────►│     SDK      │ │
│  │  (GitHub 市场) │     │   (协议层)    │     │   (客户端)    │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│                            ▲                                 │
│                            │                                 │
│                     ┌──────┴──────┐                          │
│                     │ Transformer │                          │
│                     │  (转换工具)  │                          │
│                     └─────────────┘                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 核心组件

### Protocol (协议层)

**位置**: `protocol/`

**职责**:
- 定义 Skill Descriptor JSON Schema
- 提供验证器 (基于 AJV)
- 导出 TypeScript 类型定义

**关键文件**:
- `src/skill-schema.json` - JSON Schema 定义
- `src/validator.ts` - AJV 验证器
- `src/index.ts` - 导出类型和工具

### Registry (技能市场)

**位置**: `registry/`

**职责**:
- 提供 REST API 查询技能
- 支持技能搜索和过滤
- (可选) 数据库存储

**两种部署模式**:

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **GitHub Pages** | 静态 JSON 文件托管 | 个人项目、小型团队 |
| **自托管服务** | Fastify + PostgreSQL | 企业级、需要权限控制 |

**技术栈**:
- Fastify (REST API)
- Kysely (ORM, 可选)
- PostgreSQL (可选)

### Transformer (转换工具)

**位置**: `transformer/`

**职责**:
- 分析网站结构和功能
- 提取 API 端点和参数
- 生成 Skill Descriptor

**技术栈**:
- Playwright (浏览器自动化)
- Cheerio (HTML 解析)
- Fastify (Web API 服务)

**使用方式**:
```bash
# 命令行
pnpm --filter transformer start https://example.com

# Web UI
访问 https://earyantle.github.io/agent-hub/ 点击 🚀 开始转换

# API
POST /api/transform
{ "url": "https://example.com" }
```

### SDK (客户端)

**位置**: `sdk/typescript/`

**职责**:
- 提供类型安全的客户端
- 封装 Registry API 调用
- 支持 GitHub Pages 和自托管两种模式

**关键类**:
- `AgentHubClient` - 标准客户端
- `GitHubSkillsClient` - GitHub 静态文件客户端

## 数据流

### 技能发布流程

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   开发者     │      │ Transformer  │      │   Registry  │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘
       │                    │                      │
       │ 1. 输入网站 URL     │                      │
       │───────────────────>│                      │
       │                    │                      │
       │                    │ 2. 分析网站           │
       │                    │    生成 Descriptor    │
       │                    │                      │
       │ 3. 返回 JSON        │                      │
       │<───────────────────│                      │
       │                    │                      │
       │ 4. 提交 PR         │                      │
       │─────────────────────────────────────────>│
       │                    │                      │
       │                    │ 5. 审核通过          │
       │                    │    添加到索引        │
       │                    │                      │
```

### 技能使用流程

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Agent     │      │  SDK Client  │      │  Registry   │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘
       │                    │                      │
       │ 1. 获取技能列表     │                      │
       │───────────────────>│                      │
       │                    │                      │
       │                    │ 2. GET /api/skills   │
       │                    │────────────────────>│
       │                    │                      │
       │                    │ 3. 返回技能列表       │
       │                    │<────────────────────│
       │ 4. 返回技能数据     │                      │
       │<───────────────────│                      │
       │                    │                      │
       │ 5. 获取技能详情     │                      │
       │───────────────────>│                      │
       │                    │                      │
       │                    │ 6. GET /api/skills/:name
       │                    │────────────────────>│
       │                    │                      │
       │                    │ 7. 返回技能详情       │
       │                    │<────────────────────│
       │ 8. 返回技能详情     │                      │
       │<───────────────────│                      │
```

## 部署架构

### GitHub Pages 模式（推荐）

```
┌────────────────────────────────────────────┐
│            GitHub Repository                │
│                                             │
│  skills/                                    │
│  ├── index.json         # 技能索引         │
│  └── approved/          # 已审核技能        │
│      ├── demo-skill.json                   │
│      └── ...                               │
└────────────────────────────────────────────┘
                    │
                    │ GitHub Actions
                    │ (自动部署)
                    ▼
┌────────────────────────────────────────────┐
│         GitHub Pages (CDN)                  │
│                                             │
│  https://earyantle.github.io/agent-hub/    │
│                                             │
│  - index.html    # 市场页面                 │
│  - skills/*      # 技能文件                 │
└────────────────────────────────────────────┘
                    │
                    │ 用户访问
                    ▼
┌────────────────────────────────────────────┐
│            用户浏览器                        │
│                                             │
│  fetch('/skills/index.json')                │
│  fetch('/skills/approved/demo-skill.json') │
└────────────────────────────────────────────┘
```

### 自托管模式

```
┌────────────────────────────────────────────┐
│         自托管 Registry 服务                 │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │  Fastify Server                   │     │
│  │  - GET /api/skills                │     │
│  │  - GET /api/skills/:name          │     │
│  │  - POST /api/skills               │     │
│  │  - POST /api/transform            │     │
│  └───────────────────────────────────┘     │
│                    │                        │
│  ┌────────────────┴────────────────┐       │
│  │  PostgreSQL Database            │       │
│  │  - skills 表                    │       │
│  └─────────────────────────────────┘       │
└────────────────────────────────────────────┘
```

## 扩展性

### 未来组件

- **Python SDK** - Python 客户端
- **Admin Dashboard** - 管理后台
- **Analytics** - 技能使用统计
- **Webhook** - 技能更新通知

### 插件系统

Transformer 支持自定义分析器：

```typescript
interface Analyzer {
  analyze(html: string, url: string): AnalysisResult;
}

// 内置分析器
- FormAnalyzer      # 表单识别
- APIAnalyzer       # API 端点检测
- SearchAnalyzer    # 搜索功能识别
```

## 安全考虑

- **输入验证**: 所有 Skill Descriptor 必须通过 JSON Schema 验证
- **速率限制**: API 端点启用 rate limiting
- **CORS**: 配置跨域访问控制
- **审核机制**: 所有技能需审核后才能发布

## 性能优化

- **CDN 分发**: GitHub Pages 全球 CDN
- **静态文件**: 无动态生成，响应速度快
- **增量更新**: 只更新变更的技能文件
