"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { ScrollArea } from "../../ui/scroll-area";
import {
  BookOpen,
  Plus,
  Copy,
  Check,
  Trash2,
  Search,
  FileText,
  Globe,
  Users,
  X,
  Upload,
  Info,
} from "lucide-react";
import CitationService from "../../../lib/utils/citationService";
import CitationAccessControl, {
  UserCitationPermissions,
} from "../../../lib/utils/citationAccessControl";
import AddCitationModal from "../../citations/AddCitationModal";
import { CitationStyleSearch } from "../../citations/CitationStyleSearch";

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

interface CitationsPanelProps {
  projectId: string;
  documentTitle?: string;
  editor?: Editor | null;
}

export function CitationsPanel({
  projectId,
  documentTitle,
  editor,
}: CitationsPanelProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [filteredCitations, setFilteredCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<string>("apa");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<UserCitationPermissions | null>(
    null,
  );
  const [accessChecked, setAccessChecked] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    styleName: string;
    explanation: string;
  } | null>(null);

  // Reference for file input
  const fileInputRef = useState<HTMLInputElement | null>(null);

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
    checkAccess();
  }, []);

  const fetchCitations = useCallback(async () => {
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
      setCitations([]);
      setFilteredCitations([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch citations when mounted or projectId changes
  useEffect(() => {
    fetchCitations();
  }, [projectId, fetchCitations]);

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
    // Dispatch event for editor to catch if direct prop isn't available
    const event = new CustomEvent("insert-citation", {
      detail: {
        text: CitationService.formatInTextCitation(citation, style),
      },
    });
    window.dispatchEvent(event);
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

  const handleNewCitationAdded = () => {
    fetchCitations();
    setActiveTab("existing");
  };

  const handleMatchStyleFromFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      const result = await CitationService.analyzeStyleViaPDF(file);
      setStyle(result.styleId);
      setAnalysisResult({
        styleName: result.styleName,
        explanation: result.explanation,
      });

      // Clear the file input
      if (e.target) e.target.value = "";
    } catch (err: any) {
      setError("Failed to analyze style: " + (err.message || "Unknown error"));
      console.error("Style analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);

  const handleMatchStyleFromUrl = async (url: string) => {
    try {
      setAnalyzingUrl(url);
      setError(null);
      setAnalysisResult(null);

      const result = await CitationService.analyzeStyleViaURL(url);
      setStyle(result.styleId);
      setAnalysisResult({
        styleName: result.styleName,
        explanation: result.explanation,
      });
    } catch (err: any) {
      setError(
        "Failed to analyze style from URL: " + (err.message || "Unknown error"),
      );
      console.error("URL style analysis error:", err);
    } finally {
      setAnalyzingUrl(null);
    }
  };

  const handleInsertBibliography = () => {
    if (citations.length === 0) return;

    // Generate bibliography text
    const bibliographyText = CitationService.generateBibliography(
      filteredCitations.length > 0 ? filteredCitations : citations,
      style,
    );

    // Dispatch event for editor
    const event = new CustomEvent("insert-content", {
      detail: {
        content: `\n\n# References\n\n${bibliographyText}`,
      },
    });
    window.dispatchEvent(event);
  };

  const typeIcons = {
    article: FileText,
    book: BookOpen,
    website: Globe,
    conference: Users,
  };

  if (!accessChecked) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header handled by EditorPage usually, but we can add tabs content here */}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex-1 flex flex-col h-full">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 mb-2">
            <TabsTrigger
              value="existing"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600">
              Library ({citations.length})
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600">
              Add New
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInsertBibliography}
              disabled={citations.length === 0}
              className="flex-1 text-xs border-dashed border-gray-300 text-white hover:text-blue-600 hover:border-blue-300">
              <FileText className="w-3.5 h-3.5 mr-2" />
              Insert Bibliography
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                id="style-upload"
                onChange={handleMatchStyleFromFile}
              />
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-300">
                <label
                  htmlFor="style-upload"
                  className="cursor-pointer flex items-center text-white">
                  {analyzing ? (
                    <div className="w-3.5 h-3.5 mr-2 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-2 text-white" />
                  )}
                  Cite Like...
                </label>
              </Button>
            </div>
          </div>

          {analysisResult && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded text-[11px] text-blue-700 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-start gap-1.5">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-blue-800">
                    Style Matched: {analysisResult.styleName}
                  </span>
                  <p className="mt-0.5 opacity-80 leading-snug">
                    {analysisResult.explanation}
                  </p>
                </div>
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="ml-auto hover:text-blue-900">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        <TabsContent
          value="existing"
          className="flex-1 overflow-hidden flex flex-col px-4 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm bg-white border-gray-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <CitationStyleSearch value={style} onChange={setStyle} />
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600">
              {error}
            </div>
          )}

          <ScrollArea className="flex-1 -mr-3 pr-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-3 border border-gray-100 rounded-lg animate-pulse">
                    <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2"></div>
                    <div className="h-2.5 bg-gray-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredCitations.length > 0 ? (
              <div className="space-y-3 pb-8">
                {filteredCitations.map((citation) => {
                  const Icon =
                    typeIcons[citation.type as keyof typeof typeIcons] ||
                    FileText;
                  return (
                    <div
                      key={citation.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                      <div className="flex items-start gap-3">
                        <Icon className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                            {citation.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {citation.authors
                              ?.map(
                                (a) => `${a.lastName}, ${a.firstName?.[0]}.`,
                              )
                              .join("; ")}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                              {citation.year || "N.d."}
                            </span>
                            <span className="uppercase">{citation.type}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-500 hover:text-blue-600"
                          onClick={() => copyCitation(citation)}
                          title="Copy Citation">
                          {copiedId === citation.id ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          Copy
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-500 hover:text-green-600"
                          onClick={() => insertCitation(citation)}
                          title="Insert into document">
                          <Plus className="h-3 w-3 mr-1" />
                          Cite
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 ml-auto"
                          onClick={() => deleteCitation(citation.id)}
                          title="Delete">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-10 opacity-60">
                <Search className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-xs text-gray-500">No matches found</p>
              </div>
            ) : (
              <div className="text-center py-10 opacity-60">
                <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-xs text-gray-500">
                  Your library is empty
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="new" className="flex-1 overflow-y-auto px-4 pb-4">
          <AddCitationModal
            projectId={projectId}
            onCitationAdded={handleNewCitationAdded}
            isOpen={true}
            onClose={() => {}}
            isPanel={true}
            onMatchStyle={handleMatchStyleFromUrl}
            analyzingUrl={analyzingUrl}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
