export interface AgentHubClientConfig {
  registryUrl: string;
  apiKey?: string;
}

export interface SkillDescriptor {
  name: string;
  version: string;
  description: string;
  capabilities: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
  [key: string]: unknown;
}

export class AgentHubClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: AgentHubClientConfig) {
    this.baseUrl = config.registryUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options?.headers }
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async listSkills(query?: string, limit?: number): Promise<SkillDescriptor[]> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (limit) params.set('limit', limit.toString());

    const response = await this.request<any>(`/api/skills?${params}`);
    return (response as { skills: SkillDescriptor[] }).skills;
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
}
