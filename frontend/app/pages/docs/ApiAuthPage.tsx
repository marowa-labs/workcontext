"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Key,
  Lock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const ApiAuthPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const authMethods = [
    {
      icon: <Key className="h-8 w-8 text-blue-600" />,
      title: "OAuth 2.0",
      description: "Industry-standard authorization framework",
    },
    {
      icon: <Lock className="h-8 w-8 text-green-600" />,
      title: "JWT Tokens",
      description: "Secure JSON Web Tokens for authentication",
    },
    {
      icon: <RefreshCw className="h-8 w-8 text-purple-600" />,
      title: "Token Refresh",
      description: "Automatic token renewal for seamless access",
    },
  ];

  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/auth/login",
      description: "Authenticate user and obtain access token",
    },
    {
      method: "POST",
      path: "/api/v1/auth/refresh",
      description: "Refresh expired access token",
    },
    {
      method: "POST",
      path: "/api/v1/auth/logout",
      description: "Invalidate current session",
    },
    {
      method: "GET",
      path: "/api/v1/auth/user",
      description: "Get authenticated user information",
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
            API Authentication
          </h1>
          <p className="text-lg text-black dark:text-black">
            Secure access to ScholarForge AIAPI endpoints
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Secure Authentication</h2>
              <p className="opacity-90">
                Protect your API access with industry-standard authentication
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Key className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Lock className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Authentication Methods
            </h2>
            <div className="space-y-6">
              {authMethods.map((method, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">{method.icon}</div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {method.title}
                      </h3>
                      <p className="mt-1 text-black dark:text-black">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Authentication Endpoints
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

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-5 dark:bg-yellow-900/20 border-white-800">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 dark:text-yellow-400" />
                <div>
                  <h3
                    className={`text-lg font-semibold mb-1 ${planDocHeadingClasses}`}>
                    Security Notice
                  </h3>
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Always use HTTPS for API requests and store tokens securely.
                    Never expose tokens in client-side code.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Implementation Guide
          </h2>
          <div className="prose max-w-none dark:prose-invert">
            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              1. Obtain API Credentials
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Register your application in the developer portal to obtain your
              client ID and secret.
            </p>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              2. Authenticate User
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}`}</code>
            </pre>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              3. Use Access Token
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Include the access token in the Authorization header for all
              subsequent requests:
            </p>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`Authorization: Bearer YOUR_ACCESS_TOKEN`}</code>
            </pre>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              4. Handle Token Expiration
            </h3>
            <p className="text-black mb-4 dark:text-black">
              When a token expires, use the refresh endpoint to obtain a new
              one:
            </p>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "YOUR_REFRESH_TOKEN"
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiAuthPage;
