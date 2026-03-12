import axios from 'axios';
import { KnowledgeEntry, AppConfig, QueryLog, Stats, ChatMessage, ApiResponse, KnowledgeType, Priority } from '../types';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

// ── Knowledge ──────────────────────────────────────────────────────────────
export const knowledgeApi = {
  getAll: () => api.get<ApiResponse<KnowledgeEntry[]>>('/knowledge').then(r => r.data),
  getStats: () => api.get<ApiResponse<Stats>>('/knowledge/stats').then(r => r.data),
  create: (data: { type: KnowledgeType; question: string; answer: string; tags: string[]; priority: Priority }) =>
    api.post<ApiResponse<KnowledgeEntry>>('/knowledge', data).then(r => r.data),
  update: (id: string, data: Partial<KnowledgeEntry>) =>
    api.put<ApiResponse<KnowledgeEntry>>(`/knowledge/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/knowledge/${id}`).then(r => r.data),
  export: () => api.get('/knowledge/export', { responseType: 'blob' }).then(r => r.data),
  import: (entries: KnowledgeEntry[]) =>
    api.post<ApiResponse<null>>('/knowledge/import', { entries }).then(r => r.data),
};

// ── Config ─────────────────────────────────────────────────────────────────
export const configApi = {
  get: () => api.get<ApiResponse<AppConfig>>('/config').then(r => r.data),
  update: (data: Partial<AppConfig>) => api.put<ApiResponse<AppConfig>>('/config', data).then(r => r.data),
  train: () => api.post<ApiResponse<AppConfig>>('/config/train').then(r => r.data),
};

// ── Chat (RAG) ─────────────────────────────────────────────────────────────
export const chatApi = {
  send: (query: string, history: { role: 'user' | 'assistant'; content: string }[]) =>
    api.post<ApiResponse<{ reply: string; sources: ChatMessage['sources']; retrievedChunks: number; usedContext: boolean }>>('/chat', { query, history }).then(r => r.data),
};

// ── Ingest ─────────────────────────────────────────────────────────────────
export const ingestApi = {
  reindex: () => api.post<ApiResponse<{ processed: number; succeeded: number; failed: number; totalChunks: number; durationMs: number }>>('/ingest/reindex').then(r => r.data),
  reindexAll: () => api.post<ApiResponse<{ processed: number; succeeded: number; failed: number; totalChunks: number; durationMs: number }>>('/ingest/reindex-all').then(r => r.data),
  upload: (file: File, type: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    return api.post<ApiResponse<{ entriesCreated: number; totalChunks: number; fileName: string }>>('/ingest/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};

// ── Logs ───────────────────────────────────────────────────────────────────
export const logsApi = {
  getAll: (limit?: number) => api.get<ApiResponse<QueryLog[]>>('/logs', { params: { limit } }).then(r => r.data),
  clear: () => api.delete<ApiResponse<null>>('/logs').then(r => r.data),
};

// ── Health ─────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get<{ status: string; api: { anthropic: boolean; openai: boolean }; rag: { totalChunks: number; embeddedEntries: number } }>('/health').then(r => r.data),
};
