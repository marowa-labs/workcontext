"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Folder,
  Plus,
  Edit,
  Trash2,
  Share2,
  Users,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const ApiProjectsPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const projectOperations = [
    {
      icon: <Plus className="h-8 w-8 text-blue-600" />,
      title: "Create Projects",
      description: "Initialize new research projects with custom settings",
    },
    {
      icon: <Edit className="h-8 w-8 text-green-600" />,
      title: "Update Projects",
      description: "Modify project details, settings, and metadata",
    },
    {
      icon: <Folder className="h-8 w-8 text-purple-600" />,
      title: "List Projects",
      description: "Retrieve collections of projects with filtering options",
    },
    {
      icon: <Trash2 className="h-8 w-8 text-red-600" />,
      title: "Delete Projects",
      description: "Remove projects and associated data securely",
    },
  ];

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/projects",
      description: "Retrieve all projects for the authenticated user",
    },
    {
      method: "POST",
      path: "/api/v1/projects",
      description: "Create a new project",
    },
    {
      method: "GET",
      path: "/api/v1/projects/{id}",
      description: "Retrieve a specific project by ID",
    },
    {
      method: "PUT",
      path: "/api/v1/projects/{id}",
      description: "Update a specific project",
    },
    {
      method: "DELETE",
      path: "/api/v1/projects/{id}",
      description: "Delete a specific project",
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
            Projects API
          </h1>
          <p className="text-lg text-black dark:text-black">
            Manage research projects through the ScholarForge AIAPI
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Project Management</h2>
              <p className="opacity-90">
                Organize and manage your research projects programmatically
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <Folder className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Share2 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Project Operations
            </h2>
            <div className="space-y-6">
              {projectOperations.map((operation, index) => (
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
              Project Endpoints
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
                Collaboration Features
              </h3>
              <p className="text-blue-800 mb-4 dark:text-blue-200">
                Projects support team collaboration, sharing permissions, and
                real-time updates.
              </p>
              <Link
                href="/docs/collaboration"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                Learn About Collaboration
                <Users className="ml-2 h-4 w-4" />
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
              Create a New Project
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`POST /api/v1/projects
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "My Research Project",
  "description": "A project for my doctoral research",
  "visibility": "private",
  "tags": ["research", "academic", "thesis"]
}`}</code>
            </pre>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              Retrieve All Projects
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`GET /api/v1/projects?limit=10&offset=0
Authorization: Bearer YOUR_ACCESS_TOKEN`}</code>
            </pre>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              Update a Project
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`PUT /api/v1/projects/{project_id}
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "An updated description",
  "visibility": "shared"
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiProjectsPage;
