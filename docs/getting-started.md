# 快速开始指南

## 创建你的第一个 Skill

### 步骤 1: 定义 Skill Descriptor

创建 `skill.json`:

```json
{
  "name": "my-skill",
  "version": "1.0.0",
  "description": "我的第一个 Agent Skill",
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

### 步骤 2: 验证描述符

```bash
pnpm --filter @agent-hub/protocol build
node -e "
const { validateSkillDescriptor } = require('@agent-hub/protocol');
const skill = require('./skill.json');
console.log(validateSkillDescriptor(skill));
"
```

### 步骤 3: 提交到 Registry

```typescript
import { AgentHubClient } from '@agent-hub/sdk';

const client = new AgentHubClient({
  registryUrl: 'http://localhost:3000'
});

await client.submitSkill(skill);
```

## 下一步

- 阅读 [Skill Descriptor 规范](../protocol/README.md)
- 查看 [示例 Skills](../examples/)
- 了解 [Transformer 工具](../transformer/README.md)
