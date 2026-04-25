export interface AIChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  role: "user" | "assistant";
  message_type: "text" | "image" | "file" | "suggestion";
  image_url?: string;
  file_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface AIChatSession {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_active: boolean;
}

export interface AIGeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  file_path?: string;
  created_at: string;
  used_in_project: boolean;
  project_id?: string;
}

export interface SentenceAnalysis {
  text: string;
  aiProbability: number; // 0-100
  isRobotic: boolean;
  position: { start: number; end: number };
  indicators: string[]; // What made it robotic
}

export interface AIDetectionResult {
  overallScore: number; // 0-100, higher = more AI-like
  classification: "human" | "mixed" | "ai";
  confidence: number; // 0-100
  sentences: SentenceAnalysis[];
}
