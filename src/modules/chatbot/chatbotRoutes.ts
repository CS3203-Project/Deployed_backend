import { Router, type Express } from 'express';
import { chatbotController } from './chatbotController.js';

const router: ReturnType<typeof Router> = Router();

/**
 * @route   POST /api/chatbot/ask
 * @desc    Process user question and get chatbot response
 * @access  Public
 */
router.post('/ask', chatbotController.askQuestion.bind(chatbotController));

/**
 * @route   POST /api/chatbot/suggestions
 * @desc    Get quick question suggestions
 * @access  Public
 */
router.post('/suggestions', chatbotController.getSuggestions.bind(chatbotController));

/**
 * @route   GET /api/chatbot/health
 * @desc    Health check for chatbot service
 * @access  Public
 */
router.get('/health', chatbotController.healthCheck.bind(chatbotController));

export default router;
