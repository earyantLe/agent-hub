import type { SkillDescriptor as ProtocolSkillDescriptor } from '@agent-hub/protocol';

export interface AgentHubClientConfig {
  registryUrl: string;
  apiKey?: string;
  timeout?: number; // 请求超时（毫秒）
}

export interface AgentHubErrorDetails {
  status: number;
  message?: string;
  details?: Array<{ instancePath: string; message?: string }>;
}

// 从 protocol 包导入 SkillDescriptor 类型
export type SkillDescriptor = ProtocolSkillDescriptor;

/**
 * Agent Hub API 错误类
 */
export class AgentHubError extends Error {
  public readonly status: number;
  public readonly details?: Array<{ instancePath: string; message?: string }>;

  constructor(message: string, status: number, details?: AgentHubErrorDetails['details']) {
    super(message);
    this.name = 'AgentHubError';
    this.status = status;
    this.details = details;
  }

  /**
   * 检查是否为验证错误
   */
  isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * 检查是否为未找到错误
   */
  isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * 检查是否为冲突错误
   */
  isConflict(): boolean {
    return this.status === 409;
  }

  /**
   * 检查是否为速率限制错误
   */
  isRateLimited(): boolean {
    return this.status === 429;
  }
}

export class AgentHubClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: AgentHubClientConfig) {
    this.baseUrl = config.registryUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30000; // 默认 30 秒超时
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: { ...headers, ...options?.headers }
      });

      if (!response.ok) {
        let errorData: { error?: string; message?: string; details?: AgentHubErrorDetails['details'] } = {};
        try {
          errorData = await response.json() as typeof errorData;
        } catch {
          // ignore parse error
        }
        throw new AgentHubError(
          errorData.error || errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.details
        );
      }

      // 处理 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof AgentHubError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AgentHubError('Request timeout', 408);
      }
      throw new AgentHubError('Network error', 0);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async listSkills(query?: string, limit?: number, tag?: string): Promise<SkillDescriptor[]> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (limit) params.set('limit', limit.toString());
    if (tag) params.set('tag', tag);

    const response = await this.request<{ skills: SkillDescriptor[]; total: number }>(`/api/skills?${params}`);
    return response.skills;
  }

  async getSkill(name: string): Promise<SkillDescriptor> {
    return this.request<SkillDescriptor>(`/api/skills/${name}`);
  }

  async submitSkill(descriptor: SkillDescriptor): Promise<{ id: number; status: string; message: string }> {
    return this.request<{ id: number; status: string; message: string }>('/api/skills', {
      method: 'POST',
      body: JSON.stringify({ descriptor })
    });
  }

  async updateSkill(id: number, descriptor?: SkillDescriptor, status?: 'pending' | 'approved' | 'rejected'): Promise<SkillDescriptor> {
    return this.request<SkillDescriptor>(`/api/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ descriptor, status })
    });
  }

  async deleteSkill(id: number): Promise<void> {
    await this.request<void>(`/api/skills/${id}`, {
      method: 'DELETE'
    });
  }

  async batchDeleteSkills(ids: number[]): Promise<{ deletedCount: number }> {
    return this.request<{ deletedCount: number }>('/api/skills/batch/delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  }

  async batchApproveSkills(ids: number[], status: 'approved' | 'rejected'): Promise<{ updatedCount: number }> {
    return this.request<{ updatedCount: number }>('/api/skills/batch/approve', {
      method: 'POST',
      body: JSON.stringify({ ids, status })
    });
  }
}
