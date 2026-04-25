"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { apiClient } from "../../lib/utils/apiClient";

const AuthDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      // Get current session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      // Test API client
      let apiTestResult = null;
      let apiTestError = null;
      try {
        apiTestResult = await apiClient.get("/api/test-auth-token");
      } catch (error) {
        apiTestError = error instanceof Error ? error.message : "Unknown error";
      }

      setDebugInfo({
        session: sessionData?.session,
        sessionError: sessionError?.message,
        user: userData?.user,
        userError: userError?.message,
        apiTestResult,
        apiTestError,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Debug test failed:", error);
      setDebugInfo({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Authentication Debug</h2>
      <button
        onClick={testAuth}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
        {loading ? "Testing..." : "Run Auth Debug Test"}
      </button>

      {debugInfo && (
        <div className="mt-4 p-4 bg-white rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Results</h3>
          <pre className="text-sm overflow-auto max-h-96 bg-gray-50 p-2 rounded">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;
