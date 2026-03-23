# Agent Hub

> 将任何网站变成 AI Agent 可调用的技能 - 无需编写代码

**5 分钟快速上手 →** [docs/QUICKSTART.md](./docs/QUICKSTART.md)

## 核心组件

| 组件 | 说明 | 状态 |
|------|------|------|
| **Registry** | 技能市场 (GitHub Pages) | ✅ 运行中 |
| **Transformer** | 网站 → Skill 转换工具 | ✅ 完成 |
| **SDK** | TypeScript 客户端 | ✅ 完成 |
| **Protocol** | Skill Descriptor 协议 | ✅ 完成 |

## 快速开始

### 方式 1: 使用 GitHub Pages（推荐，无需部署）

直接访问：https://earyantle.github.io/agent-hub/

### 方式 2: 本地运行 Registry

```bash
# 安装依赖
pnpm install

# 设置数据库
export DATABASE_URL="postgresql://dev:dev@localhost:5432/agent_hub"

# 启动服务
pnpm --filter registry dev
```

## 使用 Transformer 转换网站

```bash
# Web 版
访问 https://earyantle.github.io/agent-hub/ 点击 🚀 开始转换

# 命令行版
pnpm --filter transformer start https://example.com
```

## 在 Agent 中使用

```typescript
import { AgentHubClient } from '@agent-hub/sdk';

const client = new AgentHubClient({
  registryUrl: 'https://earyantle.github.io/agent-hub'
});

const skills = await client.listSkills();
const skill = await client.getSkill('demo-skill');
```

## 项目结构

```
agent-hub/
├── protocol/           # Skill Descriptor 协议定义
├── registry/           # REST API 服务 (Fastify + PostgreSQL)
├── sdk/typescript/     # TypeScript 客户端 SDK
├── transformer/        # 网站 → Skill 转换工具
├── skills/             # GitHub 托管的技能文件
├── docs/               # 文档
└── CLAUDE.md           # 开发指南
```

## 文档

| 文档 | 说明 |
|------|------|
| [5 分钟快速上手](./docs/QUICKSTART.md) | 从零开始发布第一个技能 |
| [架构设计](./docs/architecture.md) | 系统架构和技术栈 |
| [GitHub 托管指南](./docs/GITHUB_MARKETPLACE.md) | 使用 GitHub Pages 托管技能市场 |
| [Skill Descriptor 规范](./protocol/src/skill-schema.json) | 技能文件格式定义 |

## 命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm build` | 构建所有包 |
| `pnpm test` | 运行测试 |
| `pnpm --filter registry dev` | 启动 Registry 开发服务器 |
| `pnpm --filter transformer start <url>` | 转换网站为 Skill |

## License

MIT
