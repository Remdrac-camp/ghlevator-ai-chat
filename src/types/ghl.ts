export type ChatbotParameter = 'openai_key' | 'system_prompt' | 'welcome_message' | 'temperature' | 'max_tokens';
export type FieldType = 'custom_value' | 'custom_field';

export interface GhlFieldMapping {
  id: string;
  chatbot_id: string;
  field_type: FieldType;
  ghl_field_key: string;
  chatbot_parameter: ChatbotParameter;
  location_id?: string;
  company_id?: string;
}

export interface GhlFieldMappingsProps {
  chatbotId: string;
}

export interface GhlIds {
  locationId?: string;
  companyId?: string;
  isValid: boolean;
}

export const CHATBOT_PARAMETERS = [
  { value: 'openai_key', label: 'OpenAI API Key' },
  { value: 'system_prompt', label: 'System Prompt' },
  { value: 'welcome_message', label: 'Welcome Message' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'max_tokens', label: 'Max Tokens' },
] as const; 