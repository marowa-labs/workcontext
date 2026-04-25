"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import styles from "../../lib/data/citationStyles.json";

interface CitationStyleSearchProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CitationStyleSearch({
  value,
  onChange,
  disabled,
}: CitationStyleSearchProps) {
  const [open, setOpen] = React.useState(false);

  // Find label for current value
  const selectedStyle = styles.find((style) => style.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="bg-white border border-gray-200">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between text-xs h-9 overflow-hidden">
          <span className="truncate">
            {selectedStyle ? selectedStyle.label : "Select style..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0 bg-white border border-gray-200 rounded-lg"
        align="start">
        <Command>
          <CommandInput placeholder="Search citation style..." />
          <CommandList>
            <CommandEmpty>No style found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto text-black">
              {styles.map((style) => (
                <CommandItem
                  key={style.value}
                  value={style.label} // Search by label
                  onSelect={() => {
                    onChange(style.value);
                    setOpen(false);
                  }}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === style.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {style.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
