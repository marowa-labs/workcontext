import React from "react";
import { Sparkles, ThumbsUp, ThumbsDown, X, Play, Pause } from "lucide-react";
import { Button } from "../../ui/button";
import { AudioPlayerState } from "./types";

interface StudioAudioPlayerProps {
  state: AudioPlayerState;
  onClose: () => void;
  onTogglePlay: () => void;
}

export function StudioAudioPlayer({
  state,
  onClose,
  onTogglePlay,
}: StudioAudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  // Format time helper
  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Sync play state
  React.useEffect(() => {
    if (state.isPlaying) {
      audioRef.current?.play().catch((e) => console.error("Playback error", e));
    } else {
      audioRef.current?.pause();
    }
  }, [state.isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-3 space-y-2 animate-in slide-in-from-bottom-4">
      {/* Hidden Audio Element */}
      {state.audioUrl && (
        <audio
          ref={audioRef}
          src={state.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => onTogglePlay()} // Toggle to pause on end
        />
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-bold text-gray-900 truncate leading-tight">
            {state.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Interactive
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-600">
            <ThumbsUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-600">
            <ThumbsDown className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 text-gray-400 hover:text-red-500">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm shrink-0">
          {state.isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>
        <div className="flex-1 space-y-1">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
