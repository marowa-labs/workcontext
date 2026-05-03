"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Settings, Type, Sparkles, Bell, Keyboard, Bot } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import AIModelAccessControl from "../../lib/utils/aiModelAccessControl";
import * as EditorService from "../../lib/utils/editorService";

interface EditorSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  showLineNumbers: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
  aiSuggestions: boolean;
  aiModel: string;
  aiTone: string;
  notifications: boolean;
  soundEffects: boolean;
  collaboratorJoinSound: boolean;
  pageColor: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  isCurrent: boolean;
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
}

export const defaultSettings: EditorSettings = {
  fontSize: 16,
  lineHeight: 1.6,
  fontFamily: "default",
  showLineNumbers: false,
  autoSave: false,
  autoSaveInterval: 30,
  spellCheck: false,
  aiSuggestions: false,
  aiModel: "gemini-2.5-flash",
  aiTone: "professional",
  notifications: false,
  soundEffects: false,
  collaboratorJoinSound: false,
  pageColor: "#FFFFFF", // Default to Pure White
};

export function SettingsModal({
  open,
  onOpenChange,
  settings = defaultSettings,
  onSettingsChange,
}: SettingsModalProps) {
  // Ensure settings always have default values to prevent uncontrolled to controlled switch
  const initialSettings = settings || defaultSettings;
  const [localSettings, setLocalSettings] =
    useState<EditorSettings>(initialSettings);
  const [originalSettings, setOriginalSettings] =
    useState<EditorSettings>(initialSettings);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAiModels = async () => {
      try {
        const modelsWithAccess =
          await AIModelAccessControl.getModelsWithAccessInfo();
        // Mark the currently selected model as isCurrent
        const models = modelsWithAccess.map((model) => ({
          ...model,
          isCurrent: model.id === localSettings.aiModel,
        }));
        setAiModels(models);
      } catch (error) {
        console.error("Failed to fetch AI models:", error);
      }
    };

    fetchAiModels();
  }, [localSettings.aiModel]);

  // Update local settings when props change
  useEffect(() => {
    // Ensure settings always have default values to prevent uncontrolled to controlled switch
    const updatedSettings = settings || defaultSettings;
    setLocalSettings(updatedSettings);
    setOriginalSettings(updatedSettings);
  }, [settings]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const updateSetting = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K],
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);

    // Immediately save to backend and propagate to parent
    onSettingsChange(newSettings);

    // Also save to server immediately (don't await to avoid blocking UI)
    EditorService.updateEditorSettings(newSettings).catch((error) => {
      console.warn("Failed to save editor settings to server:", error);
      // Show user-friendly error message
      if (error.message && error.message.includes("unavailable")) {
        console.error(
          "Editor settings service is temporarily unavailable. Please try again later.",
        );
      }
    });
  };

  const saveSettings = () => {
    // Execute any pending saves immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
      // Save to server immediately
      EditorService.updateEditorSettings(localSettings).catch((error) => {
        console.warn("Failed to save editor settings to server:", error);
        // Show user-friendly error message
        if (error.message && error.message.includes("unavailable")) {
          console.error(
            "Editor settings service is temporarily unavailable. Please try again later.",
          );
        }
      });
    }

    // Update original settings to current settings
    setOriginalSettings(localSettings);

    // Close the modal
    onOpenChange(false);
  };

  const cancelSettings = () => {
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Restore original settings
    setLocalSettings(originalSettings);
    onSettingsChange(originalSettings);
    onOpenChange(false);
  };

  const { settings: globalSettings, updateSettings } = useTheme();

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          cancelSettings();
        } else {
          onOpenChange(true);
        }
      }}>
      <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <Settings className="h-5 w-5 text-black" />
            Editor Settings
          </DialogTitle>
          <DialogDescription className="text-black">
            Customize your editing experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1">
            <TabsTrigger
              value="editor"
              className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-black hover:bg-gray-200 rounded-md transition-all">
              <Type className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-black hover:bg-gray-200 rounded-md transition-all">
              <Sparkles className="h-4 w-4" />
              AI
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-black hover:bg-gray-200 rounded-md transition-all">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger
              value="shortcuts"
              className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-black hover:bg-gray-200 rounded-md transition-all">
              <Keyboard className="h-4 w-4" />
              Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6 py-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-black">
                  Typography
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-black">
                      Font Size: {localSettings.fontSize}px
                    </Label>
                    <Slider
                      value={[localSettings.fontSize]}
                      onValueChange={([v]) => updateSetting("fontSize", v)}
                      min={12}
                      max={24}
                      step={1}
                      className="py-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-black">
                      Line Height: {localSettings.lineHeight}
                    </Label>
                    <Slider
                      value={[localSettings.lineHeight * 10]}
                      onValueChange={([v]) =>
                        updateSetting("lineHeight", v / 10)
                      }
                      min={12}
                      max={24}
                      step={1}
                      className="py-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-black">Font Family</Label>
                    <Select
                      value={localSettings.fontFamily}
                      onValueChange={(v) => updateSetting("fontFamily", v)}>
                      <SelectTrigger className="scale-100 border-gray-200 bg-white text-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem
                          value="default"
                          className="text-black focus:bg-gray-100 cursor-pointer">
                          System Default
                        </SelectItem>
                        <SelectItem
                          value="serif"
                          className="text-black focus:bg-gray-100 cursor-pointer">
                          Serif
                        </SelectItem>
                        <SelectItem
                          value="mono"
                          className="text-black focus:bg-gray-100 cursor-pointer">
                          Monospace
                        </SelectItem>
                        <SelectItem
                          value="inter"
                          className="text-black focus:bg-gray-100 cursor-pointer">
                          Inter
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-black">
                  Editing
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="spellcheck" className="text-black">
                      Spell Check
                    </Label>
                    <Switch
                      id="spellcheck"
                      checked={localSettings.spellCheck}
                      onCheckedChange={(v) => updateSetting("spellCheck", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="autosave" className="text-black">
                      Auto Save
                    </Label>
                    <Switch
                      id="autosave"
                      checked={localSettings.autoSave}
                      onCheckedChange={(v) => updateSetting("autoSave", v)}
                    />
                  </div>

                  {localSettings.autoSave && (
                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                      <Label className="text-black">
                        Auto Save Interval: {localSettings.autoSaveInterval}s
                      </Label>
                      <Slider
                        value={[localSettings.autoSaveInterval]}
                        onValueChange={([v]) =>
                          updateSetting("autoSaveInterval", v)
                        }
                        min={10}
                        max={120}
                        step={10}
                        className="py-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="h-[calc(100vh-200px)]">
            <div className="h-full overflow-y-auto pr-2">
              <div className="space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-suggestions" className="text-black">
                      AI Writing Suggestions
                    </Label>
                    <p className="text-xs text-black">
                      Get real-time writing suggestions
                    </p>
                  </div>
                  <Switch
                    id="ai-suggestions"
                    checked={localSettings.aiSuggestions}
                    onCheckedChange={(v) => updateSetting("aiSuggestions", v)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black">Writing Tone</Label>
                  <Select
                    value={localSettings.aiTone}
                    onValueChange={(v) => updateSetting("aiTone", v)}>
                    <SelectTrigger className="scale-100 border-gray-200 bg-white text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem
                        value="professional"
                        className="text-black focus:bg-gray-100 cursor-pointer">
                        Professional
                      </SelectItem>
                      <SelectItem
                        value="casual"
                        className="text-black focus:bg-gray-100 cursor-pointer">
                        Casual
                      </SelectItem>
                      <SelectItem
                        value="academic"
                        className="text-black focus:bg-gray-100 cursor-pointer">
                        Academic
                      </SelectItem>
                      <SelectItem
                        value="creative"
                        className="text-black focus:bg-gray-100 cursor-pointer">
                        Creative
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-black mb-3">AI Model</Label>
                    <p className="text-sm text-black mb-4">
                      Select the AI model you want to use for writing
                      assistance. Different models have different capabilities
                      and token limits.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {aiModels.map((model) => (
                      <div
                        key={model.id}
                        className={`p-4 rounded-lg border cursor-pointer ${model.isCurrent
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                          }`}
                        onClick={() => updateSetting("aiModel", model.id)}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium flex items-center">
                              <Bot size={16} className="mr-2" />
                              {model.name}
                              {model.isCurrent && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-black mt-1">
                              {model.description}
                            </p>
                            <p className="text-xs text-black mt-1">
                              Max tokens: {model.maxTokens.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border ${localSettings.aiModel === model.id ? "bg-blue-500 border-blue-500" : "border-gray-200"}`}>
                              {localSettings.aiModel === model.id && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-black mt-4">
                    <p>
                      Your current plan allows access to {aiModels.length} AI
                      models.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-black">
                  Enable Notifications
                </Label>
                <Switch
                  id="notifications"
                  checked={localSettings.notifications}
                  onCheckedChange={(v) => updateSetting("notifications", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sound-effects" className="text-black">
                    Sound Effects
                  </Label>
                  <p className="text-xs text-black">
                    Play sounds for actions and events
                  </p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={localSettings.soundEffects}
                  onCheckedChange={(v) => updateSetting("soundEffects", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="collab-sound" className="text-black">
                    Collaborator Join Sound
                  </Label>
                  <p className="text-xs text-black">
                    Play sound when collaborators join
                  </p>
                </div>
                <Switch
                  id="collab-sound"
                  checked={localSettings.collaboratorJoinSound}
                  onCheckedChange={(v) =>
                    updateSetting("collaboratorJoinSound", v)
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shortcuts" className="space-y-4 py-4">
            <div className="grid gap-2">
              {[
                { keys: "Ctrl/Cmd + B", action: "Bold" },
                { keys: "Ctrl/Cmd + I", action: "Italic" },
                { keys: "Ctrl/Cmd + U", action: "Underline" },
                { keys: "Ctrl/Cmd + K", action: "Insert Link" },
                { keys: "Ctrl/Cmd + Z", action: "Undo" },
                { keys: "Ctrl/Cmd + Shift + Z", action: "Redo" },
                { keys: "Ctrl/Cmd + S", action: "Save" },
                { keys: "Ctrl/Cmd + /", action: "Toggle Comment" },
                { keys: "Ctrl/Cmd + Shift + 8", action: "Bullet List" },
                { keys: "Ctrl/Cmd + Shift + 9", action: "Numbered List" },
                { keys: "Ctrl/Cmd + Alt + 1-4", action: "Heading 1-4" },
                { keys: "Ctrl/Cmd + E", action: "Center Align" },
                { keys: "Esc", action: "Exit Focus Mode" },
              ].map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-black">{shortcut.action}</span>
                  <kbd className="px-2 py-1 text-xs bg-gray-100 text-black border border-gray-200 rounded font-mono">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={cancelSettings}
            className="border-gray-200 text-black bg-gray-500 hover:bg-white">
            Cancel
          </Button>
          <Button
            className="border-gray-200 text-black bg-blue-500 hover:bg-blue-600 text-white"
            onClick={saveSettings}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
