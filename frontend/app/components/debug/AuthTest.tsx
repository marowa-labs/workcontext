"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client";
import { apiClient } from "../../lib/utils/apiClient";

const AuthTest: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSession(session);
      setUser(user);
    };

    getSession();
  }, []);

  const testAuth = async () => {
    setLoading(true);
    try {
      // Test 1: Get current session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      // Test 2: Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      // Test 3: Test API client with auth
      let apiTestResult = null;
      let apiTestError = null;
      try {
        apiTestResult = await apiClient.get("/api/test-auth");
      } catch (error) {
        apiTestError = error instanceof Error ? error.message : "Unknown error";
      }

      // Test 4: Test projects endpoint
      let projectsTestResult = null;
      let projectsTestError = null;
      try {
        projectsTestResult = await apiClient.get("/api/projects");
      } catch (error) {
        projectsTestError =
          error instanceof Error ? error.message : "Unknown error";
      }

      setTestResults({
        session: currentSession,
        user: currentUser,
        apiTestResult,
        apiTestError,
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
      <h2 className="text-xl font-bold mb-4">Authentication Debug Test</h2>

      <div className="mb-4 p-4 bg-white rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current Session Info</h3>
        <pre className="text-sm overflow-auto max-h-40 bg-gray-50 p-2 rounded">
          {JSON.stringify({ session, user }, null, 2)}
        </pre>
      </div>

      <button
        onClick={testAuth}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4">
        {loading ? "Testing..." : "Run Auth Debug Test"}
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

export default AuthTest;
