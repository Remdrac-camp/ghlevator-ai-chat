
// Type definitions for the chatbot application

// User authentication types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API key storage
export interface ApiKeys {
  openai: string;
  goHighLevel: string;
}

// Chatbot types
export interface ChatbotConfig {
  id: string;
  name: string;
  description: string;
  welcomeMessage: string;
  systemPrompt: string;
  openaiParams: OpenAiParams;
  objectives: Objective[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenAiParams {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// GoHighLevel integration
export interface GoHighLevelConfig {
  apiKey: string;
  locationId?: string;
  companyId?: string;
  isAgency: boolean;
  mappedFields: MappedField[];
}

export interface MappedField {
  objectiveId: string;
  ghlFieldId: string;
  ghlFieldName: string;
}

// Chatbot objectives
export interface Objective {
  id: string;
  name: string;
  description: string;
  fieldToExtract: string;
  pattern?: string; // Regex pattern for validation
  completed: boolean;
  order: number;
  conditions?: ObjectiveCondition[];
}

export interface ObjectiveCondition {
  type: 'previous_objective_completed' | 'custom_value_match';
  value: string;
}

// Conversation history
export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  chatbotId: string;
  userId: string;
  messages: Message[];
  extractedData: Record<string, any>;
  objectives: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook types
export interface WebhookPayload {
  message: string;
  userId: string;
  conversationId: string;
  metadata?: Record<string, any>;
}

export interface WebhookResponse {
  message: string;
  objectives: Record<string, boolean>;
  extractedData: Record<string, any>;
}

// GoHighLevel Account Types
export interface GhlAccount {
  id: string;
  name: string;
  locationId?: string;
  companyId?: string;
  apiKey: string;
  active: boolean;
}
