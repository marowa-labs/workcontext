"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client";

const SessionDebug: React.FC = () => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log("Fetching session from Supabase");
        const { data, error } = await supabase.auth.getSession();
        console.log("Session response:", { data, error });

        setSessionData({ data, error });
      } catch (err) {
        console.error("Error fetching session:", err);
        setSessionData({ error: err });
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  if (loading) {
    return <div>Loading session data...</div>;
  }

  return (
    <div className="p-4 bg-yellow-100 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Session Debug Info</h2>
      <pre className="text-sm overflow-auto max-h-96 bg-white p-2 rounded">
        {JSON.stringify(sessionData, null, 2)}
      </pre>
    </div>
  );
};

export default SessionDebug;
