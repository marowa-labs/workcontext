"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Badge } from "../../ui/badge";

interface Member {
  id: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  role: string;
}

interface MemberListProps {
  members: Member[];
  onlineUserIds: string[]; // From Hocuspocus awareness
}

export function MemberList({ members, onlineUserIds }: MemberListProps) {
  // Sort: Online first, then by name
  const sortedMembers = useMemo(() => {
    if (!members) return [];

    return [...members].sort((a, b) => {
      const aOnline = onlineUserIds.includes(a.user?.id);
      const bOnline = onlineUserIds.includes(b.user?.id);

      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      return (a.user?.full_name || "").localeCompare(b.user?.full_name || "");
    });
  }, [members, onlineUserIds]);

  if (!members || members.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">No members found</div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedMembers.map((member) => {
        const isOnline = onlineUserIds.includes(member.user?.id);

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {member.user?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${isOnline ? "bg-green-500" : "bg-muted-foreground/30"}`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {member.user?.full_name || "Unknown User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {member.role === "admin" || member.role === "owner" ? (
                  <span className="text-primary font-medium capitalize">
                    {member.role}
                  </span>
                ) : (
                  <span className="capitalize">{member.role}</span>
                )}
              </p>
            </div>

            {/* Context menu trigger could go here */}
          </div>
        );
      })}
    </div>
  );
}
