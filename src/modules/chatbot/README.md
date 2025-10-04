# Chatbot Module

A self-contained chatbot module for the Zia platform that provides AI-powered platform guidance to users.

## Structure

```
src/modules/chatbot/
├── README.md              # This file
├── index.ts              # Module exports
├── config.ts             # Module configuration
├── types.ts              # TypeScript definitions
├── chatbotService.ts     # Core logic
├── chatbotController.ts  # Express controllers
├── chatbotRoutes.ts      # API routes
└── data/
    └── knowledge-base.json # Platform guidance content
```

## Features

- ✅ **Static Knowledge Base**: Reliable, predictable responses
- ✅ **Keyword Matching**: Intelligent question understanding
- ✅ **Express Integration**: Clean REST API endpoints
- ✅ **Modular Design**: Self-contained and reusable
- ✅ **TypeScript Support**: Full type safety
- ✅ **Fallback Responses**: Graceful error handling

## API Endpoints

### POST `/api/chatbot/ask`
Process user questions and return chatbot responses.

**Request:**
```json
{
  "message": "How do I book a service?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "How do I book a service?",
    "answer": "**Booking Services**\n\nTo book a service...",
    "timestamp": "2025-09-11T12:00:00.000Z"
  }
}
```

### POST `/api/chatbot/suggestions`
Get quick question suggestions for users.

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "How do I book a service?",
      "How do I become a provider?",
      "How do payments work?"
    ],
    "timestamp": "2025-09-11T12:00:00.000Z"
  }
}
```

### GET `/api/chatbot/health`
Health check endpoint for monitoring.

## Knowledge Base Topics

The chatbot can help with:
- Account setup and profile management
- Finding and booking services
- Becoming a service provider
- Using the messaging system
- Payments and ratings
- Safety guidelines
- Troubleshooting common issues

## Usage in Frontend

```typescript
import { chatbotApi } from '../api/chatbotApi';

// Ask a question
const response = await chatbotApi.askQuestion("How do I book a service?");

// Get suggestions
const suggestions = await chatbotApi.getSuggestions();
```

## Customization

To add new knowledge or modify responses:
1. Update `data/knowledge-base.json`
2. Modify keyword matching in `chatbotService.ts`
3. Add new response patterns as needed

## Future Enhancements

- [ ] LLM integration (OpenAI, etc.)
- [ ] Dynamic knowledge base updates
- [ ] Analytics and usage tracking
- [ ] Multi-language support
- [ ] Context-aware conversations
