# @agent-hub/protocol

Skill Descriptor 协议定义和验证工具。

## 安装

```bash
pnpm add @agent-hub/protocol
```

## 使用

```typescript
import { validateSkillDescriptor } from '@agent-hub/protocol';

const skill = {
  name: 'zhihu-skill',
  version: '1.0.0',
  description: '知乎内容搜索 API',
  capabilities: [...]
};

const result = validateSkillDescriptor(skill);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Schema

完整 JSON Schema 定义见 `src/skill-schema.json`。
