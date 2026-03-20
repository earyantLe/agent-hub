import { chromium, type Browser, type Page } from 'playwright';
import * as cheerio from 'cheerio';
import type { SkillDescriptor } from '@agent-hub/protocol';

export interface TransformOptions {
  url: string;
  name?: string;
  version?: string;
  author?: { name: string; email?: string; url?: string };
  capabilities?: string[]; // 指定要提取的能力
}

export interface TransformResult {
  success: boolean;
  descriptor?: SkillDescriptor;
  error?: string;
  rawHtml?: string;
}

/**
 * 网站到 Skill 转换器
 * 分析网站结构，自动生成 Skill Descriptor
 */
export class WebsiteTransformer {
  private browser: Browser | null = null;

  async transform(options: TransformOptions): Promise<TransformResult> {
    try {
      // 获取网站内容
      const { html, title, description } = await this.fetchWebsite(options.url);

      // 分析网站结构
      const analysis = this.analyzeWebsite(html, options.url);

      // 生成 Skill Descriptor
      const descriptor = this.generateDescriptor({
        ...options,
        url: options.url,
        title,
        description,
        analysis
      });

      return {
        success: true,
        descriptor,
        rawHtml: html?.slice(0, 10000) // 限制长度
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async fetchWebsite(url: string): Promise<{ html: string; title: string; description: string }> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await this.browser.newPage({
      userAgent: 'Mozilla/5.0 (compatible; AgentHubTransformer/1.0)'
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const html = await page.content();
      const title = await page.title();

      // 尝试获取 meta description
      const description = await page.$eval(
        'meta[name="description"]',
        (el) => el.getAttribute('content') || ''
      ).catch(() => '');

      return { html, title, description };
    } finally {
      await page.close();
      await this.browser.close();
      this.browser = null;
    }
  }

  private analyzeWebsite(html: string, url: string) {
    const $ = cheerio.load(html);

    // 分析页面功能
    const forms = $('form');
    const inputs = $('input, textarea, select');
    const buttons = $('button, input[type="button"], input[type="submit"]');
    const links = $('a[href]');
    const tables = $('table');
    const images = $('img');
    const searchInputs = $('input[type="search"], input[type="text"][placeholder*="搜索"], input[placeholder*="search" i]');

    // 检测可能的功能
    const features: string[] = [];

    if (searchInputs.length > 0) features.push('search');
    if (forms.length > 0) features.push('forms');
    if (tables.length > 0) features.push('data-display');
    if (links.length > 10) features.push('navigation');

    // 分析表单字段
    const formFields: Array<{ name?: string; type: string; required: boolean }> = [];
    forms.each((_, form) => {
      $(form).find('input, textarea, select').each((__, field) => {
        const $field = $(field);
        formFields.push({
          name: $field.attr('name'),
          type: $field.attr('type') || $field.prop('tagName').toLowerCase(),
          required: $field.prop('required') || false
        });
      });
    });

    // 检测 API 端点（从页面脚本中）
    const apiEndpoints = this.extractApiEndpoints(html, url);

    return {
      features,
      formFields,
      apiEndpoints,
      linkCount: links.length,
      imageCount: images.length,
      url: url
    };
  }

  private extractApiEndpoints(html: string, baseUrl: string): string[] {
    const endpoints: string[] = [];
    const baseUrlObj = new URL(baseUrl);

    // 匹配 fetch/XMLHttpRequest 调用
    const fetchRegex = /fetch\(['"`](\/?api\/[^'"`]+)['"`]/gi;
    const xhrRegex = /xhr\.open\([^,]+,\s*['"`](\/?api\/[^'"`]+)['"`]/gi;

    for (const match of html.matchAll(fetchRegex)) {
      const endpoint = match[1];
      const fullUrl = endpoint.startsWith('/')
        ? `${baseUrlObj.origin}${endpoint}`
        : endpoint;
      if (!endpoints.includes(fullUrl)) endpoints.push(fullUrl);
    }

    for (const match of html.matchAll(xhrRegex)) {
      const endpoint = match[1];
      const fullUrl = endpoint.startsWith('/')
        ? `${baseUrlObj.origin}${endpoint}`
        : endpoint;
      if (!endpoints.includes(fullUrl)) endpoints.push(fullUrl);
    }

    return endpoints.slice(0, 10); // 限制数量
  }

  private generateDescriptor(options: TransformOptions & {
    url: string;
    title: string;
    description: string;
    analysis: ReturnType<WebsiteTransformer['analyzeWebsite']>;
  }): SkillDescriptor {
    const { name, url, title, description, analysis } = options;

    // 生成能力列表
    const capabilities: SkillDescriptor['capabilities'] = [];

    // 根据分析结果生成能力
    if (analysis.features.includes('search')) {
      capabilities.push({
        name: 'search',
        description: '在网站内搜索内容',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索关键词' }
          },
          required: ['query']
        }
      });
    }

    // 如果有表单，生成表单提交能力
    if (analysis.formFields.length > 0) {
      const formProperties: Record<string, { type: string; description: string }> = {};
      const requiredFields: string[] = [];

      analysis.formFields.forEach((field, index) => {
        const propName = field.name || `field_${index}`;
        formProperties[propName] = {
          type: field.type === 'textarea' ? 'string' : 'string',
          description: `表单字段：${field.name || '未命名'}`
        };
        if (field.required) requiredFields.push(propName);
      });

      capabilities.push({
        name: 'submitForm',
        description: '提交网站表单',
        inputSchema: {
          type: 'object',
          properties: formProperties,
          required: requiredFields
        }
      });
    }

    // 获取页面内容能力
    capabilities.push({
      name: 'getPageContent',
      description: `获取 ${title} 的页面内容`,
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '页面路径，留空则获取首页' }
        }
      }
    });

    // 导航能力
    if (analysis.linkCount > 5) {
      capabilities.push({
        name: 'navigate',
        description: '导航到网站内的特定页面',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '目标页面路径' }
          },
          required: ['path']
        }
      });
    }

    // 生成名称
    const skillName = name || this.generateNameFromUrl(url);

    return {
      name: skillName,
      version: options.version || '1.0.0',
      description: description || `从 ${url} 自动生成的 Skill`,
      author: options.author,
      capabilities,
      auth: { type: 'none' },
      metadata: {
        sourceUrl: url,
        generatedAt: new Date().toISOString(),
        transformerVersion: '0.1.0'
      },
      links: {
        homepage: url
      }
    };
  }

  private generateNameFromUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '').replace(/\..+/, '') + '-skill';
    } catch {
      return 'unknown-skill';
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// 便捷函数
export async function transformWebsite(options: TransformOptions): Promise<TransformResult> {
  const transformer = new WebsiteTransformer();
  try {
    return await transformer.transform(options);
  } finally {
    await transformer.close();
  }
}
