"use client";

import { Avatar, AvatarFallback } from "../../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { FileText, CheckSquare, MessageSquare } from "lucide-react";

interface Activity {
  id: string;
  type: "task" | "project" | "comment";
  content: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
}

interface ActivityFeedProps {
  activities: any[]; // Using any for now as we aggregate diverse types
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "project":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "task":
        return <CheckSquare className="h-4 w-4 text-green-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-card rounded-lg border border-border">
        <p>No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-all opacity-0 animate-fadeIn"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: "forwards",
          }}>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {activity.user?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-foreground">
                  {activity.user?.full_name || "Unknown User"}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  {getIcon(activity.type)}
                  <span>
                    {activity.type === "task" && "Created a task: "}
                    {activity.type === "project" && "Edited project: "}
                    <span className="text-foreground font-medium">
                      {activity.title || activity.content}
                    </span>
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(
                  new Date(activity.updated_at || activity.created_at),
                  { addSuffix: true },
                )}
              </span>
            </div>
            {activity.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-muted p-2 rounded">
                {activity.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
