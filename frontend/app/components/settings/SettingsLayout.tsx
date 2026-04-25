"use client";

import React, { useState } from "react";
import {
  User,
  Settings,
  Bell,
  Sparkles,
  CreditCard,
  Lock,
  Database,
  HelpCircle,
  Trash2,
  Shield,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../../contexts/ThemeContext";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const { settings } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Only apply custom layout preferences if the user has enabled them for this layout
  const shouldApplyCustomLayout = settings.layoutSettings !== false;

  // Determine transition classes based on animation settings
  const getTransitionClasses = () => {
    // Only apply custom animation settings if user has enabled it for this layout
    if (!shouldApplyCustomLayout) {
      return "transition-colors duration-200"; // Default transitions
    }

    if (settings.reduceMotion) {
      return "transition-none";
    } else if (settings.animations === false) {
      return "transition-none";
    }
    return "transition-colors duration-200"; // default
  };

  const transitionClasses = getTransitionClasses();

  // Determine sidebar position classes based on user preference
  const getSidebarPositionClasses = () => {
    // Only apply custom sidebar position if user has enabled it for this layout
    const sidebarPosition = shouldApplyCustomLayout
      ? settings.sidebarPosition
      : "left"; // Default to left if not enabled

    if (sidebarPosition === "right") {
      return {
        sidebar:
          "lg:block lg:w-64 xl:w-80 flex-shrink-0 border-l border-border bg-card",
        sidebarTransform: mobileMenuOpen ? "block" : "hidden",
        // Removed excessive margins, using flex-based layout instead
      };
    } else {
      // Default to left position
      return {
        sidebar:
          "lg:block lg:w-64 xl:w-80 flex-shrink-0 border-r border-border bg-card",
        sidebarTransform: mobileMenuOpen ? "block" : "hidden",
        // Removed excessive margins, using flex-based layout instead
      };
    }
  };

  const positionClasses = getSidebarPositionClasses();

  // Define all navigation items with feature requirements
  const allNavigationItems = [
    { id: "profile", label: "Profile", icon: User, path: "profile" },
    {
      id: "account",
      label: "Account",
      icon: Settings,
      path: "account",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      path: "notifications",
    },

    { id: "ai", label: "AI Preferences", icon: Sparkles, path: "ai" },
    {
      id: "billing",
      label: "Billing",
      icon: CreditCard,
      path: "billing",
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      icon: Lock,
      path: "privacy",
    },
    {
      id: "recycle-bin",
      label: "Recycle Bin",
      icon: Trash2,
      path: "recycle-bin",
    },
    {
      id: "data",
      label: "Data & Export",
      icon: Database,
      path: "data",
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: MessageSquare,
      path: "feedback",
    },
    {
      id: "compliance",
      label: "Compliance",
      icon: Shield,
      path: "compliance",
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle,
      path: "help",
    },
  ];

  // Filter navigation items based on user's plan
  const navigationItems = allNavigationItems;

  const getCurrentSection = () => {
    const path = pathname;
    // Extract the last part of the path to determine the current section
    const pathParts = path.split("/").filter((part) => part.length > 0);
    const lastPart = pathParts[pathParts.length - 1] || "profile";

    // Special handling for settings root path
    if (path === "/settings" || path === "/settings/") {
      return "profile";
    }

    const section = navigationItems.find((item) => item.path === lastPart);
    return section ? section.id : "profile";
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden p-4 border-b border-border">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex items-center justify-between w-full p-3 text-left bg-card rounded-lg ${transitionClasses}`}>
          <span className="font-medium text-foreground">
            {navigationItems.find((item) => item.id)?.label || "Settings"}
          </span>
          <svg
            className={`w-5 h-5 text-foreground ${settings.animations && shouldApplyCustomLayout ? "transition-transform" : ""} ${mobileMenuOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`${positionClasses.sidebar} ${positionClasses.sidebarTransform}`}>
        <div className="lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] overflow-y-auto border-r border-border">
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = getCurrentSection() === item.id;
              return (
                <Link
                  key={item.id}
                  href={`/settings/${item.path}`}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 accent-border tab-active"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  } ${transitionClasses}`}
                  onClick={() => setMobileMenuOpen(false)}>
                  <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 bg-background">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
};

export default SettingsLayout;
