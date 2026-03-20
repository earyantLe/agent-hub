# Agent Hub 技能市场

本仓库存储所有已注册的 Skill Descriptor，通过 GitHub Issues 进行审核和管理。

## 使用方式

### 提交 Skill

1. 访问 [Issues](https://github.com/earyantLe/agent-hub/issues) 页面
2. 点击 **New Issue**
3. 选择 **Submit a Skill** 模板
4. 填写 Skill Descriptor JSON

### 搜索 Skill

- 使用 GitHub 搜索：`is:issue is:closed label:approved`
- 或在技能市场页面浏览：https://earyantle.github.io/agent-hub/

### 使用 SDK 访问

```typescript
import { AgentHubClient } from '@agent-hub/sdk';

// 使用 GitHub 作为后端
const client = new AgentHubClient({
  registryUrl: 'https://earyantle.github.io/agent-hub-skills'
});

const skills = await client.listSkills();
```

## 目录结构

```
skills/
├── approved/        # 已审核通过的技能
│   ├── demo-skill.json
│   └── ...
├── pending/         # 待审核的技能
└── rejected/        # 已拒绝的技能
```

## 审核流程

1. 提交 Issue → 自动标记为 `pending`
2. 维护者审核 → 标记为 `approved` 或 `rejected`
3. 通过的技能合并到 `skills/approved/` 目录
4. GitHub Pages 自动更新

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GITHUB_REPO` | GitHub 仓库 (owner/repo) | `earyantLe/agent-hub` |
| `SKILLS_DIR` | 技能存储目录 | `skills/approved` |
