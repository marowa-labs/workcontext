"use client";

import React from "react";
import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface SmartCitationBadgeProps {
  supporting: number;
  mentioning: number;
  contrasting: number;
  size?: "sm" | "md";
}

export function SmartCitationBadge({
  supporting,
  mentioning,
  contrasting,
  size = "md",
}: SmartCitationBadgeProps) {
  const total = supporting + mentioning + contrasting;

  if (total === 0) return null;

  const height = size === "sm" ? "h-5 text-[10px]" : "h-6 text-xs";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <div
      className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-200 px-1.5 py-0.5"
      title="Smart Citation Analysis">
      {/* Label */}
      <span
        className={cn(
          "font-semibold text-gray-500 mr-1",
          size === "sm" ? "text-[10px]" : "text-xs",
        )}>
        scite
      </span>

      {/* Supporting */}
      {supporting > 0 && (
        <div
          className="flex items-center gap-0.5 text-emerald-600"
          title={`${supporting} supporting citations`}>
          <CheckCircle2 className={iconSize} />
          <span
            className={cn(
              "font-medium",
              size === "sm" ? "text-[10px]" : "text-xs",
            )}>
            {supporting}
          </span>
        </div>
      )}

      {/* Mentioning */}
      {mentioning > 0 && (
        <div
          className="flex items-center gap-0.5 text-gray-500"
          title={`${mentioning} mentioning citations`}>
          <MinusCircle className={iconSize} />
          <span
            className={cn(
              "font-medium",
              size === "sm" ? "text-[10px]" : "text-xs",
            )}>
            {mentioning}
          </span>
        </div>
      )}

      {/* Contrasting */}
      {contrasting > 0 && (
        <div
          className="flex items-center gap-0.5 text-rose-600"
          title={`${contrasting} contrasting citations`}>
          <XCircle className={iconSize} />
          <span
            className={cn(
              "font-medium",
              size === "sm" ? "text-[10px]" : "text-xs",
            )}>
            {contrasting}
          </span>
        </div>
      )}
    </div>
  );
}
