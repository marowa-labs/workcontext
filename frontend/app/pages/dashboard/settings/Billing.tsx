"use client";

import React from "react";
import { CheckCircle } from "lucide-react";

const BillingSettingsPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Billing & Subscription</h1>
      
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Everything is Free!</h2>
        <p className="text-muted-foreground mb-4">
          WorkContext is free and open source. All features are available to everyone without limits.
        </p>
        <div className="bg-muted rounded-lg p-4 text-left">
          <h3 className="font-medium mb-2">What&apos;s included:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>? Unlimited projects</li>
            <li>? Unlimited AI requests</li>
            <li>? Unlimited plagiarism checks</li>
            <li>? All export formats</li>
            <li>? All templates</li>
            <li>? All citation formats</li>
            <li>? Real-time collaboration</li>
            <li>? Bring your own API keys (BYOK)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BillingSettingsPage;
