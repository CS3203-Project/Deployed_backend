/**
 * Chatbot Module Type Definitions
 */

export interface ChatMessage {
  question: string;
  answer: string;
  timestamp: string;
}

export interface ChatbotResponse {
  success: boolean;
  data: ChatMessage;
  error?: string;
}

export interface SuggestionsResponse {
  success: boolean;
  data: {
    suggestions: string[];
    timestamp: string;
  };
}

export interface KnowledgeBase {
  platform_guide: Record<string, {
    title: string;
    content: string[];
  }>;
  quick_answers: Record<string, string>;
}

export interface HealthCheckResponse {
  success: boolean;
  service: string;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
}

// Request types
export interface AskQuestionRequest {
  message: string;
}

// Internal types
export interface ProcessedQuestion {
  original: string;
  normalized: string;
  keywords: string[];
}
