"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Search,
  Globe,
  Upload,
  Link,
  HardDrive,
  Clipboard,
  ChevronDown,
  Zap,
  Check,
  FileText,
  Folder,
  BookOpen,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { ResearchService } from "../../lib/utils/researchService";

interface AddSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId?: string;
  onSourcesAdded?: () => void;
}

interface Source {
  id: string;
  title: string;
  type?: string;
  url?: string;
  projectId?: string;
}

interface Project {
  id: string;
  title: string;
  sourceCount?: number;
}

interface WebSearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
}

export function AddSourcesModal({ isOpen, onClose, projectId, userId, onSourcesAdded }: AddSourcesModalProps) {
  const [activeTab, setActiveTab] = useState<"sources" | "projects" | "add">("add");

  // Add Sources tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WebSearchResult[]>([]);
  const [selectedSearchResults, setSelectedSearchResults] = useState<Set<string>>(new Set());

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Website URL modal state
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  // Copied text modal state
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [isAddingText, setIsAddingText] = useState(false);

  // Drive coming soon tooltip
  const [showDriveTooltip, setShowDriveTooltip] = useState(false);

  // My Sources tab state
  const [userSources, setUserSources] = useState<Source[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");

  // Projects tab state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  useEffect(() => {
    if (activeTab === "sources" && isOpen) {
      fetchUserSources();
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (activeTab === "projects" && isOpen) {
      fetchProjects();
    }
  }, [activeTab, isOpen]);

  const fetchUserSources = async () => {
    setSourcesLoading(true);
    try {
      const data = await ResearchService.getUserLibrary();
      setUserSources(data || []);
    } catch (error) {
      console.error("Failed to fetch user sources:", error);
    } finally {
      setSourcesLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!userId) {
      console.warn("No userId available to fetch projects");
      return;
    }
    setProjectsLoading(true);
    try {
      const data = await ResearchService.getProjects(userId);
      setProjects(data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Web search functionality
  const handleWebSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await ResearchService.searchWebSources(searchQuery, 10);
      setSearchResults(results.map((r: any, idx: number) => ({
        id: r.id || `result-${idx}`,
        title: r.title || r.name || "Untitled",
        url: r.url || r.link || "",
        snippet: r.snippet || r.description || "",
        favicon: r.favicon,
      })));
    } catch (error) {
      console.error("Web search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSearchResultSelection = (resultId: string) => {
    const newSelected = new Set(selectedSearchResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedSearchResults(newSelected);
  };

  const handleSaveSelectedResults = async () => {
    if (selectedSearchResults.size === 0) return;

    const selected = searchResults.filter(r => selectedSearchResults.has(r.id));
    setIsSearching(true);

    try {
      await ResearchService.saveWebSources(projectId, selected);
      onSourcesAdded?.();
      setSearchResults([]);
      setSelectedSearchResults(new Set());
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to save web sources:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // File upload functionality
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadFiles(Array.from(files));
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);

    try {
      await ResearchService.uploadFiles(projectId, files);
      onSourcesAdded?.();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("File upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFiles(Array.from(files));
    }
  };

  // Website URL functionality
  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;

    // Parse URLs - split by newline or comma
    const urls = urlInput
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0 && u.startsWith('http'));

    if (urls.length === 0) {
      console.error("No valid URLs found");
      return;
    }

    setIsAddingUrl(true);
    try {
      // Add URLs sequentially
      for (const url of urls) {
        await ResearchService.addWebsiteSource(projectId, url, urls.length === 1 ? urlTitle : undefined);
      }
      onSourcesAdded?.();
      setShowUrlModal(false);
      setUrlInput("");
      setUrlTitle("");
    } catch (error) {
      console.error("Failed to add URLs:", error);
    } finally {
      setIsAddingUrl(false);
    }
  };

  // Copied text functionality
  const handleAddText = async () => {
    if (!textContent.trim()) return;

    setIsAddingText(true);
    try {
      await ResearchService.addTextSource(projectId, textContent, textTitle);
      onSourcesAdded?.();
      setShowTextModal(false);
      setTextContent("");
      setTextTitle("");
    } catch (error) {
      console.error("Failed to add text:", error);
    } finally {
      setIsAddingText(false);
    }
  };

  const toggleSourceSelection = (sourceId: string) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId);
    } else {
      newSelected.add(sourceId);
    }
    setSelectedSources(newSelected);
  };

  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleUseSelectedSources = async () => {
    const selectedIds = Array.from(selectedSources);
    if (selectedIds.length === 0) return;

    try {
      await ResearchService.addSourcesToProject(projectId, selectedIds);
      onSourcesAdded?.();
      onClose();
    } catch (error) {
      console.error("Failed to add sources:", error);
    }
  };

  const handleUseSelectedProjects = async () => {
    const selectedIds = Array.from(selectedProjects);
    if (selectedIds.length === 0) return;

    try {
      await ResearchService.importSourcesFromProjects(projectId, selectedIds);
      onSourcesAdded?.();
      onClose();
    } catch (error) {
      console.error("Failed to import sources:", error);
    }
  };

  const supportedFormats = [
    "pdf", "txt", "md", "docx", "csv", "pptx", "epub", "avif", "bmp", "gif",
    "ico", "jp2", "png", "webp", "tif", "tiff", "heic", "heif", "jpeg", "jpg",
    "jpe", "3g2", "3gp", "aac", "aif", "aifc", "aiff", "amr", "au", "avi",
    "cda", "m4a", "mid", "mp3", "mp4", "mpeg", "ogg", "opus", "ra", "ram",
    "snd", "wav", "wma"
  ];

  const filteredSources = userSources.filter(source =>
    source.title?.toLowerCase().includes(sourceSearchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(project =>
    project.title?.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl p-0 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-center">
              Sources
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 shrink-0">
            <button
              onClick={() => setActiveTab("add")}
              className={cn(
                "flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors relative",
                activeTab === "add"
                  ? "text-indigo-600 bg-indigo-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Sources</span>
              {activeTab === "add" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={cn(
                "flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors relative",
                activeTab === "sources"
                  ? "text-indigo-600 bg-indigo-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <span className="sm:hidden">Sources</span>
              <span className="hidden sm:inline">My Sources</span>
              {activeTab === "sources" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={cn(
                "flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors relative",
                activeTab === "projects"
                  ? "text-indigo-600 bg-indigo-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              Projects
              {activeTab === "projects" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {/* Add Sources Tab */}
            {activeTab === "add" && (
              <div className="space-y-4 sm:space-y-6 min-h-0">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Create Audio and Video Overviews from{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">
                      websites
                    </span>
                  </h3>
                </div>

                {/* Web Search Bar */}
                <form onSubmit={handleWebSearch} className="relative">
                  <div className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search the web for new sources"
                      className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={isSearching}
                    />
                    <button
                      type="button"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Web</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      <span>Search</span>
                    </button>
                  </div>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-[40vh] sm:max-h-[300px] overflow-hidden flex flex-col">
                    <div className="bg-gray-50 px-3 sm:px-4 py-2 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        {searchResults.length} results found
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchResults([]);
                            setSelectedSearchResults(new Set());
                          }}
                          className="text-xs h-8"
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveSelectedResults}
                          disabled={selectedSearchResults.size === 0}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                        >
                          Save ({selectedSearchResults.size})
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => toggleSearchResultSelection(result.id)}
                          className={cn(
                            "flex items-start gap-3 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                            selectedSearchResults.has(result.id) && "bg-indigo-50 hover:bg-indigo-50"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5",
                            selectedSearchResults.has(result.id)
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-gray-300"
                          )}>
                            {selectedSearchResults.has(result.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-start sm:items-center gap-2">
                              {result.favicon && (
                                <img
                                  src={result.favicon}
                                  alt=""
                                  className="w-4 h-4 flex-shrink-0 mt-1 sm:mt-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <p className="font-medium text-gray-900 text-sm sm:text-base leading-tight sm:leading-normal line-clamp-2 sm:line-clamp-1 sm:truncate">{result.title}</p>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 sm:line-clamp-2 mt-1">{result.snippet}</p>
                            <p className="text-xs text-indigo-600 truncate mt-0.5">{result.url}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-colors bg-gray-50/50",
                    isDragging ? "border-indigo-500 bg-indigo-50/50" : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    accept={supportedFormats.join(",")}
                  />

                  {isUploading ? (
                    <div className="space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                      <p className="text-gray-600">Uploading files...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg text-gray-600">
                        or <span className="text-gray-900 font-medium">drop files here</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        pdf, images, docs, audio,{" "}
                        <span className="text-gray-900 underline" title={supportedFormats.join(", ")}>
                          and more
                        </span>
                      </p>
                      <Button
                        variant="link"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        Click to browse files
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-full px-5 py-2.5 h-auto border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload files
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowUrlModal(true)}
                    className="rounded-full px-5 py-2.5 h-auto border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Websites
                  </Button>
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowDriveTooltip(!showDriveTooltip)}
                      className="rounded-full px-5 py-2.5 h-auto border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    >
                      <HardDrive className="w-4 h-4 mr-2" />
                      Drive
                    </Button>
                    {showDriveTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50">
                        Coming soon!
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowTextModal(true)}
                    className="rounded-full px-5 py-2.5 h-auto border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <Clipboard className="w-4 h-4 mr-2" />
                    Copied text
                  </Button>
                </div>
              </div>
            )}

            {/* My Sources Tab */}
            {activeTab === "sources" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search your sources..."
                      className="pl-10"
                      value={sourceSearchQuery}
                      onChange={(e) => setSourceSearchQuery(e.target.value)}
                    />
                  </div>
                  <span className="text-sm text-gray-500 ml-4">
                    {selectedSources.size} selected
                  </span>
                </div>

                <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                  {sourcesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : filteredSources.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No sources found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredSources.map((source) => (
                        <div
                          key={source.id}
                          onClick={() => toggleSourceSelection(source.id)}
                          className={cn(
                            "flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                            selectedSources.has(source.id) && "bg-indigo-50 hover:bg-indigo-50"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            selectedSources.has(source.id)
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-gray-300"
                          )}>
                            {selectedSources.has(source.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{source.title}</p>
                            <p className="text-sm text-gray-500">{source.type || 'Document'}</p>
                          </div>
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedSources.size > 0 && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleUseSelectedSources}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Use Selected Sources ({selectedSources.size})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search projects..."
                      className="pl-10"
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                    />
                  </div>
                  <span className="text-sm text-gray-500 ml-4">
                    {selectedProjects.size} selected
                  </span>
                </div>

                <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                  {projectsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No projects found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredProjects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => toggleProjectSelection(project.id)}
                          className={cn(
                            "flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                            selectedProjects.has(project.id) && "bg-indigo-50 hover:bg-indigo-50"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            selectedProjects.has(project.id)
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-gray-300"
                          )}>
                            {selectedProjects.has(project.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <Folder className="w-5 h-5 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{project.title}</p>
                            <p className="text-sm text-gray-500">
                              {project.sourceCount || 0} sources
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProjects.size > 0 && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleUseSelectedProjects}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Import from Selected Projects ({selectedProjects.size})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent >
      </Dialog >

      {/* URL Input Modal */}
      < Dialog open={showUrlModal} onOpenChange={setShowUrlModal} >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-indigo-600" />
              Add Website URLs
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">URLs</label>
              <Textarea
                placeholder="https://example.com&#10;https://youtube.com/watch?v=...&#10;https://another-site.com/article"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Enter one URL per line or separate with commas. Supports websites, articles, YouTube videos, and PDFs.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title (optional)</label>
              <Input
                type="text"
                placeholder="Enter a custom title..."
                value={urlTitle}
                onChange={(e) => setUrlTitle(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowUrlModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUrl}
                disabled={!urlInput.trim() || isAddingUrl}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isAddingUrl ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Sources"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* Copied Text Modal */}
      < Dialog open={showTextModal} onOpenChange={setShowTextModal} >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-indigo-600" />
              Paste Copied Text
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <Input
                type="text"
                placeholder="Enter a title for this text..."
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Content</label>
              <Textarea
                placeholder="Paste your text here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[300px] resize-y"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowTextModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddText}
                disabled={!textContent.trim() || isAddingText}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isAddingText ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as Source"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >
    </>
  );
}
