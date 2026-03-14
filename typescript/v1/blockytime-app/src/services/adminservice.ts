export interface PullDbResult {
  status: 'success' | 'error';
  device?: string;
  size_kb?: number;
  message?: string;
}

export interface AdminServiceInterface {
  pullDb(): Promise<PullDbResult>;
}

export class AdminService implements AdminServiceInterface {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api/v1') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async pullDb(): Promise<PullDbResult> {
    const response = await fetch(`${this.apiBaseUrl}/admin/pull-db`, {
      method: 'POST',
    });
    const result = await response.json() as PullDbResult;
    return result;
  }
}
