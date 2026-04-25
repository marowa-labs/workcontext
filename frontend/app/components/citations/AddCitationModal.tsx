"use client";

import { useState, useEffect } from "react";
import { X, Search, FileText, Plus } from "lucide-react";
import CitationService from "../../lib/utils/citationService";
import CitationAccessControl, {
  UserCitationPermissions,
} from "../../lib/utils/citationAccessControl";
import { ManualCitationForm, CitationData } from "./ManualCitationForm";
import { SearchCitationForm } from "./SearchCitationForm";
import { ImportCitationForm } from "./ImportCitationForm";

interface Author {
  firstName: string;
  lastName: string;
}

interface AddCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  onCitationAdded: () => void;
  initialData?: any;
  isPanel?: boolean;
  onMatchStyle?: (url: string) => void;
  analyzingUrl?: string | null;
}

const AddCitationModal: React.FC<AddCitationModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onCitationAdded,
  initialData,
  isPanel = false,
  onMatchStyle,
  analyzingUrl,
}) => {
  const [activeTab, setActiveTab] = useState<"search" | "manual" | "import">(
    "search",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [citationData, setCitationData] = useState<CitationData>(
    initialData || {
      type: "article",
      title: "",
      authors: [{ firstName: "", lastName: "" }],
    },
  );
  const [importData, setImportData] = useState({
    doi: "",
    url: "",
    bibtex: "",
    ris: "",
  });
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [, setAccessInfo] = useState<UserCitationPermissions | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("search");
      setSearchQuery("");
      setSearchResults([]);

      // If we're editing, use initialData, otherwise reset to empty form
      if (initialData) {
        setCitationData(initialData);
      } else {
        setCitationData({
          type: "article",
          title: "",
          authors: [{ firstName: "", lastName: "" }],
        });
      }

      setImportData({
        doi: "",
        url: "",
        bibtex: "",
        ris: "",
      });
      setImportResult(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, initialData]);

  // Check user's citation access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      if (!projectId) {
        setAccessChecked(true);
        return;
      }

      try {
        const permissions = await CitationAccessControl.getUserCitationAccess();
        setAccessInfo(permissions);
        setAccessChecked(true);
      } catch (err) {
        console.error("Error checking citation access:", err);
        setAccessChecked(true);
      }
    };

    if (isOpen) {
      checkAccess();
    }
  }, [isOpen, projectId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const results = await CitationService.searchCitations(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setError("No results found. Try adjusting your search terms.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to search citations");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleImportDOI = async () => {
    if (!importData.doi.trim()) {
      setError("Please enter a DOI");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const result = await CitationService.importFromDOI(importData.doi);
      setImportResult(result);
      setSuccess("Citation imported successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to import from DOI");
    } finally {
      setImporting(false);
    }
  };

  const handleImportURL = async () => {
    if (!importData.url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const result = await CitationService.importFromURL(importData.url);
      setImportResult(result);
      setSuccess("Citation imported successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to import from URL");
    } finally {
      setImporting(false);
    }
  };

  const handleSaveCitation = async () => {
    try {
      setError(null);

      const citationToSave = importResult || citationData;

      if (!citationToSave.title) {
        setError("Title is required");
        return;
      }

      await CitationService.addCitation(projectId || "", citationToSave);

      setSuccess("Citation added successfully!");
      onCitationAdded();

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to save citation");
    }
  };

  const handleAddAuthor = () => {
    setCitationData({
      ...citationData,
      authors: [...citationData.authors, { firstName: "", lastName: "" }],
    });
  };

  const handleRemoveAuthor = (index: number) => {
    const newAuthors = citationData.authors.filter((_, i) => i !== index);
    setCitationData({ ...citationData, authors: newAuthors });
  };

  const handleAuthorChange = (
    index: number,
    field: "firstName" | "lastName",
    value: string,
  ) => {
    const newAuthors = [...citationData.authors];
    newAuthors[index][field] = value;
    setCitationData({ ...citationData, authors: newAuthors });
  };

  const isFormValid = () => {
    if (importResult) return true;

    if (!citationData.title) return false;

    switch (citationData.type) {
      case "article":
        return (
          citationData.authors.length > 0 &&
          citationData.authors.some(
            (author) => author.firstName || author.lastName,
          )
        );
      case "book":
        return citationData.publisher && citationData.year;
      case "website":
        return citationData.url;
      default:
        return citationData.title.length > 0;
    }
  };

  const handleSelectSearchResult = (result: any) => {
    setImportResult(result);
    setCitationData({
      type: result.type || "article",
      title: result.title || "",
      authors:
        result.authors && Array.isArray(result.authors)
          ? result.authors.map((author: any) => ({
              firstName: author.firstName || "",
              lastName: author.lastName || "",
            }))
          : [{ firstName: "", lastName: "" }],
      year: result.year,
      journal: result.journal,
      volume: result.volume,
      issue: result.issue,
      pages: result.pages,
      doi: result.doi,
      url: result.url,
      publisher: result.publisher,
      isbn: result.isbn,
      edition: result.edition,
      place: result.place,
      conference: result.conference,
      abstract: result.abstract,
      citationCount: result.citationCount,
      issn: result.issn,
      subjects: result.subjects,
      source: result.source,
    });
    setActiveTab("manual");
  };

  const renderContent = () => {
    return (
      <>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {activeTab === "search" && (
          <SearchCitationForm
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSearch={(overrideQuery) => {
              if (overrideQuery) {
                setSearchQuery(overrideQuery);
              }
              handleSearch();
            }}
            searching={searching}
            results={searchResults}
            onSelect={handleSelectSearchResult}
            onMatchStyle={onMatchStyle}
            analyzingUrl={analyzingUrl}
          />
        )}

        {activeTab === "manual" && (
          <ManualCitationForm
            data={citationData}
            onChange={setCitationData}
            onAddAuthor={handleAddAuthor}
            onRemoveAuthor={handleRemoveAuthor}
            onAuthorChange={handleAuthorChange}
            isPanel={isPanel}
          />
        )}

        {activeTab === "import" && (
          <ImportCitationForm
            data={importData}
            onChange={setImportData}
            onImportDOI={handleImportDOI}
            onImportURL={handleImportURL}
            importing={importing}
            result={importResult}
          />
        )}
      </>
    );
  };

  if (!isOpen) return null;

  if (!accessChecked) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Panel mode rendering
  if (isPanel) {
    return (
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === "search"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <Search className="h-4 w-4 inline-block mr-2" />
            Search
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === "manual"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <FileText className="h-4 w-4 inline-block mr-2" />
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === "import"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <Plus className="h-4 w-4 inline-block mr-2" />
            Import
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 overflow-x-hidden">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSaveCitation}
            disabled={!isFormValid()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
            {importResult ? "Add Citation" : "Save Citation"}
          </button>
        </div>
      </div>
    );
  }

  // Modal mode rendering
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? "Edit Citation" : "Add Citation"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === "search"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <Search className="h-4 w-4 inline-block mr-2" />
            Search
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === "manual"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <FileText className="h-4 w-4 inline-block mr-2" />
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === "import"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <Plus className="h-4 w-4 inline-block mr-2" />
            Import
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSaveCitation}
            disabled={!isFormValid()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
            {importResult ? "Add Citation" : "Save Citation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCitationModal;
