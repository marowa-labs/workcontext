"use client";

import { useState, useEffect } from "react";
import { ListTodo, Calendar, Hash, Type, ChevronRight } from "lucide-react";
import workspaceTaskService, {
  WorkspaceTask,
  WorkspaceCustomField,
  TaskCustomFieldValue,
} from "../../../lib/utils/workspaceTaskService";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Calendar as CalendarComponent } from "../../ui/calendar";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";

interface CustomFieldsSectionProps {
  task: WorkspaceTask;
  onUpdate: () => void;
}

export default function CustomFieldsSection({
  task,
  onUpdate,
}: CustomFieldsSectionProps) {
  const [definitions, setDefinitions] = useState<WorkspaceCustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadDefinitions();
    // Initialize editing values from task
    const initialValues: Record<string, any> = {};
    task.custom_field_values?.forEach((val) => {
      initialValues[val.field_id] =
        val.text_value || val.number_value || val.date_value;
    });
    setEditingValues(initialValues);
  }, [task]);

  const loadDefinitions = async () => {
    try {
      setIsLoading(true);
      const data = await workspaceTaskService.getCustomFieldDefinitions(
        task.workspace_id,
      );
      setDefinitions(data);
    } catch (error) {
      console.error("Failed to load field definitions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = async (fieldId: string, value: any) => {
    setEditingValues((prev) => ({ ...prev, [fieldId]: value }));

    // Auto-save
    try {
      setIsSaving(true);
      await workspaceTaskService.updateTaskCustomFields(task.id, {
        [fieldId]: value,
      });
      onUpdate();
    } catch (error) {
      console.error("Failed to update custom field:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-4 text-xs text-muted-foreground animate-pulse">
        Loading custom fields...
      </div>
    );
  if (definitions.length === 0) return null;

  return (
    <div className="space-y-4 py-4 border-t border-border mt-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground px-1">
        <ListTodo className="w-4 h-4 text-emerald-500" />
        <h3>Custom Fields</h3>
        {isSaving && (
          <span className="text-[10px] text-muted-foreground animate-pulse ml-auto italic">
            Saving...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {definitions.map((field) => {
          const value = editingValues[field.id];
          const Icon =
            field.type === "number"
              ? Hash
              : field.type === "date"
                ? Calendar
                : Type;

          return (
            <div key={field.id} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 px-1">
                <Icon className="w-3 h-3" />
                {field.name}
              </label>

              {field.type === "dropdown" ? (
                <Select
                  value={value || ""}
                  onValueChange={(val) => handleValueChange(field.id, val)}>
                  <SelectTrigger className="h-9 text-sm bg-muted/30 border-transparent hover:border-border transition-colors">
                    <SelectValue placeholder={`Select ${field.name}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(field.options) ? field.options : []).map(
                      (opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              ) : field.type === "date" ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-9 justify-start text-left font-normal text-sm bg-muted/30 border-transparent hover:border-border",
                        !value && "text-muted-foreground",
                      )}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {value ? (
                        format(new Date(value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={value ? new Date(value) : undefined}
                      onSelect={(date) => handleValueChange(field.id, date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  className="h-9 text-sm bg-muted/30 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
                  placeholder={`Enter ${field.name}...`}
                  value={value || ""}
                  onChange={(e) =>
                    setEditingValues((prev) => ({
                      ...prev,
                      [field.id]: e.target.value,
                    }))
                  }
                  onBlur={(e) => handleValueChange(field.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
