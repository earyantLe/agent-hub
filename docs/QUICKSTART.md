# 5 分钟快速上手 Agent Hub

## 你将在 5 分钟内完成什么

学会如何将任意网站转换为 AI Agent 可调用的技能，并发布到技能市场。

---

## 步骤 1: 访问技能市场 (30 秒)

打开 [GitHub Pages 技能市场](https://earyantle.github.io/agent-hub/)

这是完全静态的，托管在 GitHub Pages 上，无需任何后端服务。

---

## 步骤 2: 转换一个网站 (2 分钟)

### 方式 A: 使用 Web 版 Transformer（推荐）

1. 点击页面上的 **🚀 开始转换** 按钮
2. 输入要转换的网站 URL，例如 `https://example.com`
3. 等待 10-30 秒，系统会自动分析网站并生成 Skill Descriptor
4. 查看生成的 JSON，确认无误后点击 **复制 JSON**

### 方式 B: 使用命令行 Transformer

```bash
# 克隆项目
git clone https://github.com/earyantLe/agent-hub.git
cd agent-hub

# 安装依赖
pnpm install

# 运行 Transformer
pnpm --filter transformer start https://example.com
```

---

## 步骤 3: 发布你的技能 (2 分钟)

### 方式 A: 通过 GitHub PR（标准流程）

1. 在 GitHub 上创建 Issue：https://github.com/earyantLe/agent-hub/issues/new
2. 标题：`Submit Skill: your-skill-name`
3. 内容粘贴你的 Skill Descriptor JSON
4. 等待审核通过后，管理员会合并到你的技能到 `skills/approved/` 目录

### 方式 B: 直接提交 PR（如果你有仓库权限）

1. 在 `skills/approved/` 目录创建 `{your-skill-name}.json`
2. 更新 `skills/index.json` 添加你的技能到索引
3. 提交 Pull Request

**技能文件格式示例：**

```json
{
  "name": "my-skill",
  "version": "1.0.0",
  "description": "我的技能描述",
  "author": {
    "name": "Your Name",
    "email": "your@email.com"
  },
  "capabilities": [
    {
      "name": "search",
      "description": "搜索功能",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "搜索关键词" }
        },
        "required": ["query"]
      }
    }
  ],
  "auth": { "type": "none" },
  "metadata": {
    "tags": ["搜索", "工具"],
    "website": "https://example.com"
  },
  "links": {
    "homepage": "https://example.com"
  }
}
```

---

## 步骤 4: 在你的 Agent 中使用 (2 分钟)

### 使用 TypeScript SDK

```bash
pnpm add @agent-hub/sdk
```

```typescript
import { AgentHubClient } from '@agent-hub/sdk';

const client = new AgentHubClient({
  registryUrl: 'https://earyantle.github.io/agent-hub'
});

// 列出所有技能
const skills = await client.listSkills();

// 获取特定技能
const skill = await client.getSkill('my-skill');

// 现在你可以在 Agent 中调用这个技能了
```

### 使用 Python SDK（开发中）

```python
# TODO: Python SDK will be available soon
```

---

## 下一步

恭喜你完成了第一个技能的发布！接下来你可以：

- 📚 阅读 [Skill Descriptor 完整规范](../protocol/src/skill-schema.json)
- 🔧 了解 [Transformer 工作原理](./architecture.md)
- 🤝 [贡献指南](../CONTRIBUTING.md)
- 💬 加入讨论：https://github.com/earyantLe/agent-hub/discussions

---

## 常见问题

**Q: Transformer 分析失败了怎么办？**

A: 某些网站可能有反爬虫机制。你可以：
1. 手动编写 Skill Descriptor（参考上面的格式示例）
2. 使用 Mock 数据生成（前端会自动提供）

**Q: 我的技能需要认证怎么办？**

A: 在 `auth` 字段中指定认证类型：

```json
{
  "auth": {
    "type": "apiKey"
  }
}
```

**Q: 如何更新已发布的技能？**

A: 修改 `skills/approved/{skill-name}.json` 并增加 `version` 号，然后提交 PR。

**Q: GitHub Pages 的访问速度如何？**

A: GitHub Pages 使用 CDN 分发，全球访问速度都很快。无速率限制。

---

## 需要帮助？

- 提交 Issue: https://github.com/earyantLe/agent-hub/issues
- 查看现有讨论：https://github.com/earyantLe/agent-hub/discussions
