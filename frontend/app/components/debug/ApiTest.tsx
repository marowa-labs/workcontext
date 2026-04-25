"use client";

import React, { useState } from "react";
import { apiClient } from "../../lib/utils/apiClient";
import { supabase } from "../../lib/supabase/client";

const ApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testApiCalls = async () => {
    setLoading(true);
    try {
      // Get current session first
      const { data: sessionData } = await supabase.auth.getSession();
      const { data: userData } = await supabase.auth.getUser();

      // Test 1: Test auth endpoint
      let authTestResult = null;
      let authTestError = null;
      try {
        authTestResult = await apiClient.get("/api/test-auth");
      } catch (error) {
        authTestError =
          error instanceof Error ? error.message : "Unknown error";
      }

      // Test 2: Test debug session endpoint
      let debugTestResult = null;
      let debugTestError = null;
      try {
        debugTestResult = await apiClient.get("/api/debug-session");
      } catch (error) {
        debugTestError =
          error instanceof Error ? error.message : "Unknown error";
      }

      // Test 3: Test projects endpoint
      let projectsTestResult = null;
      let projectsTestError = null;
      try {
        projectsTestResult = await apiClient.get("/api/projects");
      } catch (error) {
        projectsTestError =
          error instanceof Error ? error.message : "Unknown error";
      }

      setTestResults({
        session: sessionData?.session,
        user: userData?.user,
        authTestResult,
        authTestError,
        debugTestResult,
        debugTestError,
        projectsTestResult,
        projectsTestError,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Debug test failed:", error);
      setTestResults({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">API Test</h2>

      <button
        onClick={testApiCalls}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4">
        {loading ? "Testing..." : "Run API Tests"}
      </button>

      {testResults && (
        <div className="mt-4 p-4 bg-white rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Test Results</h3>
          <pre className="text-sm overflow-auto max-h-96 bg-gray-50 p-2 rounded">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;
