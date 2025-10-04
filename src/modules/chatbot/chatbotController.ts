import { Request, Response } from 'express';
import { chatbotService } from './chatbotService.js';

export class ChatbotController {
  
  /**
   * Process user question and return chatbot response
   * POST /api/chatbot/ask
   */
  async askQuestion(req: Request, res: Response) {
    try {
      const { message } = req.body;

      // Validate input
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a non-empty string',
          data: {
            question: message || '',
            answer: "Please provide a valid question! I'm here to help you with the Zia platform.",
            timestamp: new Date().toISOString()
          }
        });
      }

      // Process the question
      const answer = await chatbotService.processQuestion(message.trim());

      return res.status(200).json({
        success: true,
        data: {
          question: message.trim(),
          answer: answer,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Chatbot error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Sorry, I encountered an error processing your question. Please try again.',
        data: {
          question: req.body?.message || '',
          answer: "I'm having trouble right now, but I'm here to help! Try asking about booking services, messaging, payments, or platform navigation.",
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get quick question suggestions
   * POST /api/chatbot/suggestions
   */
  async getSuggestions(req: Request, res: Response) {
    try {
      const suggestions = chatbotService.getSuggestions();

      return res.status(200).json({
        success: true,
        data: {
          suggestions,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Suggestions error:', error);

      // Fallback suggestions
      return res.status(200).json({
        success: true,
        data: {
          suggestions: [
            "How do I book a service?",
            "How do I use messaging?",
            "How do payments work?",
            "How do I become a provider?"
          ],
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Health check for chatbot service
   * GET /api/chatbot/health
   */
  async healthCheck(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      service: 'Chatbot Service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const chatbotController = new ChatbotController();
