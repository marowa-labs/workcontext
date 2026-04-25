"use client";

import React from "react";
import { BookOpen, FileText, Globe, Users, Plus, Trash2 } from "lucide-react";

interface Author {
  firstName: string;
  lastName: string;
}

export interface CitationData {
  type: string;
  title: string;
  authors: Author[];
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  issn?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  isbn?: string;
  edition?: string;
  place?: string;
  conference?: string;
  subjects?: string[];
  abstract?: string;
  source?: string;
  notes?: string;
  citationCount?: number;
}

interface ManualCitationFormProps {
  data: CitationData;
  onChange: (data: CitationData) => void;
  onAddAuthor: () => void;
  onRemoveAuthor: (index: number) => void;
  onAuthorChange: (index: number, field: keyof Author, value: string) => void;
  isPanel?: boolean;
}

export const ManualCitationForm: React.FC<ManualCitationFormProps> = ({
  data,
  onChange,
  onAddAuthor,
  onRemoveAuthor,
  onAuthorChange,
  isPanel = false,
}) => {
  const updateField = (field: keyof CitationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateYear = (value: string) => {
    const year = value ? parseInt(value) : undefined;
    onChange({ ...data, year });
  };

  return (
    <div className="space-y-4">
      {/* Source Type Selector */}
      <div>
        <label className="block text-xs font-medium text-black mb-1.5">
          Source Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              id: "article",
              label: "Journal Article",
              icon: FileText,
            },
            { id: "book", label: "Book", icon: BookOpen },
            { id: "website", label: "Website", icon: Globe },
            {
              id: "conference",
              label: "Conference Paper",
              icon: Users,
            },
          ].map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => updateField("type", type.id)}
                className={`p-2 border rounded-lg text-center transition-colors ${
                  data.type === type.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                <Icon
                  className={`h-4 w-4 mx-auto mb-1 ${
                    data.type === type.id ? "text-blue-600" : "text-gray-600"
                  }`}
                />
                <span className="text-xs font-medium text-black">
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Title *
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter title"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-black">
              Authors
            </label>
            <button
              onClick={onAddAuthor}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
              <Plus className="h-3 w-3 mr-1" />
              Add
            </button>
          </div>
          {data.authors.map((author, index) => (
            <div
              key={index}
              className={`flex gap-2 mb-2 ${isPanel ? "flex-col" : "flex-row"}`}>
              <input
                type="text"
                value={author.firstName}
                onChange={(e) =>
                  onAuthorChange(index, "firstName", e.target.value)
                }
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="First name"
              />
              <input
                type="text"
                value={author.lastName}
                onChange={(e) =>
                  onAuthorChange(index, "lastName", e.target.value)
                }
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Last name"
              />
              {data.authors.length > 1 && (
                <button
                  onClick={() => onRemoveAuthor(index)}
                  className="px-2 py-1.5 text-gray-500 hover:text-red-600"
                  title="Remove author">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {data.type === "article" && (
          <>
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                Journal
              </label>
              <input
                type="text"
                value={data.journal || ""}
                onChange={(e) => updateField("journal", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter journal name"
              />
            </div>
            <div
              className={`grid gap-3 ${isPanel ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <label className="block text-xs font-medium text-black mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={data.year || ""}
                  onChange={(e) => updateYear(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Year"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-black mb-1">
                  Volume
                </label>
                <input
                  type="text"
                  value={data.volume || ""}
                  onChange={(e) => updateField("volume", e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Vol"
                />
              </div>
            </div>
            <div
              className={`grid gap-4 ${isPanel ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Issue
                </label>
                <input
                  type="text"
                  value={data.issue || ""}
                  onChange={(e) => updateField("issue", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Pages
                </label>
                <input
                  type="text"
                  value={data.pages || ""}
                  onChange={(e) => updateField("pages", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 123-145"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                DOI
              </label>
              <input
                type="text"
                value={data.doi || ""}
                onChange={(e) => updateField("doi", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter DOI"
              />
            </div>
          </>
        )}

        {data.type === "book" && (
          <>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Publisher *
              </label>
              <input
                type="text"
                value={data.publisher || ""}
                onChange={(e) => updateField("publisher", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter publisher"
              />
            </div>
            <div
              className={`grid gap-4 ${isPanel ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  value={data.year || ""}
                  onChange={(e) => updateYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter year"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Edition
                </label>
                <input
                  type="text"
                  value={data.edition || ""}
                  onChange={(e) => updateField("edition", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter edition"
                />
              </div>
            </div>
            <div
              className={`grid gap-4 ${isPanel ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  ISBN
                </label>
                <input
                  type="text"
                  value={data.isbn || ""}
                  onChange={(e) => updateField("isbn", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ISBN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Place of Publication
                </label>
                <input
                  type="text"
                  value={data.place || ""}
                  onChange={(e) => updateField("place", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter place of publication"
                />
              </div>
            </div>
          </>
        )}

        {data.type === "website" && (
          <>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Website Name
              </label>
              <input
                type="text"
                value={data.journal || ""}
                onChange={(e) => updateField("journal", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter website name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                URL *
              </label>
              <input
                type="url"
                value={data.url || ""}
                onChange={(e) => updateField("url", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter URL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Date Published
              </label>
              <input
                type="date"
                value={
                  data.year
                    ? new Date(data.year, 0, 1).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  updateField("year", date.getFullYear());
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {data.type === "conference" && (
          <>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Conference Name
              </label>
              <input
                type="text"
                value={data.conference || ""}
                onChange={(e) => updateField("conference", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter conference name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Publisher
              </label>
              <input
                type="text"
                value={data.publisher || ""}
                onChange={(e) => updateField("publisher", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter publisher"
              />
            </div>
            <div
              className={`grid gap-4 ${isPanel ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={data.year || ""}
                  onChange={(e) => updateYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter year"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  DOI
                </label>
                <input
                  type="text"
                  value={data.doi || ""}
                  onChange={(e) => updateField("doi", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter DOI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Place of Conference
                </label>
                <input
                  type="text"
                  value={data.place || ""}
                  onChange={(e) => updateField("place", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter place of conference"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Abstract
          </label>
          <textarea
            value={data.abstract || ""}
            onChange={(e) => updateField("abstract", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter abstract (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Notes
          </label>
          <textarea
            value={data.notes || ""}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter notes (optional)"
          />
        </div>
      </div>
    </div>
  );
};
