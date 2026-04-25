"use client";

import React from "react";

interface ImportData {
  doi: string;
  url: string;
  bibtex: string;
  ris: string;
}

interface ImportCitationFormProps {
  data: ImportData;
  onChange: (data: ImportData) => void;
  onImportDOI: () => void;
  onImportURL: () => void;
  importing: boolean;
  result: any | null;
}

export const ImportCitationForm: React.FC<ImportCitationFormProps> = ({
  data,
  onChange,
  onImportDOI,
  onImportURL,
  importing,
  result,
}) => {
  const updateField = (field: keyof ImportData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-black mb-1">
          Import from DOI
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={data.doi}
            onChange={(e) => updateField("doi", e.target.value)}
            placeholder="Enter DOI (e.g., 10.1000/xyz123)"
            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={onImportDOI}
            disabled={importing || !data.doi.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
            {importing ? (
              <>
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></span>
                Fetching
              </>
            ) : (
              "Fetch"
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-black mb-1">
          Import from URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={data.url}
            onChange={(e) => updateField("url", e.target.value)}
            placeholder="Paste website URL..."
            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={onImportURL}
            disabled={importing || !data.url.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
            {importing ? (
              <>
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></span>
                Fetching
              </>
            ) : (
              "Fetch"
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-black mb-1">
          Import from BibTeX
        </label>
        <textarea
          value={data.bibtex}
          onChange={(e) => updateField("bibtex", e.target.value)}
          placeholder="Paste BibTeX entry..."
          rows={3}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <button className="mt-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full">
          Import
        </button>
      </div>

      {result && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-sm text-green-800">
            Found citation data
          </h3>
          <p className="mt-1 text-xs text-green-700">
            Looks good? Click 'Add Citation' to save to your library.
          </p>
        </div>
      )}
    </div>
  );
};
