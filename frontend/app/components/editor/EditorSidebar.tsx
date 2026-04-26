"use client";

import { useState } from "react";
import {
  PenTool,
  Menu,
  ArrowLeft,
  ChevronLeft,
  Settings,
  FileText,
  Wand2,
  MessageSquare,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface EditorSidebarProps {
  className?: string;
  onNavigate?: (id: string) => void;
  allowedPanels?: string[];
}

export function EditorSidebar({
  className,
  onNavigate,
  allowedPanels = [
    "writing",
    "my-documents",
    "outline",
    "language",
    "team-chat",
  ],
}: EditorSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("writing"); // Default to writing
  const router = useRouter();

  // Handle back navigation with deferred saving
  const handleBack = () => {
    // Navigate back to the previous page
    router.back();
  };

  const navItems = [
    {
      id: "my-documents",
      label: "My Documents",
      icon: FileText,
      description: "Manage your projects",
    },
    {
      id: "outline",
      label: "Document Outline",
      icon: PenTool,
      description: "Structure your document",
    },
    {
      id: "language",
      label: "Language Check",
      icon: Wand2,
      description: "Grammar and style checking",
    },
    {
      id: "team-chat",
      label: "Team Chat",
      icon: MessageSquare,
      description: "Collaborate with your team",
    },
  ].filter((item) => allowedPanels.includes(item.id));

  return (
    <div
      className={cn(
        "h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20 shadow-sm overflow-x-hidden",
        isCollapsed ? "w-16 items-center" : "w-64",
        className,
      )}>
      {/* Header / Toggle */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-gray-100 px-3 overflow-x-hidden",
          isCollapsed ? "justify-center" : "justify-between",
        )}>
        {!isCollapsed && (
          <button
            onClick={handleBack}
            className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors group">
            <ArrowLeft className="h-5 w-5 text-[#475569] group-hover:text-[#0F172A] transition-colors" />{" "}
            <span className="font-semibold text-gray-800 ml-2">
              Display
            </span>{" "}
          </button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 space-y-2 overflow-y-auto overflow-x-hidden px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveItem(item.id);
              if (onNavigate) onNavigate(item.id);
            }}
            className={cn(
              "w-full flex items-center p-2 rounded-lg transition-all duration-200 group relative",
              activeItem === item.id
                ? "bg-amber-50 text-amber-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              isCollapsed && "justify-center",
            )}>
            {/* Active Indicator Line */}
            {activeItem === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-amber-400 rounded-r-full" />
            )}

            <item.icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors",
                activeItem === item.id
                  ? "text-amber-600"
                  : "text-gray-500 group-hover:text-gray-700",
                !isCollapsed && "mr-3",
              )}
            />

            {!isCollapsed && (
              <div className="text-left overflow-hidden">
                <div className="font-medium text-sm truncate">{item.label}</div>
                {/* <div className="text-xs text-gray-400 truncate">{item.description}</div> */}
              </div>
            )}

            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-100 mt-auto">
        <button
          className={cn(
            "w-full flex items-center p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors",
            isCollapsed && "justify-center",
          )}>
          <Settings className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && (
            <span className="text-sm font-medium">Settings</span>
          )}
        </button>
      </div>
    </div>
  );
}
