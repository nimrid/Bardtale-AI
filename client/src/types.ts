export interface Tier {
  id: 'mini' | 'standard' | 'deluxe';
  name: string;
  description: string;
  pages: number;
  illustrations: number;
  nim_amount: number;
  badge: string;
  accent: string;
}

export interface CustomizationForm {
  character_name: string;
  theme: string;
  tone: string;
  special_detail: string;
}

export type OrderStatus = 
  | 'pending_payment'
  | 'paid'
  | 'generating_text'
  | 'generating_images'
  | 'assembling_pdf'
  | 'complete'
  | 'failed';

export interface StoryPage {
  page_number: number;
  text: string;
  illustration_prompt: string;
}

export interface CostLog {
  llm_tokens?: number;
  image_credits?: number;
  elapsed_seconds?: number;
}

export interface Order {
  id: string;
  device_id: string;
  wallet_address?: string;
  tier: 'mini' | 'standard' | 'deluxe';
  customization_fields: CustomizationForm;
  status: OrderStatus;
  nim_amount: number;
  created_at: number;
  story_title?: string;
  pages?: StoryPage[];
  illustrated_pages?: number[];
  cost_log?: CostLog;
}

export interface CreateOrderResponse {
  order_id: string;
  status: OrderStatus;
  nim_amount: number;
  receiver_wallet: string;
  tier: Tier;
  created_at: number;
}

export interface MusicTrack {
  id: string;
  device_id: string;
  title: string;
  prompt: string;
  duration: number;
  audio_path?: string;
  status: 'generating' | 'complete' | 'failed';
  nim_amount: number;
  created_at: number;
}
