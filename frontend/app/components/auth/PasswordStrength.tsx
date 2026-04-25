"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface PasswordStrengthProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "One number",
    test: (password) => /\d/.test(password),
  },
  {
    label: "One special character",
    test: (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  },
];

const getPasswordStrength = (
  password: string,
): { strength: number; label: string; color: string } => {
  const passedRequirements = passwordRequirements.filter((req) =>
    req.test(password),
  );
  const strength = passedRequirements.length;

  if (strength === 0)
    return { strength: 0, label: "Weak", color: "bg-red-500" };
  if (strength === 1)
    return { strength: 33, label: "Weak", color: "bg-red-500" };
  if (strength === 2)
    return { strength: 66, label: "Medium", color: "bg-yellow-500" };
  return { strength: 100, label: "Strong", color: "bg-green-500" };
};

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const { strength, label, color } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-black">Password strength</span>
          <span
            className={cn(
              "text-sm font-medium",
              strength === 100
                ? "text-green-600"
                : strength >= 66
                  ? "text-yellow-600"
                  : "text-red-600",
            )}>
            {label}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              color,
            )}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2">
        {passwordRequirements.map((requirement, index) => {
          const isPassed = requirement.test(password);
          return (
            <div key={index} className="flex items-center space-x-2">
              <div
                className={cn(
                  "flex items-center justify-center w-4 h-4 rounded-full transition-colors",
                  isPassed
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-black",
                )}>
                {isPassed ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors",
                  isPassed ? "text-green-600" : "text-black",
                )}>
                {requirement.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrength;
