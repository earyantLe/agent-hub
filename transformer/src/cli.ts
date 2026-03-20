#!/usr/bin/env node

import { transformWebsite } from './transformer.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Agent Hub Transformer - 将网站转换为 Skill

用法:
  pnpm --filter transformer start <url> [options]

选项:
  --name      技能名称（默认从 URL 生成）
  --version   版本号（默认 1.0.0）
  --author    作者名称

示例:
  pnpm --filter transformer start https://example.com
  pnpm --filter transformer start https://api.example.com --name my-api --author "John Doe"
`);
    process.exit(0);
  }

  const url = args.find(a => !a.startsWith('--'));

  if (!url) {
    console.error('错误：请提供网站 URL');
    process.exit(1);
  }

  const nameIndex = args.indexOf('--name');
  const versionIndex = args.indexOf('--version');
  const authorIndex = args.indexOf('--author');

  const options = {
    url,
    name: nameIndex >= 0 ? args[nameIndex + 1] : undefined,
    version: versionIndex >= 0 ? args[versionIndex + 1] : '1.0.0',
    author: authorIndex >= 0 ? { name: args[authorIndex + 1] } : undefined
  };

  console.log(`正在转换网站：${url}`);

  try {
    const result = await transformWebsite(options);

    if (result.success && result.descriptor) {
      console.log('\n✅ 转换成功!\n');
      console.log(JSON.stringify(result.descriptor, null, 2));
    } else {
      console.error('\n❌ 转换失败:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('错误:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
