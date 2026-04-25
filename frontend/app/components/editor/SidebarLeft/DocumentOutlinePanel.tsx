"use client";

import { useState, useRef } from "react";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Pencil,
  Trash2,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";

// Data structures
export interface OutlineSection {
  id: string;
  name: string;
  level: 1 | 2 | 3; // H1, H2, H3
  children?: OutlineSection[];
  order: number;
  isCollapsed?: boolean;
}

interface DocumentOutlinePanelProps {
  projectId?: string;
  onSyncToEditor?: (sections: OutlineSection[]) => void;
}

// Default academic research paper template
const DEFAULT_TEMPLATE: OutlineSection[] = [
  { id: "1", name: "Title", level: 1, order: 0 },
  { id: "2", name: "Abstract", level: 2, order: 1 },
  { id: "3", name: "Introduction", level: 2, order: 2 },
  { id: "4", name: "Literature Review", level: 2, order: 3 },
  { id: "5", name: "Methodology", level: 2, order: 4 },
  { id: "6", name: "Results", level: 2, order: 5 },
  { id: "7", name: "Discussion", level: 2, order: 6 },
  { id: "8", name: "Conclusion", level: 2, order: 7 },
  { id: "9", name: "References", level: 2, order: 8 },
];

export function DocumentOutlinePanel({
  projectId,
  onSyncToEditor,
}: DocumentOutlinePanelProps) {
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionLevel, setNewSectionLevel] = useState<1 | 2 | 3>(2);

  // Drag and drop state
  const draggedItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Handle drag start
  const handleDragStart = (index: number) => {
    draggedItem.current = index;
  };

  // Handle drag enter
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (draggedItem.current === null || dragOverItem.current === null) return;
    if (draggedItem.current === dragOverItem.current) {
      draggedItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const newSections = [...sections];
    const draggedItemContent = newSections[draggedItem.current];

    // Remove dragged item
    newSections.splice(draggedItem.current, 1);

    // Insert at new position
    newSections.splice(dragOverItem.current, 0, draggedItemContent);

    // Update order
    newSections.forEach((s, i) => (s.order = i));

    setSections(newSections);
    draggedItem.current = null;
    dragOverItem.current = null;
  };

  // Load template
  const loadTemplate = () => {
    setSections(DEFAULT_TEMPLATE);
  };

  // Add section
  const addSection = () => {
    if (!newSectionName.trim()) return;

    const newSection: OutlineSection = {
      id: Date.now().toString(),
      name: newSectionName,
      level: newSectionLevel,
      order: sections.length,
    };

    setSections([...sections, newSection]);
    setNewSectionName("");
    setIsAddingSection(false);
  };

  // Add subsection to a parent
  const addSubsection = (parentId: string) => {
    const newSubsection: OutlineSection = {
      id: Date.now().toString(),
      name: "New Subsection",
      level: 3,
      order: 0,
    };

    const addToParent = (items: OutlineSection[]): OutlineSection[] => {
      return items.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children || []), newSubsection],
          };
        }
        if (item.children) {
          return { ...item, children: addToParent(item.children) };
        }
        return item;
      });
    };

    setSections(addToParent(sections));
    setEditingId(newSubsection.id);
    setEditingName("New Subsection");
  };

  // Delete section
  const deleteSection = (id: string) => {
    const removeById = (items: OutlineSection[]): OutlineSection[] => {
      return items
        .filter((item) => item.id !== id)
        .map((item) => ({
          ...item,
          children: item.children ? removeById(item.children) : undefined,
        }));
    };

    setSections(removeById(sections));
  };

  // Start editing
  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  // Save edit
  const saveEdit = () => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }

    const updateName = (items: OutlineSection[]): OutlineSection[] => {
      return items.map((item) => {
        if (item.id === editingId) {
          return { ...item, name: editingName };
        }
        if (item.children) {
          return { ...item, children: updateName(item.children) };
        }
        return item;
      });
    };

    setSections(updateName(sections));
    setEditingId(null);
    setEditingName("");
  };

  // Toggle collapse
  const toggleCollapse = (id: string) => {
    const toggle = (items: OutlineSection[]): OutlineSection[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, isCollapsed: !item.isCollapsed };
        }
        if (item.children) {
          return { ...item, children: toggle(item.children) };
        }
        return item;
      });
    };

    setSections(toggle(sections));
  };

  // Move section up/down
  const moveSection = (id: string, direction: "up" | "down") => {
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return;

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];

    // Update order
    newSections.forEach((s, i) => (s.order = i));
    setSections(newSections);
  };

  // Sync to editor
  const handleSyncToEditor = () => {
    if (onSyncToEditor) {
      onSyncToEditor(sections);
    }
  };

  // Render section item
  const renderSection = (section: OutlineSection, depth: number = 0) => {
    const isEditing = editingId === section.id;
    const hasChildren = section.children && section.children.length > 0;

    return (
      <div key={section.id} className="select-none">
        <div
          className={cn(
            "group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 transition-colors",
            depth > 0 && "ml-6",
          )}>
          {/* Collapse/Expand */}
          {hasChildren && (
            <button
              onClick={() => toggleCollapse(section.id)}
              className="p-0.5 hover:bg-gray-200 rounded">
              {section.isCollapsed ? (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              )}
            </button>
          )}

          {/* Drag Handle */}
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Level Indicator */}
          <span
            className={cn(
              "text-xs font-mono px-1 py-0.5 rounded",
              section.level === 1 && "bg-blue-100 text-blue-700",
              section.level === 2 && "bg-green-100 text-green-700",
              section.level === 3 && "bg-purple-100 text-purple-700",
            )}>
            H{section.level}
          </span>

          {/* Section Name */}
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditingId(null);
              }}
              className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-sm text-gray-700 truncate">
              {section.name}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {section.level < 3 && (
              <button
                onClick={() => addSubsection(section.id)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Add Subsection">
                <Plus className="h-3 w-3 text-gray-600" />
              </button>
            )}
            <button
              onClick={() => startEdit(section.id, section.name)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Edit">
              <Pencil className="h-3 w-3 text-gray-600" />
            </button>
            <button
              onClick={() => deleteSection(section.id)}
              className="p-1 hover:bg-red-100 rounded"
              title="Delete">
              <Trash2 className="h-3 w-3 text-red-600" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && !section.isCollapsed && (
          <div>
            {section.children!.map((child) => renderSection(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Outline
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTemplate}
            className="h-7 text-xs bg-white border-blue-600 text-blue-600 hover:bg-blue-50">
            Load Template
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Organize your document structure with sections and subsections
        </p>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {sections.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              No outline yet. Start by loading a template or adding sections.
            </p>
            <Button
              onClick={loadTemplate}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white">
              Load Research Paper Template
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={cn(
                  "transition-all",
                  draggedItem.current === index && "opacity-50",
                  dragOverItem.current === index &&
                    "border-t-2 border-blue-500",
                )}>
                {renderSection(section)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Section Form */}
      {isAddingSection && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="space-y-2">
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Section name..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <select
                value={newSectionLevel}
                onChange={(e) =>
                  setNewSectionLevel(Number(e.target.value) as 1 | 2 | 3)
                }
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={1}>H1 - Title</option>
                <option value={2}>H2 - Section</option>
                <option value={3}>H3 - Subsection</option>
              </select>
              <Button
                onClick={addSection}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Add
              </Button>
              <Button
                onClick={() => {
                  setIsAddingSection(false);
                  setNewSectionName("");
                }}
                size="sm"
                variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-gray-200 space-y-2">
        {!isAddingSection && (
          <Button
            onClick={() => setIsAddingSection(true)}
            variant="outline"
            size="sm"
            className="w-full bg-white border-blue-600 text-blue-600 hover:bg-blue-50">
            <Plus className="h-4 w-4 mr-2" />
            Add New Section
          </Button>
        )}
        {sections.length > 0 && (
          <Button
            onClick={handleSyncToEditor}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Sync to Editor
          </Button>
        )}
      </div>
    </div>
  );
}
