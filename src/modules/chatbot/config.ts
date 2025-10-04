/**
 * Chatbot Module Configuration
 * 
 * This module provides AI-powered platform guidance for users.
 * It uses a static knowledge base approach with keyword matching
 * for reliable and predictable responses.
 */

export const CHATBOT_CONFIG = {
  // Module settings
  module: {
    name: 'Zia Chatbot',
    enabled: true,
    version: '1.0.0'
  },
  
  // API settings
  api: {
    basePath: '/api/chatbot',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    }
  },
  
  // Response settings
  responses: {
    maxLength: 1000,
    includeTimestamp: true,
    includeSource: false
  },
  
  // Knowledge base settings
  knowledgeBase: {
    autoReload: false, // Set to true in development
    fallbackEnabled: true,
    debugLogging: process.env.NODE_ENV === 'development'
  }
} as const;

export type ChatbotConfig = typeof CHATBOT_CONFIG;
