# Agent Hub

> Make the web agent-ready.

Agent Hub 是一个完整的生态系统，用于将传统网站和应用转换为大模型 Agent 友好的接口。

## 核心组件

- **Registry** - 中心市场，发现和接入已适配的网站/API
- **Transformer** - 转换工具链，将传统网站自动转换为 Skill
- **SDK** - TypeScript/Python 客户端，用于 Agent 集成

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动 Registry
pnpm --filter registry dev

# 运行 Transformer CLI
pnpm --filter transformer cli --help
```

## 文档

- [架构设计](./docs/architecture.md)
- [Skill Descriptor 规范](./protocol/skill-schema.json)
- [SDK 使用指南](./sdk/typescript/README.md)

## License

MIT
