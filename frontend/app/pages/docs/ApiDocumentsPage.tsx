import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Plus,
  Edit,
  Download,
  History,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const ApiDocumentsPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const documentOperations = [
    {
      icon: <Plus className="h-8 w-8 text-blue-600" />,
      title: "Create Documents",
      description: "Initialize new documents with various formats",
    },
    {
      icon: <Edit className="h-8 w-8 text-green-600" />,
      title: "Edit Content",
      description: "Modify document content and metadata",
    },
    {
      icon: <FileText className="h-8 w-8 text-purple-600" />,
      title: "Retrieve Documents",
      description: "Access document content and revision history",
    },
    {
      icon: <Download className="h-8 w-8 text-orange-600" />,
      title: "Export Formats",
      description: "Export documents in multiple formats (PDF, DOCX, etc.)",
    },
  ];

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/documents",
      description: "Retrieve all documents for the authenticated user",
    },
    {
      method: "POST",
      path: "/api/v1/documents",
      description: "Create a new document",
    },
    {
      method: "GET",
      path: "/api/v1/documents/{id}",
      description: "Retrieve a specific document by ID",
    },
    {
      method: "PUT",
      path: "/api/v1/documents/{id}",
      description: "Update a specific document",
    },
    {
      method: "DELETE",
      path: "/api/v1/documents/{id}",
      description: "Delete a specific document",
    },
    {
      method: "GET",
      path: "/api/v1/documents/{id}/content",
      description: "Retrieve document content",
    },
    {
      method: "PUT",
      path: "/api/v1/documents/{id}/content",
      description: "Update document content",
    },
  ];

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom py-6">
          <Link
            href="/docs/developer/api"
            className={`inline-flex items-center ${planDocLinkClasses} mb-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to API Overview
          </Link>
          <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Documents API
          </h1>
          <p className="text-lg text-black dark:text-black">
            Manage documents and content through the ScholarForge AIAPI
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Document Management</h2>
              <p className="opacity-90">
                Create, edit, and manage your documents programmatically
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Edit className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Download className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Document Operations
            </h2>
            <div className="space-y-6">
              {documentOperations.map((operation, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">
                      {operation.icon}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {operation.title}
                      </h3>
                      <p className="mt-1 text-black dark:text-black">
                        {operation.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Document Endpoints
            </h2>
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {endpoint.method}
                    </span>
                    <code className="ml-2 text-sm font-mono text-black dark:text-black">
                      {endpoint.path}
                    </code>
                  </div>
                  <p className="text-black dark:text-black">
                    {endpoint.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 dark:bg-blue-900/20 border-white-800">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Version Control
              </h3>
              <p className="text-blue-800 mb-4 dark:text-blue-200">
                All documents automatically maintain revision history for
                tracking changes.
              </p>
              <Link
                href="/docs/collaboration"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                Learn About Versioning
                <History className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Request Examples
          </h2>
          <div className="prose max-w-none dark:prose-invert">
            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              Create a New Document
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`POST /api/v1/documents
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "projectId": "project_id",
  "name": "My Research Paper",
  "description": "A paper for my research project",
  "format": "docx"
}`}</code>
            </pre>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              Retrieve Document Content
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`GET /api/v1/documents/{document_id}/content
Authorization: Bearer YOUR_ACCESS_TOKEN`}</code>
            </pre>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              Update Document Content
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`PUT /api/v1/documents/{document_id}/content
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "content": "Updated document content here..."
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentsPage;
