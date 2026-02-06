const BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Feature {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dependsOn: string | null;
  requestedBy: string;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  completedAt: string | null;
  relatedDocs: string | null;
  notes: string | null;
}

export interface FeatureDocument {
  filename: string;
  featureId: string;
  featureName: string;
  status: string;
  implementation: string;
  content: string;
}

export interface AuditEntry {
  id: number;
  featureId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  reason: string | null;
  createdAt: string;
  featureName: string;
}

export interface Notification {
  id: number;
  featureId: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const api = {
  features: {
    list: () => request<Feature[]>('/features'),
    get: (id: string) => request<{ feature: Feature; document: FeatureDocument | null; auditLogs: AuditEntry[] }>(`/features/${id}`),
    create: (data: { name: string; purpose: string; motivation?: string; priority?: string; notes?: string }) =>
      request<Feature>('/features', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, newStatus: string, reason?: string) =>
      request<Feature>(`/features/${id}/status`, { method: 'PUT', body: JSON.stringify({ newStatus, reason }) }),
  },
  audit: {
    list: (featureId?: string) => request<AuditEntry[]>(`/audit${featureId ? `?featureId=${featureId}` : ''}`),
  },
  notifications: {
    list: () => request<{ notifications: Notification[]; unreadCount: number }>('/notifications'),
    markAllRead: () => request<{ success: boolean }>('/notifications/read', { method: 'PUT' }),
  },
  sync: {
    trigger: () => request<{ success: boolean; featuresSync: number; governanceVersion: string }>('/sync', { method: 'POST' }),
  },
  governance: {
    get: () => request<{ version: string; content: string }>('/governance'),
  },
  health: {
    check: () => request<{ status: string }>('/health'),
  },
};
