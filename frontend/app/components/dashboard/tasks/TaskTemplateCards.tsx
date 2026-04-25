"use client";

import React from "react";
import {
  ClipboardList,
  Tag,
  CheckSquare,
  Clock,
  ChevronRight,
  Zap,
  Star,
} from "lucide-react";

interface TaskTemplate {
  id: string;
  template_name: string;
  template_category: string | null;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  subtasks?: any[];
  estimated_hours?: number;
}

interface TaskTemplateCardsProps {
  templates: TaskTemplate[];
  onSelect: (template: TaskTemplate) => void;
  isLoading?: boolean;
}

const TaskTemplateCards: React.FC<TaskTemplateCardsProps> = ({
  templates,
  onSelect,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-100 dark:bg-gray-800 h-32 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          No templates found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Save existing tasks as templates to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div
          key={template.id}
          onClick={() => onSelect(template)}
          className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden">
          {/* Category Badge */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              <Tag className="w-3 h-3 mr-1" />
              {template.template_category || "General"}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                template.priority === "high"
                  ? "bg-red-500"
                  : template.priority === "medium"
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
            />
          </div>

          <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {template.template_name || template.title}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 min-h-[40px]">
            {template.description || "No description provided."}
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                {template.subtasks?.length || 0} subtasks
              </span>
              {template.estimated_hours && (
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {template.estimated_hours}h
                </span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Hover Overlay Icon */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskTemplateCards;
