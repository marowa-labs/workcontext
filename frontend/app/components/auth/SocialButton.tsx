"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  children,
  isLoading,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        "flex items-center justify-center space-x-3 w-full h-12 px-4 py-2",
        "bg-white/60 backdrop-blur-sm border border-white rounded-xl",
        "hover:bg-white/80 hover:border-white hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "transition-all duration-200 btn-glow",
        "text-black font-medium",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      disabled={isLoading}
      {...props}>
      {isLoading ? (
        <div className="h-5 w-5 border-2 border-white border-t-gray-600 rounded-full animate-spin" />
      ) : (
        <>
          <div className="h-5 w-5 flex items-center justify-center">{icon}</div>
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default SocialButton;
