"use client";

import React from "react";
import { CheckCircle } from "lucide-react";

const SubscriptionPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Subscription</h1>
      
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">All Features Unlocked!</h2>
        <p className="text-muted-foreground mb-4">
          WorkContext is free and open source. Enjoy all features without any subscription or payment.
        </p>
        <div className="bg-muted rounded-lg p-4 text-left">
          <h3 className="font-medium mb-2">Included for everyone:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>? Unlimited projects and documents</li>
            <li>? Unlimited AI-powered writing assistance</li>
            <li>? Unlimited plagiarism detection</li>
            <li>? All export formats (PDF, DOCX, LaTeX, etc.)</li>
            <li>? All citation styles</li>
            <li>? All templates</li>
            <li>? Real-time collaboration</li>
            <li>? Bring your own API keys</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
