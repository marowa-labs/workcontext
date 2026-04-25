export interface StudioItem {
  id: string;
  type:
    | "note"
    | "audio"
    | "mind_map"
    | "report"
    | "flashcards"
    | "quiz"
    | "data_table"
    | "infographic"
    | "slide_deck";
  title: string;
  time: string;
  icon: any;
  sourceCount?: number;
  badge?: string;
  content?: string;
  audioUrl?: string; // Added for real audio
}

export interface AudioPlayerState {
  isOpen: boolean;
  isPlaying: boolean;
  progress: number;
  title: string;
  audioUrl?: string; // Added for real audio
}
