export type KnowledgeType = 'faq' | 'product' | 'policy' | 'general';
export type Priority = 'high' | 'normal' | 'low';

export interface KnowledgeEntry {
  id: string;
  type: KnowledgeType;
  question: string;
  answer: string;
  tags: string[];
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  companyName: string;
  systemPrompt: string;
  fallbackMsg: string;
  chatbotTitle: string;
  welcomeMsg: string;
  primaryColor: string;
  lastTrained: string | null;
}

export interface QueryLog {
  id: string;
  query: string;
  response: string;
  matchedEntries: string[];
  timestamp: string;
}

export interface Stats {
  total: number;
  categories: number;
  byType: Record<KnowledgeType, number>;
  todayQueries: number;
  lastTrained: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: string; type: KnowledgeType; question: string; score: number }[];
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { msg: string; path: string }[];
}
