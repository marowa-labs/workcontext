"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Settings2, Info } from "lucide-react";
import workspaceTaskService, {
  WorkspaceCustomField,
} from "../../../lib/utils/workspaceTaskService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";

interface CustomFieldManagerProps {
  workspaceId: string;
}

export default function CustomFieldManager({
  workspaceId,
}: CustomFieldManagerProps) {
  const [fields, setFields] = useState<WorkspaceCustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("text");
  const [newOptions, setNewOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  useEffect(() => {
    loadFields();
  }, [workspaceId]);

  const loadFields = async () => {
    try {
      setIsLoading(true);
      const data =
        await workspaceTaskService.getCustomFieldDefinitions(workspaceId);
      setFields(data);
    } catch (error) {
      console.error("Failed to load custom fields:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!newName.trim()) return;

    try {
      await workspaceTaskService.createCustomFieldDefinition(workspaceId, {
        name: newName,
        type: newType,
        options: newType === "dropdown" ? newOptions : undefined,
      });
      setNewName("");
      setNewType("text");
      setNewOptions([]);
      setIsAdding(false);
      loadFields();
    } catch (error) {
      console.error("Failed to add custom field:", error);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this custom field? This will delete all values stored in tasks.",
      )
    )
      return;

    try {
      await workspaceTaskService.deleteCustomFieldDefinition(
        workspaceId,
        fieldId,
      );
      loadFields();
    } catch (error) {
      console.error("Failed to delete custom field:", error);
    }
  };

  const addOption = () => {
    if (optionInput.trim() && !newOptions.includes(optionInput.trim())) {
      setNewOptions([...newOptions, optionInput.trim()]);
      setOptionInput("");
    }
  };

  const removeOption = (opt: string) => {
    setNewOptions(newOptions.filter((o) => o !== opt));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <Settings2 className="w-4 h-4" />
          <span>Custom Fields</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-emerald-600" />
            Workspace Custom Fields
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Info */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Custom fields allow you to track specialized metadata for tasks in
              this workspace. Definitions are shared across all tasks.
            </p>
          </div>

          {/* List of Existing Fields */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Applied Fields</h3>
            {isLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground text-center">
                Loading fields...
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg text-muted-foreground">
                <p className="text-sm italic">No custom fields defined yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border border rounded-lg">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {field.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {field.type}
                        </Badge>
                      </div>
                      {field.type === "dropdown" && field.options && (
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(field.options)
                            ? field.options
                            : []
                          ).map((opt: string) => (
                            <span
                              key={opt}
                              className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => handleDeleteField(field.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Field UI */}
          {!isAdding ? (
            <Button
              variant="outline"
              className="w-full border-dashed border-2 py-6 h-auto flex flex-col items-center gap-2"
              onClick={() => setIsAdding(true)}>
              <Plus className="w-5 h-5" />
              <span>Define New Field</span>
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Field Name</label>
                  <Input
                    placeholder="e.g., DOI"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Field Type</label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newType === "dropdown" && (
                <div className="space-y-3 p-3 bg-background rounded border">
                  <label className="text-xs font-medium">
                    Dropdown Options
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {newOptions.map((opt) => (
                      <Badge
                        key={opt}
                        variant="secondary"
                        className="flex gap-1 items-center px-2">
                        {opt}
                        <Trash2
                          className="w-3 h-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeOption(opt)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add option..."
                      className="h-8 text-sm"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addOption()}
                    />
                    <Button
                      size="sm"
                      className="bg-emerald-600 h-8"
                      onClick={addOption}>
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleAddField}>
                  Add Field
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
