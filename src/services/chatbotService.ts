import * as fs from 'fs';
import * as path from 'path';

interface KnowledgeBase {
  platform_guide: Record<string, {
    title: string;
    content: string[];
  }>;
  quick_answers: Record<string, string>;
}

class ChatbotService {
  private knowledgeBase: KnowledgeBase = {
    platform_guide: {},
    quick_answers: {}
  };

  constructor() {
    this.loadKnowledgeBase();
  }

  private loadKnowledgeBase() {
    try {
      const filePath = path.join(__dirname, '../data/knowledge-base.json');
      const data = fs.readFileSync(filePath, 'utf8');
      this.knowledgeBase = JSON.parse(data);
      console.log('✅ Chatbot knowledge base loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load knowledge base:', error);
      // Fallback knowledge base
      this.knowledgeBase = {
        platform_guide: {},
        quick_answers: {
          default: "I'm here to help you navigate the Zia platform! You can ask me about booking services, messaging, payments, safety guidelines, and more."
        }
      };
    }
  }

  async processQuestion(question: string): Promise<string> {
    const lowerQuestion = question.toLowerCase();
    console.log('🤖 Processing question:', lowerQuestion);
    
    // Enhanced keyword matching for common questions
    if (this.containsKeywords(lowerQuestion, ['become', 'provider', 'offer', 'service', 'sell'])) {
      const providerData = this.knowledgeBase.platform_guide.offering_services;
      if (providerData) {
        return `**${providerData.title}**\n\n${providerData.content.join('\n\n')}`;
      }
    }

    if (this.containsKeywords(lowerQuestion, ['book', 'booking', 'reserve'])) {
      const bookingData = this.knowledgeBase.platform_guide.booking_process;
      if (bookingData) {
        return `**${bookingData.title}**\n\n${bookingData.content.join('\n\n')}`;
      }
    }

    if (this.containsKeywords(lowerQuestion, ['message', 'chat', 'conversation', 'talk'])) {
      const messagingData = this.knowledgeBase.platform_guide.messaging_system;
      if (messagingData) {
        return `**${messagingData.title}**\n\n${messagingData.content.join('\n\n')}`;
      }
    }

    if (this.containsKeywords(lowerQuestion, ['pay', 'payment', 'money', 'rate', 'rating'])) {
      const paymentData = this.knowledgeBase.platform_guide.payments_ratings;
      if (paymentData) {
        return `**${paymentData.title}**\n\n${paymentData.content.join('\n\n')}`;
      }
    }

    if (this.containsKeywords(lowerQuestion, ['safe', 'safety', 'secure', 'security'])) {
      const safetyData = this.knowledgeBase.platform_guide.safety_guidelines;
      if (safetyData) {
        return `**${safetyData.title}**\n\n${safetyData.content.join('\n\n')}`;
      }
    }

    if (this.containsKeywords(lowerQuestion, ['profile', 'account', 'setup', 'sign up'])) {
      const setupData = this.knowledgeBase.platform_guide.account_setup;
      if (setupData) {
        return `**${setupData.title}**\n\n${setupData.content.join('\n\n')}`;
      }
    }

    if (this.containsKeywords(lowerQuestion, ['find', 'search', 'look', 'browse'])) {
      const findData = this.knowledgeBase.platform_guide.finding_services;
      if (findData) {
        return `**${findData.title}**\n\n${findData.content.join('\n\n')}`;
      }
    }

    if (this.containsKeywords(lowerQuestion, ['problem', 'issue', 'error', 'trouble', 'help'])) {
      const troubleData = this.knowledgeBase.platform_guide.troubleshooting;
      if (troubleData) {
        return `**${troubleData.title}**\n\n${troubleData.content.join('\n\n')}`;
      }
    }

    // Check for quick answers with flexible matching
    for (const [key, answer] of Object.entries(this.knowledgeBase.quick_answers)) {
      if (this.isQuestionMatch(lowerQuestion, key)) {
        return answer;
      }
    }

    // Check platform guide sections with original matching
    for (const [section, data] of Object.entries(this.knowledgeBase.platform_guide)) {
      if (this.isQuestionMatch(lowerQuestion, section) || 
          this.isQuestionMatch(lowerQuestion, data.title.toLowerCase())) {
        return `**${data.title}**\n\n${data.content.join('\n\n')}`;
      }
    }

    console.log('🔄 No specific match found, using default response');
    return this.getDefaultResponse(lowerQuestion);
  }

  private isQuestionMatch(question: string, keyword: string): boolean {
    const questionWords = question.split(/\s+/);
    const keywordWords = keyword.replace(/_/g, ' ').split(/\s+/);
    
    return keywordWords.some(word => 
      questionWords.some(qWord => 
        qWord.includes(word) || word.includes(qWord)
      )
    );
  }

  private containsKeywords(question: string, keywords: string[]): boolean {
    return keywords.some(keyword => 
      question.includes(keyword.toLowerCase())
    );
  }

  getSuggestions(): string[] {
    return [
      "How do I book a service?",
      "How do I use the messaging system?",
      "How do I become a service provider?",
      "What are the safety guidelines?",
      "How do payments work?",
      "How do I rate my experience?",
      "Where can I find my conversations?",
      "How do I set up my profile?"
    ];
  }

  private getDefaultResponse(question: string): string {
    // Provide helpful suggestions based on common question patterns
    if (question.includes('book') || question.includes('booking')) {
      return this.knowledgeBase.quick_answers.how_to_book || 
        "To book a service, find what you need and click 'Book Now'. I can help you with the booking process!";
    }
    
    if (question.includes('message') || question.includes('chat') || question.includes('conversation')) {
      return this.knowledgeBase.quick_answers.how_to_message || 
        "You can access all your conversations through the Conversation Hub. Need help with messaging?";
    }
    
    if (question.includes('pay') || question.includes('payment')) {
      return this.knowledgeBase.quick_answers.payment_process || 
        "Payments are handled securely through our platform. What specific payment question do you have?";
    }

    if (question.includes('safe') || question.includes('security')) {
      return this.knowledgeBase.quick_answers.safety_first || 
        "Safety is important! Always use our messaging system and verify provider credentials.";
    }

    // General helpful response
    return `I'm here to help you with the Zia platform! I can assist with:

• **Booking services** - How to find and book what you need
• **Messaging** - Using our conversation system  
• **Payments & ratings** - Understanding our payment process
• **Safety guidelines** - Staying safe on the platform
• **Account setup** - Getting your profile ready
• **Becoming a provider** - Offering your own services

What would you like to know more about?`;
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();
