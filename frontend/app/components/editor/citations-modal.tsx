"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";
import {
  BookOpen,
  Plus,
  Copy,
  Check,
  Trash2,
  Search,
  GraduationCap,
  FileText,
  Globe,
  Users,
  Edit3,
  X,
} from "lucide-react";
import CitationService from "../../lib/utils/citationService";
import CitationAccessControl, {
  UserCitationPermissions,
} from "../../lib/utils/citationAccessControl";
import AddCitationModal from "../citations/AddCitationModal";

interface Author {
  firstName: string;
  lastName: string;
}

interface Citation {
  id: string;
  type: string;
  title: string;
  authors: Author[];
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  isbn?: string;
  edition?: string;
  place?: string;
  conference?: string;
  abstract?: string;
  tags?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface CitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  projectId?: string;
  onCitationSelected?: (citation: Citation) => void;
  onCitationAdded?: () => void;
  onEditCitation?: (citation: Citation) => void;
}

export function CitationsModal({
  isOpen,
  onClose,
  editor,
  projectId,
  onCitationSelected,
  onCitationAdded,
  onEditCitation,
}: CitationsModalProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [filteredCitations, setFilteredCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<"apa" | "mla" | "chicago">("apa");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<UserCitationPermissions | null>(
    null,
  );
  const [accessChecked, setAccessChecked] = useState(false);

  // Check user's citation access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await CitationAccessControl.getUserCitationAccess();
        setAccessInfo(access);
      } catch (err) {
        console.error("Error checking citation access:", err);
      } finally {
        setAccessChecked(true);
      }
    };

    if (isOpen) {
      checkAccess();
    }
  }, [isOpen]);

  const fetchCitations = useCallback(async () => {
    // If no projectId is provided, don't try to fetch citations
    if (!projectId) {
      setCitations([]);
      setFilteredCitations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedCitations =
        await CitationService.getProjectCitations(projectId);
      setCitations(fetchedCitations);
      setFilteredCitations(fetchedCitations);
    } catch (err: any) {
      setError(
        "Failed to fetch citations: " + (err.message || "Unknown error"),
      );
      console.error("Fetch citations error:", err);
      // Set citations to empty array on error
      setCitations([]);
      setFilteredCitations([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch citations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCitations();
    }
  }, [isOpen, projectId, fetchCitations]);

  // Filter citations based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCitations(citations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = citations.filter(
        (citation) =>
          citation.title.toLowerCase().includes(query) ||
          citation.authors.some(
            (author) =>
              author.firstName.toLowerCase().includes(query) ||
              author.lastName.toLowerCase().includes(query),
          ) ||
          (citation.journal &&
            citation.journal.toLowerCase().includes(query)) ||
          (citation.year && citation.year.toString().includes(query)),
      );
      setFilteredCitations(filtered);
    }
  }, [searchQuery, citations]);

  const formatCitation = (citation: Citation): string => {
    return CitationService.formatCitation(citation, style);
  };

  const copyCitation = (citation: Citation) => {
    navigator.clipboard.writeText(formatCitation(citation));
    setCopiedId(citation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const insertCitation = (citation: Citation) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent(
          `(${citation.authors[0]?.lastName || citation.authors[0]?.firstName || "Author"}, ${citation.year || "N.d."})`,
        )
        .run();
    }
  };

  const handleCitationSelect = (citation: Citation) => {
    if (onCitationSelected) {
      onCitationSelected(citation);
    }
    onClose();
  };

  const handleNewCitationAdded = () => {
    if (onCitationAdded) {
      onCitationAdded();
    }
    fetchCitations(); // Refresh the citation list
  };

  const deleteCitation = async (id: string) => {
    try {
      await CitationService.deleteCitation(id);
      setCitations(citations.filter((c) => c.id !== id));
      setFilteredCitations(filteredCitations.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(
        "Failed to delete citation: " + (err.message || "Unknown error"),
      );
      console.error("Delete citation error:", err);
    }
  };

  const typeIcons = {
    article: FileText,
    book: BookOpen,
    website: Globe,
    conference: Users,
  };

  if (!accessChecked) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Citation Manager
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-black">Checking citation access...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white border border-gray-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Citation Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="existing">
              Existing Citations ({citations.length})
            </TabsTrigger>
            <TabsTrigger value="new">Add New Citation</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search citations by title, author, or year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <X className="h-5 w-5 text-black hover:text-black" />
                  </button>
                )}
              </div>
              <Select
                value={style}
                onValueChange={(v) => setStyle(v as typeof style)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apa">APA</SelectItem>
                  <SelectItem value="mla">MLA</SelectItem>
                  <SelectItem value="chicago">Chicago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="p-4 border border-white rounded-lg animate-pulse">
                      <div className="h-4 bg-cw-light-gray rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-cw-light-gray rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-cw-light-gray rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : filteredCitations.length > 0 ? (
                <div className="space-y-4">
                  {filteredCitations.map((citation) => {
                    const Icon =
                      typeIcons[citation.type as keyof typeof typeIcons] ||
                      FileText;
                    return (
                      <div
                        key={citation.id}
                        className="p-4 border border-border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleCitationSelect(citation)}>
                            <div className="flex items-center">
                              <Icon className="h-5 w-5 text-blue-600 mr-2" />
                              <h3 className="font-medium text-black">
                                {citation.title}
                              </h3>
                            </div>
                            <p className="mt-1 text-sm text-black">
                              {citation.authors
                                ?.map(
                                  (author) =>
                                    `${author.firstName} ${author.lastName}`,
                                )
                                .join(", ")}
                            </p>
                            <div className="mt-1 flex items-center text-sm text-black">
                              <span>{citation.year}</span>
                              {citation.journal && (
                                <span className="mx-2">•</span>
                              )}
                              <span>{citation.journal}</span>
                              {citation.doi && <span className="mx-2">•</span>}
                              <span>DOI: {citation.doi}</span>
                            </div>
                            {citation.abstract && (
                              <p className="mt-2 text-sm text-black line-clamp-2">
                                {citation.abstract}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-600 bg-blue-150 hover:bg-blue-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyCitation(citation);
                              }}>
                              {copiedId === citation.id ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-600 bg-blue-150 hover:bg-blue-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCitation(citation);
                              }}>
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            {onEditCitation && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-blue-600 bg-blue-150 hover:bg-blue-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditCitation(citation);
                                  onClose();
                                }}>
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive bg-purple-600 hover:bg-purple-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCitation(citation.id);
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-black" />
                  <h3 className="mt-2 text-sm font-medium text-black">
                    No citations found
                  </h3>
                  <p className="mt-1 text-sm text-black">
                    Try different keywords or add a new citation
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-black" />
                  <h3 className="mt-2 text-sm font-medium text-black">
                    No citations yet
                  </h3>
                  <p className="mt-1 text-sm text-black">
                    Add your first citation to get started
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => setActiveTab("new")}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-300 rounded-lg hover:bg-blue-400 transition-colors cursor-pointer">
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      Add Citation
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-6">
              <p className="text-sm text-black">
                Add a new citation to your project. You can search for existing
                sources or enter details manually.
              </p>
              <AddCitationModal
                projectId={projectId}
                onCitationAdded={handleNewCitationAdded}
                isOpen={true}
                onClose={() => setActiveTab("existing")}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            className="px-4 py-2 bg-gray-500 rounded-lg hover:bg-white transition-colors cursor-pointer"
            onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
