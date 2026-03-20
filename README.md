# Agent Hub

> Make the web agent-ready.

Agent Hub 是一个完整的生态系统，用于将传统网站和应用转换为大模型 Agent 友好的接口。

## 核心组件

- **Registry** - 中心市场，发现和接入已适配的网站/API
- **Transformer** - 转换工具链，将传统网站自动转换为 Skill
- **SDK** - TypeScript/Python 客户端，用于 Agent 集成

## 快速开始

### 环境要求

- Node.js >= 22.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 15 (可使用 Docker 运行)

### 安装

```bash
# 克隆仓库
git clone https://github.com/earyant/all_app_as_agent.git
cd all_app_as_agent

# 安装依赖
pnpm install

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 配置你的 PostgreSQL 连接
```

### 启动数据库

```bash
# 使用 Docker 快速启动
bash scripts/dev.sh db

# 或者使用本地 PostgreSQL 服务
# 然后设置 DATABASE_URL 环境变量
```

### 启动 Registry 服务

```bash
# 开发模式
pnpm dev

# 或者使用脚本
bash scripts/start-registry.sh
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 或者使用脚本
bash scripts/test.sh
```

### 构建

```bash
pnpm build
```

## 项目结构

```
all_app_as_agent/
├── protocol/           # Skill Descriptor 协议定义和验证
├── registry/           # REST API 服务 (Fastify + PostgreSQL)
├── sdk/typescript/     # TypeScript 客户端 SDK
├── transformer/        # 网站到 Skill 转换工具 (Playwright + Cheerio)
├── examples/           # 示例 Skill 描述符
├── docs/               # 文档
├── scripts/            # 开发和运维脚本
└── CLAUDE.md           # 开发指南
```

## 核心 API

### 提交 Skill

```bash
curl -X POST http://localhost:3000/api/skills \
  -H "Content-Type: application/json" \
  -d '{
    "descriptor": {
      "name": "my-skill",
      "version": "1.0.0",
      "description": "My skill description",
      "capabilities": [...],
      "auth": { "type": "none" }
    }
  }'
```

### 获取 Skill 列表

```bash
curl http://localhost:3000/api/skills
```

### 搜索 Skill

```bash
curl "http://localhost:3000/api/skills?q=search"
```

## 使用 SDK

```typescript
import { AgentHubClient } from '@agent-hub/sdk';

const client = new AgentHubClient({
  registryUrl: 'http://localhost:3000',
  apiKey: 'your-api-key' // optional
});

// 列出所有技能
const skills = await client.listSkills();

// 搜索技能
const results = await client.listSkills('zhihu');

// 获取技能详情
const skill = await client.getSkill('zhihu-skill');

// 提交技能
const result = await client.submitSkill(skillDescriptor);
```

## 使用 Transformer

将任意网站转换为 Skill：

```bash
# 命令行使用
pnpm --filter transformer start https://example.com

# 指定技能名称
pnpm --filter transformer start https://api.example.com --name my-api --author "Your Name"
```

 programmatically 使用：

```typescript
import { transformWebsite } from '@agent-hub/transformer';

const result = await transformWebsite({
  url: 'https://example.com',
  name: 'example-skill'
});

if (result.success) {
  console.log(result.descriptor); // SkillDescriptor
}
```

## 文档

- [架构设计](./docs/architecture.md)
- [Skill Descriptor 规范](./protocol/src/skill-schema.json)
- [SDK 使用指南](./sdk/typescript/README.md)
- [贡献指南](./CONTRIBUTING.md)
- [快速开始](./docs/getting-started.md)

## Scripts 命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动 Registry 开发服务器 |
| `pnpm build` | 构建所有包 |
| `pnpm test` | 运行所有测试 |
| `pnpm lint` | 运行 lint 检查 |
| `pnpm typecheck` | 类型检查 |
| `bash scripts/dev.sh db` | 用 Docker 启动 PostgreSQL |
| `bash scripts/dev.sh clean` | 清理构建产物 |

## License

MIT
