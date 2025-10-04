// Chatbot Module - Clean exports for external use
export { chatbotService } from './chatbotService.js';
export { chatbotController } from './chatbotController.js';
export { default as chatbotRoutes } from './chatbotRoutes.js';

// Module information
export const CHATBOT_MODULE_INFO = {
  name: 'Chatbot Module',
  version: '1.0.0',
  description: 'AI-powered platform guidance chatbot',
  endpoints: [
    'POST /api/chatbot/ask - Process user questions',
    'POST /api/chatbot/suggestions - Get quick suggestions', 
    'GET /api/chatbot/health - Health check'
  ]
} as const;
