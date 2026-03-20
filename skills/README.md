# Agent Hub 技能市场

本仓库存储所有已注册的 Skill Descriptor，通过 GitHub 进行托管和分发。

## 使用方式

### 浏览技能市场

访问：https://earyantle.github.io/agent-hub/

### 查看技能列表

直接访问技能索引文件：https://earyantle.github.io/agent-hub/skills/index.json

### 查看单个技能

访问技能文件：https://earyantle.github.io/agent-hub/skills/approved/{skill-name}.json

例如：https://earyantle.github.io/agent-hub/skills/approved/demo-skill.json

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
