/**
 * Embedded Knowledge Base for Chatbot
 * This ensures the knowledge base is always available after compilation
 */

export const KNOWLEDGE_BASE = {
  platform_guide: {
    getting_started: {
      title: "Getting Started with Zia Platform",
      content: [
        "Welcome to Zia! This is your service marketplace platform.",
        "To get started: 1) Create your account, 2) Complete your profile, 3) Browse or offer services",
        "You can be both a service provider and a customer on our platform"
      ]
    },
    account_setup: {
      title: "Account Setup",
      content: [
        "Complete your profile with accurate information",
        "Upload a professional profile picture",
        "Verify your email address and phone number",
        "Add your location and preferred service categories"
      ]
    },
    finding_services: {
      title: "How to Find Services",
      content: [
        "Use the search bar to find specific services",
        "Browse by categories in the main navigation",
        "Filter results by location, price, and ratings",
        "Read provider profiles and reviews before booking"
      ]
    },
    booking_process: {
      title: "Booking Services",
      content: [
        "Click 'Book Now' on any service you want",
        "Fill in your requirements and preferred time",
        "Wait for provider confirmation",
        "Communicate through our messaging system",
        "Both parties must confirm before service delivery"
      ]
    },
    offering_services: {
      title: "Offering Services",
      content: [
        "Switch to Provider mode in your profile",
        "Create detailed service listings with clear descriptions",
        "Set competitive pricing and availability",
        "Upload relevant photos and certifications",
        "Respond promptly to customer inquiries"
      ]
    },
    messaging_system: {
      title: "Communication & Messaging",
      content: [
        "All communication happens through our secure messaging system",
        "Access conversations from the Conversation Hub",
        "Use the confirmation panel to track booking status",
        "Both customer and provider must confirm completion",
        "Chat history is preserved for your records"
      ]
    },
    payments_ratings: {
      title: "Payments & Ratings",
      content: [
        "Payments are processed securely through our platform",
        "Rate your experience after service completion",
        "Both customers and providers can leave reviews",
        "Ratings help build trust in our community",
        "Contact support for any payment issues"
      ]
    },
    safety_guidelines: {
      title: "Safety Guidelines",
      content: [
        "Always communicate through our platform messaging",
        "Meet in public places for in-person services",
        "Verify provider credentials and reviews",
        "Report any suspicious behavior to our support team",
        "Never share personal payment information outside the platform"
      ]
    },
    troubleshooting: {
      title: "Common Issues & Solutions",
      content: [
        "Can't find a conversation? Check the Conversation Hub or refresh the page",
        "Booking not confirmed? Contact the provider through messaging",
        "Payment issues? Contact our support team immediately",
        "Profile not saving? Check your internet connection and try again",
        "Service not appearing? Ensure all required fields are completed"
      ]
    },
    support: {
      title: "Getting Help",
      content: [
        "Use this chatbot for quick platform guidance",
        "Check our FAQ section for common questions",
        "Contact support through the help center",
        "Join our community forums for tips and discussions",
        "Follow our social media for updates and announcements"
      ]
    }
  },
  quick_answers: {
    how_to_book: "To book a service: 1) Find the service you want, 2) Click 'Book Now', 3) Fill in your requirements, 4) Wait for provider confirmation, 5) Communicate through our messaging system.",
    how_to_message: "Access all your conversations through the Conversation Hub. Click on any conversation to view messages and use the confirmation panel to track booking status.",
    how_to_rate: "After both parties confirm service completion, you can rate your experience. Customers rate services, providers rate customers.",
    payment_process: "Payments are handled securely through our platform. You'll be charged after service confirmation and can rate your experience.",
    safety_first: "Always use our messaging system, meet in public for in-person services, verify provider credentials, and report any issues to support.",
    profile_setup: "Complete your profile with accurate info, upload a professional photo, verify your contact details, and add your location and service preferences.",
    become_provider: "To become a service provider: 1) Switch to Provider mode in your profile settings, 2) Create detailed service listings with clear descriptions, 3) Set competitive pricing and availability, 4) Upload relevant photos and certifications, 5) Respond promptly to customer inquiries.",
    find_conversations: "Go to the Conversation Hub to see all your messages. If you can't find a specific conversation, try refreshing the page or check if the URL is correct."
  }
} as const;

export type KnowledgeBaseType = typeof KNOWLEDGE_BASE;
