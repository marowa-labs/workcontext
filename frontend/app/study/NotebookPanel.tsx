"use client";

import { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Plus,
  Combine,
  CheckSquare,
  Sparkles,
  BookOpen,
  Target,
  FileText,
  Network,
  Hash,
  HelpCircle,
  Table,
  BarChart3,
  Presentation,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { NoteService, Note } from "../lib/utils/noteService";

// Category icons and colors mapping
const CATEGORY_CONFIG: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  audio: {
    icon: Sparkles,
    color: "bg-indigo-600",
    label: "Audio Overview",
  },
  lit_review: { icon: FileText, color: "bg-blue-600", label: "Lit Review" },
  mind_map: { icon: Network, color: "bg-gray-600", label: "Mind Map" },
  report: { icon: BookOpen, color: "bg-amber-600", label: "Report" },
  flashcards: { icon: Hash, color: "bg-rose-600", label: "Flashcards" },
  quiz: { icon: HelpCircle, color: "bg-blue-600", label: "Quiz" },
  data_table: { icon: Table, color: "bg-indigo-600", label: "Data Table" },
  infographic: {
    icon: BarChart3,
    color: "bg-purple-600",
    label: "Infographic",
  },
  slide_deck: {
    icon: Presentation,
    color: "bg-teal-600",
    label: "Slide Deck",
  },
  manual: { icon: Target, color: "bg-green-600", label: "Note" },
};

const CATEGORIES = [
  { id: "all", label: "All Notes" },
  { id: "audio", label: "Audio" },
  { id: "lit_review", label: "Lit Review" },
  { id: "mind_map", label: "Mind Map" },
  { id: "report", label: "Reports" },
  { id: "flashcards", label: "Flashcards" },
  { id: "quiz", label: "Quiz" },
  { id: "data_table", label: "Data Tables" },
  { id: "infographic", label: "Infographics" },
  { id: "slide_deck", label: "Slide Decks" },
  { id: "manual", label: "My Notes" },
];

import { AddNoteModal } from "../components/study/AddNoteModal";
import { ResearchService } from "../lib/utils/researchService";

interface NotebookPanelProps {
  projectId: string;
}

export function NotebookPanel({ projectId }: NotebookPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Fetch User ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await ResearchService.getCurrentUser();
        if (user) setUserId(user.id);
      } catch (e) {
        console.error("Failed to fetch user", e);
      }
    };
    fetchUser();
  }, []);

  // Fetch notes on mount and when category changes
  useEffect(() => {
    if (!projectId) return;

    const fetchNotes = async () => {
      try {
        setIsLoading(true);
        const fetchedNotes = await NoteService.getNotes(
          projectId,
          selectedCategory === "all" ? undefined : selectedCategory,
        );
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [projectId, selectedCategory, reloadTrigger]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotes(newSelected);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await NoteService.deleteNote(id);
      setNotes(notes.filter((n) => n.id !== id));
      const newSelected = new Set(selectedNotes);
      newSelected.delete(id);
      setSelectedNotes(newSelected);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffInMs = now.getTime() - noteDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / (24 * 7))}w ago`;
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 p-6">
      <div className="w-full space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800 px-2">
              Recent Notes
            </h2>
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
              {notes.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedNotes.size > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 gap-2">
                <Combine className="w-4 h-4" />
                Synthesize ({selectedNotes.size})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddNoteModalOpen(true)}
              className="gap-2 bg-white text-gray-500 hover:bg-gray-200 hover:text-gray-600">
              <Plus className="w-4 h-4" />
              Add Note
            </Button>
            <Button variant="ghost" size="icon">
              <CheckSquare className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 mt-4">Loading notes...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notes.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No notes yet
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedCategory === "all"
                ? "Start by generating Studio content or creating manual notes"
                : `No ${CATEGORIES.find((c) => c.id === selectedCategory)?.label} notes found`}
            </p>
          </div>
        )}

        {/* Notes Grid */}
        {!isLoading && notes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {notes.map((note) => {
              const config =
                CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.manual;
              const Icon = config.icon;

              return (
                <div
                  key={note.id}
                  className={`group relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-gray-900 cursor-pointer shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ${selectedNotes.has(note.id) ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                  onClick={() => toggleSelect(note.id)}>
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${config.color.replace("bg-", "from-")} to-black/80`}
                  />

                  {/* Content Container */}
                  <div className="relative h-full flex flex-col justify-between p-4 z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(note.tags) &&
                          note.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="bg-white/20 backdrop-blur-md text-white border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">
                              {tag}
                            </span>
                          ))}
                      </div>
                      <div className="bg-white/20 backdrop-blur-md p-1 rounded-full border border-white/10">
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-white text-base leading-tight text-shadow-sm line-clamp-2">
                        {note.title}
                      </h3>
                      <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-2 font-medium">
                        {note.content.substring(0, 100)}
                        {note.content.length > 100 ? "..." : ""}
                      </p>
                      <div className="pt-2 flex items-center justify-between border-t border-white/10">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          {formatDate(note.created_at)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="text-gray-400 hover:text-white transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selection Checkmark Overlay */}
                  {selectedNotes.has(note.id) && (
                    <div className="absolute inset-0 bg-blue-500/20 z-20 flex items-center justify-center">
                      <div className="bg-blue-500 text-white p-1.5 rounded-full shadow-lg">
                        <CheckSquare className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State / Add New */}
            <div
              onClick={() => setIsAddNoteModalOpen(true)}
              className="aspect-[3/2] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center text-gray-400 hover:border-blue-300 hover:bg-blue-50/10 cursor-pointer transition-all group">
              <div className="p-3 bg-gray-50 rounded-full mb-2 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Add new note</span>
            </div>
          </div>
        )}
      </div>

      <AddNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        userId={userId}
        projectId={projectId}
        onSuccess={() => setReloadTrigger((prev) => prev + 1)}
      />
    </div>
  );
}
