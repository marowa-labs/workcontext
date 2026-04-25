"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Star, Download, User, Lock, Crown, Plus, Store } from "lucide-react";
import blankDocumentIcon from "../../assets/icons/blank-document.png";
import importDocumentIcon from "../../assets/icons/import-document.png";

interface Template {
  id: string;
  name: string;
  description: string | null;
  type: string;
  tags: string[];
  is_public: boolean;
  rating: number | null;
  reviews: number;
  downloads: number;
  author_name: string | null;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  is_premium?: boolean;
  is_custom?: boolean;
  is_institutional?: boolean;
  is_accessible?: boolean;
  access_level?: string;
}

interface TemplateCardsProps {
  onTemplateSelect?: (template: any) => void;
  onCreateProject?: (templateId: string) => void;
  onImportDocument?: () => void;
  onBrowseTemplates?: () => void;
  templates?: Template[];
  viewMode?: "grid" | "list";
  onTemplateClick?: (template: Template) => void;
  isFreeUser?: boolean;
  isStudentUser?: boolean;
  isResearcherUser?: boolean;
}

const TemplateCards: React.FC<TemplateCardsProps> = ({
  onTemplateSelect,
  onCreateProject,
  onImportDocument,
  onBrowseTemplates,
  templates = [],
  viewMode = "grid",
  onTemplateClick,
  isFreeUser = false,
  isStudentUser = false,
  isResearcherUser = false,
}) => {
  const router = useRouter();

  // Ensure templates is always an array
  const safeTemplates = Array.isArray(templates) ? templates : [];

  // Default templates for the dashboard
  const defaultTemplates = [
    {
      id: "blank",
      name: "Blank Document",
      description: "Start with a clean slate",
      type: "Document",
      tags: ["blank", "basic"],
      is_public: true,
      rating: 4.5,
      reviews: 124,
      downloads: 1240,
      author_name: "ScholarForge AITeam",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_premium: false,
    },
    {
      id: "blank-document",
      name: "Academic Essay",
      description: "Structure for research essays",
      type: "Essay",
      tags: ["academic", "research"],
      is_public: true,
      rating: 4.8,
      reviews: 89,
      downloads: 890,
      author_name: "ScholarForge AITeam",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_premium: false,
    },
    {
      id: "thesis",
      name: "Thesis/Dissertation",
      description: "Complete thesis structure",
      type: "Thesis",
      tags: ["research", "advanced"],
      is_public: true,
      rating: 4.9,
      reviews: 56,
      downloads: 560,
      author_name: "ScholarForge AITeam",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_premium: true,
    },
  ];

  const templatesToUse =
    safeTemplates.length > 0 ? safeTemplates : defaultTemplates;

  const handleUseTemplate = (
    templateId: string,
    isPremium: boolean | undefined,
    isAccessible: boolean | undefined,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    // Check if user can access this template based on their plan
    if (isAccessible === false) {
      // Redirect to upgrade page for premium templates
      router.push("billing/subscription");
      return;
    }

    if (onCreateProject) {
      onCreateProject(templateId);
    }
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return "No ratings";

    return (
      <div className="flex items-center">
        <Star className="w-4 h-4 text-cw-secondary fill-current" />
        <span className="ml-1 text-sm text-gray-700 dark:text-gray-700">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Function to determine if a template is locked for the current user
  const isTemplateLocked = (template: any) => {
    // Check if template is explicitly marked as inaccessible
    if (template.is_accessible === false) {
      return true;
    }

    // Free users can only access basic templates
    if (
      isFreeUser &&
      (template.is_premium || template.is_custom || template.is_institutional)
    ) {
      return true;
    }

    // One Time users can access standard templates but not custom or institutional ones
    if (isStudentUser && (template.is_custom || template.is_institutional)) {
      return true;
    }

    // Student users can access most templates but not institutional ones
    if (isStudentUser && template.is_institutional) {
      return true;
    }

    // Researcher users can access all templates
    return false;
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white dark:bg-white rounded-lg border border-white border-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-white">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                Template
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                Rating
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                Downloads
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-white divide-y divide-gray-200 dark:divide-gray-700">
            {templatesToUse.map((template: any) => {
              const locked = isTemplateLocked(template);

              return (
                <tr
                  key={template.id}
                  className={`${
                    locked
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-gray-50 dark:hover:bg-white cursor-pointer"
                  }`}
                  onClick={() =>
                    !locked && onTemplateClick && onTemplateClick(template)
                  }
                  aria-label={
                    locked
                      ? `Locked template: ${template.name}. Upgrade required.`
                      : `Template: ${template.name}`
                  }
                  aria-disabled={locked}
                  role="button"
                  tabIndex={locked ? -1 : 0}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        {template.id === "blank" ? (
                          <img
                            src={blankDocumentIcon.src}
                            alt="Blank Document"
                            className="w-10 h-10 object-fill"
                          />
                        ) : template.id === "blank-document" ? (
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="bg-gray-200 dark:bg-white border-2 border-dashed rounded-xl w-10 h-10" />
                        )}
                        {(template.is_premium ||
                          template.is_custom ||
                          template.is_institutional) && (
                          <div className="absolute -top-1 -right-1 bg-cw-secondary rounded-full p-0.5">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {locked && (
                          <div className="absolute inset-0 bg-white bg-opacity-40 rounded-xl flex items-center justify-center">
                            <Lock className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-700 text-gray-700">
                          {template.name}
                          {(template.is_premium ||
                            template.is_custom ||
                            template.is_institutional) && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-cw-secondary text-white text-xs font-bold rounded-full">
                              <Crown className="w-2 h-2 mr-0.5" />
                              Pro
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-700">
                          {template.description || "No description"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 text-gray-700">
                      {template.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderRating(template.rating)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-700">
                    <div className="flex items-center">
                      <Download className="w-4 h-4 mr-1" />
                      {template.downloads}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {locked ? (
                      <button
                        onClick={(e) =>
                          handleUseTemplate(
                            template.id,
                            template.is_premium,
                            template.is_accessible,
                            e,
                          )
                        }
                        className="text-purple-600 hover:text-purple-900 dark:text-cw-secondary dark:hover:text-purple-300 flex items-center"
                        aria-label={`Locked template ${template.name}. Click to upgrade.`}>
                        <Lock className="w-4 h-4 mr-1" />
                        Upgrade
                      </button>
                    ) : (
                      <button
                        onClick={(e) =>
                          handleUseTemplate(
                            template.id,
                            template.is_premium,
                            template.is_accessible,
                            e,
                          )
                        }
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        aria-label={`Use template ${template.name}`}>
                        Use Template
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Grid view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-700 text-gray-700">
          Quick Start Templates
        </h2>
        <button
          onClick={onBrowseTemplates}
          className="inline-flex items-center px-3 py-2 bg-white dark:bg-white border border-white border-white text-gray-700 dark:text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white transition-colors">
          <Store className="w-4 h-4 mr-2" />
          Browse All Templates
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Create from scratch card */}
        <div
          onClick={onTemplateSelect}
          className="bg-white dark:bg-white rounded-2xl border-2 border-dashed border-white border-white p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
            <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h3 className="font-medium text-gray-700 text-gray-700 mb-1">
            Start from Scratch
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-700">
            Create a new blank project
          </p>
        </div>

        {/* Import document card */}
        <div
          onClick={onImportDocument}
          className="bg-white dark:bg-white rounded-2xl border-2 border-dashed border-white border-white p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
          <img
            src={importDocumentIcon.src}
            alt="Import Document"
            className="w-16 h-16 object-fill mb-3"
          />
          <h3 className="font-medium text-gray-700 text-gray-700 mb-1">
            Import Document
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-700">
            Upload existing file
          </p>
        </div>

        {/* Template cards */}
        {templatesToUse.slice(0, 2).map((template: any) => {
          const locked = isTemplateLocked(template);

          return (
            <div
              key={template.id}
              className={`bg-white dark:bg-white rounded-2xl border p-6 transition-all ${
                locked
                  ? "border-white border-white opacity-80"
                  : "border-white border-white hover:shadow-lg cursor-pointer"
              }`}
              onClick={() =>
                !locked && onTemplateClick && onTemplateClick(template)
              }
              aria-label={
                locked
                  ? `Locked template: ${template.name}. Upgrade required.`
                  : `Template: ${template.name}`
              }
              aria-disabled={locked}
              role="button"
              tabIndex={locked ? -1 : 0}>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    {template.id === "blank" ? (
                      <img
                        src={blankDocumentIcon.src}
                        alt="Blank Document"
                        className="w-12 h-12 object-fill"
                      />
                    ) : template.id === "blank-document" ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg
                          className="w-7 h-7 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="bg-gray-200 dark:bg-white border-2 border-dashed rounded-xl w-12 h-12" />
                    )}
                    {(template.is_premium ||
                      template.is_custom ||
                      template.is_institutional) && (
                      <div className="absolute -top-1 -right-1 bg-cw-secondary rounded-full p-0.5">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {locked && (
                      <div className="absolute inset-0 bg-white bg-opacity-40 rounded-xl flex items-center justify-center">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-700 text-gray-700 flex items-center">
                      {template.name}
                      {(template.is_premium ||
                        template.is_custom ||
                        template.is_institutional) && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-cw-secondary text-white text-xs font-bold rounded-full">
                          <Crown className="w-2 h-2 mr-0.5" />
                          Pro
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-700 mt-1">
                      {template.description || "No description"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {template.type}
                </span>
                {template.tags &&
                  template.tags.slice(0, 2).map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-white dark:text-gray-700">
                      {tag}
                    </span>
                  ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  {renderRating(template.rating)}
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-700">
                    ({template.reviews})
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-700">
                  <Download className="w-4 h-4 mr-1" />
                  {template.downloads}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-700">
                  <User className="w-4 h-4 mr-1" />
                  {template.author_name || "Unknown"}
                </div>
                {locked ? (
                  <button
                    onClick={(e) =>
                      handleUseTemplate(
                        template.id,
                        template.is_premium,
                        template.is_accessible,
                        e,
                      )
                    }
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-cw-secondary bg-cw-secondary/20 hover:bg-cw-secondary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cw-secondary"
                    aria-label={`Locked template ${template.name}. Click to upgrade.`}>
                    <Lock className="w-3 h-3 mr-1" />
                    Upgrade
                  </button>
                ) : (
                  <button
                    onClick={(e) =>
                      handleUseTemplate(
                        template.id,
                        template.is_premium,
                        template.is_accessible,
                        e,
                      )
                    }
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={`Use template ${template.name}`}>
                    Use
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateCards;
