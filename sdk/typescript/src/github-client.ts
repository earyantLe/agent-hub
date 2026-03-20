/**
 * GitHub 技能仓库客户端
 * 使用 GitHub API 作为技能存储后端
 */

export interface GitHubSkill {
  name: string;
  version: string;
  description: string;
  author?: { name: string; email?: string; url?: string };
  capabilities: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
  auth: { type: string };
  metadata?: { tags?: string[]; website?: string };
  links?: { homepage?: string };
  [key: string]: unknown;
}

export interface GitHubClientConfig {
  owner: string;
  repo: string;
  branch?: string;
  skillsDir?: string;
  token?: string; // 可选的 GitHub token，用于提高速率限制
}

/**
 * GitHub 技能仓库客户端
 */
export class GitHubSkillsClient {
  private owner: string;
  private repo: string;
  private branch: string;
  private skillsDir: string;
  private token?: string;
  private baseUrl = 'https://api.github.com';

  constructor(config: GitHubClientConfig) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.branch = config.branch || 'main';
    this.skillsDir = config.skillsDir || 'skills/approved';
    this.token = config.token;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository or file not found');
      }
      if (response.status === 403) {
        throw new Error('Rate limited. Please add a GitHub token.');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * 获取所有已审核的技能
   */
  async listSkills(): Promise<GitHubSkill[]> {
    try {
      // 获取技能目录内容
      const dirContent = await this.request<Array<{ name: string; path: string; download_url: string }>>(
        `/repos/${this.owner}/${this.repo}/contents/${this.skillsDir}`
      );

      // 过滤 JSON 文件并获取内容
      const jsonFiles = dirContent.filter(f => f.name.endsWith('.json'));
      const skills = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const content = await this.request<{ content: string }>(file.download_url.replace('https://raw.githubusercontent.com/', `/repos/${this.owner}/${this.repo}/contents/`));
            // 如果是 raw 链接，直接 fetch
            const rawResponse = await fetch(file.download_url);
            if (!rawResponse.ok) return null;
            return await rawResponse.json() as GitHubSkill;
          } catch {
            return null;
          }
        })
      );

      return skills.filter((s): s is GitHubSkill => s !== null);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      return [];
    }
  }

  /**
   * 根据名称获取技能
   */
  async getSkill(name: string): Promise<GitHubSkill | null> {
    try {
      const filePath = `${this.skillsDir}/${name}.json`;
      const content = await this.request<{ content?: string; download_url?: string }>(
        `/repos/${this.owner}/${this.repo}/contents/${filePath}`
      );

      if (content.download_url) {
        const rawResponse = await fetch(content.download_url);
        if (!rawResponse.ok) return null;
        return await rawResponse.json() as GitHubSkill;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * 按标签筛选技能
   */
  async getSkillsByTag(tag: string): Promise<GitHubSkill[]> {
    const skills = await this.listSkills();
    return skills.filter(s => s.metadata?.tags?.includes(tag));
  }

  /**
   * 搜索技能
   */
  async searchSkills(query: string): Promise<GitHubSkill[]> {
    const skills = await this.listSkills();
    const q = query.toLowerCase();
    return skills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.metadata?.tags?.some(t => t.toLowerCase().includes(q))
    );
  }
}

/**
 * 从 GitHub Pages 静态文件加载技能（无需 API 调用）
 */
export class StaticSkillsClient {
  private baseUrl: string;
  private skillsDir: string;

  constructor(baseUrl: string, skillsDir = 'skills') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.skillsDir = skillsDir;
  }

  async listSkills(): Promise<GitHubSkill[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.skillsDir}/index.json`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.skills || [];
    } catch {
      return [];
    }
  }

  async getSkill(name: string): Promise<GitHubSkill | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.skillsDir}/${name}.json`);
      if (!response.ok) return null;
      return await response.json() as GitHubSkill;
    } catch {
      return null;
    }
  }

  async searchSkills(query: string): Promise<GitHubSkill[]> {
    const skills = await this.listSkills();
    const q = query.toLowerCase();
    return skills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }
}
