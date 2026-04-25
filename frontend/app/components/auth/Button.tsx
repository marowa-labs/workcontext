"use client";

import {
  forwardRef,
  ButtonHTMLAttributes,
  ReactNode,
  ElementType,
} from "react";
import { Loader2 } from "lucide-react";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ElementType;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      fullWidth = false,
      icon: Icon,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl focus:ring-blue-500 focus:ring-accent-ring disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none btn-primary",
      secondary:
        "bg-white dark:bg-white border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 focus:ring-blue-500 focus:ring-accent-ring disabled:border-white disabled:text-black disabled:hover:bg-white accent-border accent-link",
      outline:
        "border-2 border-white border-white text-black dark:text-black hover:bg-gray-50 dark:hover:bg-white focus:ring-gray-500 focus:ring-accent-ring disabled:border-white disabled:text-black accent-border",
      ghost:
        "text-black dark:text-black hover:bg-gray-100 dark:hover:bg-white focus:ring-gray-500 focus:ring-accent-ring accent-link",
      danger:
        "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500 disabled:bg-gray-400",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-60" : "hover:scale-105 active:scale-95"}
        ${className}
      `}
        {...props}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {Icon && !loading && <Icon className="w-4 h-4 mr-2" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
