"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import { CheckCircle, AlertTriangle, AlertCircle, XCircle } from "lucide-react";

interface ConfidenceScore {
  overall: number;
  recencyScore: number;
  coverageScore: number;
  qualityScore: number;
  diversityScore: number;
  status: "strong" | "good" | "weak" | "poor";
  warnings: string[];
  suggestions: string[];
}

interface ConfidenceScoreCardProps {
  confidence: ConfidenceScore;
  totalCitations: number;
  onFindMissingLinks?: () => void;
}

export function ConfidenceScoreCard({
  confidence,
  totalCitations,
  onFindMissingLinks,
}: ConfidenceScoreCardProps) {
  // Safety check: return null if confidence is not provided
  if (!confidence) {
    return null;
  }

  const getStatusConfig = () => {
    switch (confidence.status) {
      case "strong":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          color: "bg-green-100 text-green-800 border-green-300",
          label: "Strong",
        };
      case "good":
        return {
          icon: <CheckCircle className="h-5 w-5 text-blue-600" />,
          color: "bg-blue-100 text-blue-800 border-blue-300",
          label: "Good",
        };
      case "weak":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          color: "bg-yellow-100 text-yellow-800 border-yellow-300",
          label: "Weak",
        };
      case "poor":
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          color: "bg-red-100 text-red-800 border-red-300",
          label: "Poor",
        };
      default:
        // Default case for unknown status
        return {
          icon: <AlertCircle className="h-5 w-5 text-black" />,
          color: "bg-gray-100 text-black border-white",
          label: "Unknown",
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Citation Confidence</span>
          <Badge className={statusConfig.color} variant="outline">
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-2xl font-bold">{confidence.overall}/100</span>
          </div>
          <Progress value={confidence.overall} className="h-2" />
        </div>

        {/* Component Scores */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Recency</span>
            <span className="font-medium">{confidence.recencyScore}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Coverage</span>
            <span className="font-medium">{confidence.coverageScore}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quality</span>
            <span className="font-medium">{confidence.qualityScore}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Diversity</span>
            <span className="font-medium">{confidence.diversityScore}%</span>
          </div>
        </div>

        {/* Total Citations */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Citations</span>
            <span className="font-semibold">{totalCitations}</span>
          </div>
        </div>

        {/* Warnings */}
        {confidence.warnings && confidence.warnings.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">Warnings:</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                {confidence.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestions */}
        {confidence.suggestions && confidence.suggestions.length > 0 && (
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Suggestions:
            </p>
            <ul className="list-disc list-inside text-xs text-blue-800 space-y-1">
              {confidence.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
            {onFindMissingLinks && (
              <button
                onClick={onFindMissingLinks}
                className="mt-3 w-full text-center text-sm font-medium text-blue-700 hover:text-blue-900 underline">
                Find Missing Link →
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
