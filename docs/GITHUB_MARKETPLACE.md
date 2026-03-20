# Agent Hub 技能市场 - GitHub 托管指南

## 概述

Agent Hub 技能市场现在支持完全基于 GitHub 的托管方案，无需数据库或后端服务。

## 架构

```
GitHub Repository (earyantLe/agent-hub)
│
├── skills/
│   ├── index.json          # 技能索引（GitHub Pages 读取）
│   └── approved/
│       └── demo-skill.json # 已审核的技能文件
│
└── docs/
    └── index.html          # 技能市场页面
```

## 使用方式

### 1. 浏览技能市场

访问：https://earyantle.github.io/agent-hub/

页面会自动从 `skills/index.json` 加载技能列表。

### 2. 添加新技能

#### 方式 A: 直接提交 PR

1. 在 `skills/approved/` 目录下创建 `{skill-name}.json` 文件
2. 更新 `skills/index.json` 添加技能到索引
3. 提交 Pull Request

#### 方式 B: 使用 Transformer 转换网站

1. 访问技能市场页面
2. 点击"开始转换"按钮
3. 输入网站 URL
4. 复制生成的 Skill Descriptor
5. 提交 PR

### 3. 在代码中使用

```typescript
import { AgentHubClient } from '@agent-hub/sdk';

// 从 GitHub Pages 加载技能
const client = new AgentHubClient({
  registryUrl: 'https://earyantle.github.io/agent-hub'
});

const skills = await client.listSkills();
const skill = await client.getSkill('demo-skill');
```

或使用 GitHub API（需要审核流程）：

```typescript
import { GitHubSkillsClient } from '@agent-hub/sdk';

const client = new GitHubSkillsClient({
  owner: 'earyantLe',
  repo: 'agent-hub',
  branch: 'main',
  skillsDir: 'skills/approved'
});

const skills = await client.listSkills();
```

## 技能文件格式

### skills/approved/{name}.json

```json
{
  "name": "demo-skill",
  "version": "1.0.0",
  "description": "示例技能",
  "author": {
    "name": "Your Name",
    "email": "your@email.com"
  },
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
  "auth": { "type": "none" },
  "metadata": {
    "tags": ["示例", "demo"]
  },
  "links": {
    "homepage": "https://example.com"
  }
}
```

### skills/index.json

```json
{
  "skills": [
    {
      "name": "demo-skill",
      "version": "1.0.0",
      "description": "示例技能",
      "author": { "name": "Your Name" },
      "metadata": { "tags": ["示例", "demo"] },
      "downloads": 0
    }
  ],
  "lastUpdated": "2026-03-20T00:00:00.000Z"
}
```

## GitHub Actions 自动化（可选）

可以配置 GitHub Actions 自动审核和合并技能提交：

```yaml
# .github/workflows/validate-skills.yml
name: Validate Skills

on:
  pull_request:
    paths:
      - 'skills/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: pnpm install
      - run: pnpm --filter protocol build
      - name: Validate Skill Descriptors
        run: |
          for file in skills/approved/*.json; do
            node scripts/validate-skill.js "$file"
          done
```

## 速率限制

- **GitHub Pages**: 无限制，静态文件 CDN 分发
- **GitHub API**: 未认证 60 次/小时，认证 5000 次/小时

建议使用 GitHub Pages（静态文件）方式，无需 API 调用。

## 优势

| 特性 | 传统 Registry | GitHub 托管 |
|------|--------------|------------|
| 数据库 | 需要 PostgreSQL | 不需要 |
| 部署 | 手动部署服务 | GitHub Pages 自动 |
| 审核 | 自建系统 | GitHub Issues/PR |
| 成本 | 服务器费用 | 免费 |
| 扩展性 | 受限于服务器 | 无限（CDN） |

## 迁移指南

如果你已经有运行中的 Registry 服务，可以：

1. 导出所有技能为 JSON 文件
2. 提交到 `skills/approved/` 目录
3. 更新 `skills/index.json`
4. 修改前端配置使用静态加载

## 问题反馈

遇到问题？请提交 Issue: https://github.com/earyantLe/agent-hub/issues
