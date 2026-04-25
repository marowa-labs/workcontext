"use client";

import * as React from "react";
import { Check, ChevronsUpDown, User as UserIcon, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

interface AssigneeSelectorProps {
  members: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function AssigneeSelector({
  members,
  selectedIds,
  onChange,
}: AssigneeSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const toggleMember = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedMembers = members.filter((m) => selectedIds.includes(m.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1 mb-1">
        {selectedMembers.map((member) => (
          <Badge
            key={member.id}
            variant="secondary"
            className="flex items-center gap-1 pr-1 bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
            <Avatar className="h-4 w-4">
              <AvatarFallback className="text-[8px] bg-teal-200">
                {member.full_name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[100px] truncate text-[11px]">
              {member.full_name || member.email}
            </span>
            <button
              onClick={() => toggleMember(member.id)}
              className="ml-1 hover:text-teal-900 rounded-full hover:bg-teal-200 transition-colors">
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        {selectedMembers.length === 0 && (
          <span className="text-xs text-muted-foreground italic">
            No one assigned
          </span>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 text-xs border-input bg-background text-foreground hover:bg-muted">
            <div className="flex items-center gap-2">
              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{open ? "Searching..." : "Add assignees..."}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0 bg-popover border-border text-popover-foreground"
          align="start">
          <Command>
            <CommandInput
              placeholder="Search team members..."
              className="h-9 text-xs bg-transparent"
            />
            <CommandList>
              <CommandEmpty className="text-xs p-2 text-center text-muted-foreground">
                No members found.
              </CommandEmpty>
              <CommandGroup>
                {members.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.full_name || member.email}
                    onSelect={() => toggleMember(member.id)}
                    className="text-xs">
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-teal-100 text-teal-700">
                          {member.full_name?.substring(0, 2).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {member.full_name || "Unknown User"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {member.email}
                        </span>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-3 w-3",
                        selectedIds.includes(member.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
