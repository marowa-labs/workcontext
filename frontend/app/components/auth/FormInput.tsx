"use client";

import React, { forwardRef } from "react";
import { Eye, EyeOff, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  loading?: boolean; // Add loading prop
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      className,
      label,
      error,
      success,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      loading, // Add loading prop
      type = "text",
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

    return (
      <div className="space-y-2 mt-4">
        {label && (
          <label className="text-sm font-medium text-gray-600 dark:text-gray-600 block">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-600">
              {leftIcon}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              "flex h-12 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm transition-all duration-200",
              "bg-white text-gray-600 dark:bg-white dark:text-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-[#4F8CFF] focus:shadow-[0_0_12px_rgba(79,140,255,0.3)]",
              "placeholder:text-[#8B90A1]",
              leftIcon && "pl-10",
              (rightIcon ||
                showPasswordToggle ||
                success ||
                error ||
                loading) &&
                "pr-10",
              error &&
                "border-red-500 focus:ring-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgba(239,68,68,0.3)]",
              success &&
                "border-green-500 focus:ring-green-500 focus:border-green-500 focus:shadow-[0_0_12px_rgba(34,197,94,0.3)]",
              !error &&
                !success &&
                "border-[#2A2F45] hover:border-[#4F8CFF]/50",
              props.disabled && "opacity-50 cursor-not-allowed bg-[#1C2030]/50",
              className,
            )}
            ref={ref}
            {...props}
          />
          {(rightIcon || showPasswordToggle || success || error || loading) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {loading && (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              )}
              {success && !loading && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              {error && !loading && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              {showPasswordToggle && !loading && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#8B90A1] hover:text-white transition-colors">
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
              {rightIcon && !loading}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";

export default FormInput;
