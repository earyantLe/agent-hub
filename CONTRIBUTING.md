# Contributing Guide

## 开发环境设置

### 前置要求

- Node.js >= 22.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 15

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/agent-hub.git
cd agent-hub

# 安装依赖
pnpm install

# 启动 PostgreSQL (可选，使用 Docker)
docker run -d --name agent-hub-db \
  -e POSTGRES_DB=agent_hub \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  postgres:15

# 设置环境变量
export DATABASE_URL="postgresql://dev:dev@localhost:5432/agent_hub"
```

## 开发工作流

```bash
# 运行所有测试
pnpm test

# 运行类型检查
pnpm typecheck

# 运行 lint
pnpm lint

# 构建所有包
pnpm build
```

### 提交规范

使用 Conventional Commits:

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具配置
