"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Sparkles,
  BarChart3,
  TrendingUp,
  DollarSign,
  Key,
  Shield,
  Check,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import AIService from "../../../lib/utils/aiService";
import BYOKFrontendService, {
  BYOKSettings,
  BYOKProvider,
} from "../../../lib/utils/byokService";
import { useToast } from "../../../hooks/use-toast";

const AISettingsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    aiMode: "assisted",
    autoSuggestions: true,
    suggestionFrequency: "medium",
    formalityLevel: "academic",
    vocabularyLevel: "standard",
    sentenceLength: "medium",
    voicePreference: "active",
    language: "en-US",
    fieldOfStudy: "general",
    useForImprovement: true,
    storeHistory: true,
    anonymousData: true,
    model: "gemini-3.1-flash-lite-preview",
    temperature: 0.7,
    maxTokens: 1000,
  });

  const [saveError, setSaveError] = useState<string | null>(null);

  const [usage, setUsage] = useState<{
    remaining: number;
    limit: number;
  } | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  // BYOK (Bring Your Own Key) State
  const [byokSettings, setByokSettings] = useState<BYOKSettings | null>(null);
  const [byokInputKeys, setByokInputKeys] = useState({
    google: "",
    anthropic: "",
    openai: "",
    openrouter: "",
  });
  const [byokShowKeys, setByokShowKeys] = useState({
    google: false,
    anthropic: false,
    openai: false,
    openrouter: false,
  });
  const [byokTesting, setByokTesting] = useState<BYOKProvider | null>(null);
  const [byokSaving, setByokSaving] = useState<BYOKProvider | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch usage data
        const usageData = await AIService.getAIUsage();
        setUsage({
          remaining: usageData.remaining,
          limit: usageData.limit,
        });

        // Fetch available models
        const modelsData = await AIService.getAvailableModels();
        setModels(modelsData.models || []);

        // Set current model
        if (modelsData.currentModel) {
          setSettings((prev) => ({
            ...prev,
            model: modelsData.currentModel,
          }));
        }

        // Fetch analytics data
        const analyticsData = await AIService.getAIAnalytics();
        // Ensure analytics has default structure even if empty
        setAnalytics({
          totalRequests: 0,
          successfulRequests: 0,
          totalTokensUsed: 0,
          costEstimate: 0,
          mostUsedActions: {},
          modelUsage: {},
          favoriteFeatures: {},
          peakUsageHours: {},
          ...analyticsData,
        });

        // Fetch AI preferences
        const preferences = await AIService.getAIPreferences();
        if (preferences) {
          setSettings((prev) => ({
            ...prev,
            ...preferences,
          }));
        }

        // Fetch BYOK settings
        try {
          const byokData = await BYOKFrontendService.getSettings();
          setByokSettings(byokData);
        } catch (byokErr) {
          console.error("Failed to fetch BYOK settings:", byokErr);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    // Since we're saving automatically on change, this function can be used for manual saves if needed
    // For now, we'll just show a message that settings are already saved
    toast({
      title: "Settings Up to Date",
      description: "Your AI preferences are already saved.",
    });
  };

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Apply settings immediately
    applySettingChange(field, value);
  };

  // Apply setting change immediately
  const applySettingChange = async (field: string, value: any) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // For model changes, use the specific model update endpoint
      if (field === "model") {
        await AIService.updatePreferredModel(value);
      }

      // Save all settings to backend
      const settingsToUpdate = { ...settings, [field]: value };
      await AIService.updateAIPreferences(settingsToUpdate);

      setSaveSuccess(true);
      toast({
        title: "Settings Updated",
        description: "Your AI preferences have been updated successfully.",
      });

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSaveError(errorMessage);
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Failed to update settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return "Unlimited";
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get usage percentage (handle unlimited case)
  const getUsagePercentage = () => {
    if (!usage) return 0;
    if (usage.limit >= 1000000) {
      return 0; // For unlimited plans, show 0% usage
    }
    // Calculate percentage of remaining requests
    return (usage.remaining / usage.limit) * 100;
  };

  // Get usage text
  const getUsageText = () => {
    if (!usage) return "Loading...";
    if (usage.limit >= 1000000) {
      return `You have unlimited requests remaining`;
    }
    if (usage.remaining > 0) {
      return `You have ${usage.remaining} requests remaining this month`;
    }
    return `You've reached your monthly limit`;
  };

  // Get most used action
  const getMostUsedAction = () => {
    if (!analytics || !analytics.mostUsedActions) return "N/A";
    const actions: any = analytics.mostUsedActions;
    const maxAction = Object.keys(actions).reduce(
      (a: string, b: string) => (actions[a] > actions[b] ? a : b),
      Object.keys(actions)[0],
    );
    return maxAction || "N/A";
  };

  // Get peak usage hour
  const getPeakUsageHour = () => {
    if (!analytics || !analytics.peakUsageHours) return "N/A";
    const hours: any = analytics.peakUsageHours;
    const peakHour = Object.keys(hours).reduce(
      (a: string, b: string) => (hours[a] > hours[b] ? a : b),
      Object.keys(hours)[0],
    );
    return peakHour ? `${peakHour}:00` : "N/A";
  };

  // ==================== BYOK Helper Functions ====================

  // Test API key without saving
  const handleTestKey = async (provider: BYOKProvider) => {
    const key = byokInputKeys[provider];
    if (!key) {
      toast({
        title: "Error",
        description: "Please enter an API key to test",
        variant: "destructive",
      });
      return;
    }

    setByokTesting(provider);
    try {
      const result = await BYOKFrontendService.testApiKey(provider, key);
      toast({
        title: result.success ? "Success" : "Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to test API key",
        variant: "destructive",
      });
    } finally {
      setByokTesting(null);
    }
  };

  // Save API key
  const handleSaveKey = async (provider: BYOKProvider) => {
    const key = byokInputKeys[provider];
    if (!key) {
      toast({
        title: "Error",
        description: "Please enter an API key to save",
        variant: "destructive",
      });
      return;
    }

    setByokSaving(provider);
    try {
      const result = await BYOKFrontendService.saveApiKey(provider, key);
      toast({
        title: "Success",
        description: result.message,
      });
      // Refresh settings
      const updatedSettings = await BYOKFrontendService.getSettings();
      setByokSettings(updatedSettings);
      // Clear input
      setByokInputKeys((prev) => ({ ...prev, [provider]: "" }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setByokSaving(null);
    }
  };

  // Delete API key
  const handleDeleteKey = async (provider: BYOKProvider) => {
    if (
      !confirm(
        `Are you sure you want to delete your ${BYOKFrontendService.getProviderDisplayName(provider)} API key?`,
      )
    ) {
      return;
    }

    try {
      const message = await BYOKFrontendService.deleteApiKey(provider);
      toast({
        title: "Success",
        description: message,
      });
      // Refresh settings
      const updatedSettings = await BYOKFrontendService.getSettings();
      setByokSettings(updatedSettings);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  // Toggle BYOK enabled state
  const handleToggleBYOK = async (enabled: boolean) => {
    try {
      const updatedSettings = await BYOKFrontendService.updateSettings({
        enabled,
      });
      setByokSettings(updatedSettings);
      toast({
        title: "Success",
        description: enabled
          ? "BYOK enabled. Your API keys will be used for AI requests."
          : "BYOK disabled. Platform API keys will be used.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update BYOK settings",
        variant: "destructive",
      });
    }
  };

  // Set preferred provider
  const handleSetProvider = async (provider: BYOKProvider | null) => {
    try {
      const updatedSettings = await BYOKFrontendService.updateSettings({
        provider,
      });
      setByokSettings(updatedSettings);
      toast({
        title: "Success",
        description: provider
          ? `${BYOKFrontendService.getProviderDisplayName(provider)} set as preferred provider.`
          : "No preferred provider set.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update provider",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
          AI Assistant Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize how the AI assistant helps you with your writing
        </p>
        {isSaving && (
          <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400">
            <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full mr-2"></div>
            <span>Saving settings...</span>
          </div>
        )}
        {saveError && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
            Error saving settings: {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded-lg">
            Settings saved successfully!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "settings"
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "analytics"
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("byok")}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === "byok"
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Key className="h-4 w-4 mr-1" />
            API Keys
            {byokSettings?.enabled && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                Active
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === "settings" && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  AI Usage
                </h2>
                <p className="text-muted-foreground text-sm">
                  Track your AI assistant usage
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-foreground">
                  {usage ? (
                    <>
                      {formatNumber(usage.remaining)} /{" "}
                      {formatNumber(usage.limit)}
                    </>
                  ) : (
                    "Loading..."
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  requests remaining
                </div>
              </div>
            </div>

            <div className="mt-4 w-full bg-secondary rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{
                  width: `${usage ? getUsagePercentage() : 0}%`,
                }}
              ></div>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              {getUsageText()}
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* AI Behavior */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">
                AI Behavior
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    AI Mode
                  </label>
                  <select
                    value={settings.aiMode}
                    onChange={(e) => handleChange("aiMode", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    <option value="focus">
                      Focus Mode (Minimal distractions)
                    </option>
                    <option value="assisted">Assisted Mode (Default)</option>
                    <option value="collaborative">
                      Collaborative Mode (Continuous suggestions)
                    </option>
                  </select>
                  <p className="mt-1 text-sm text-black dark:text-black">
                    Choose how actively the AI assists you while writing
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Auto-suggestions
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Show AI suggestions automatically as you write
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleChange("autoSuggestions", !settings.autoSuggestions)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      settings.autoSuggestions ? "bg-purple-600" : "bg-input"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.autoSuggestions
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Suggestion Frequency
                  </label>
                  <select
                    value={settings.suggestionFrequency}
                    onChange={(e) =>
                      handleChange("suggestionFrequency", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    <option value="high">High (Frequent suggestions)</option>
                    <option value="medium">
                      Medium (Balanced suggestions)
                    </option>
                    <option value="low">Low (Infrequent suggestions)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Writing Style Preferences */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">
                Writing Style Preferences
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Formality Level
                  </label>
                  <select
                    value={settings.formalityLevel}
                    onChange={(e) =>
                      handleChange("formalityLevel", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    <option value="casual">Casual</option>
                    <option value="academic">Academic</option>
                    <option value="very-formal">Very Formal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Vocabulary Level
                  </label>
                  <select
                    value={settings.vocabularyLevel}
                    onChange={(e) =>
                      handleChange("vocabularyLevel", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    <option value="simple">Simple</option>
                    <option value="standard">Standard</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sentence Length
                  </label>
                  <select
                    value={settings.sentenceLength}
                    onChange={(e) =>
                      handleChange("sentenceLength", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Voice Preference
                  </label>
                  <select
                    value={settings.voicePreference}
                    onChange={(e) =>
                      handleChange("voicePreference", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    <option value="active">Active Voice</option>
                    <option value="passive">Passive Voice</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Language & Tone */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">
                Language & Tone
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleChange("language", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="en-AU">English (Australia)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Field of Study
                  </label>
                  <select
                    value={settings.fieldOfStudy}
                    onChange={(e) =>
                      handleChange("fieldOfStudy", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    <option value="general">General</option>
                    <option value="sciences">Sciences</option>
                    <option value="humanities">Humanities</option>
                    <option value="social-sciences">Social Sciences</option>
                    <option value="engineering">Engineering</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">
                Privacy Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Use my writing to improve AI
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Allow anonymized usage to help improve the AI
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleChange(
                        "useForImprovement",
                        !settings.useForImprovement,
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      settings.useForImprovement ? "bg-purple-600" : "bg-input"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.useForImprovement
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Store suggestions history
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Keep a history of AI suggestions for reuse
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleChange("storeHistory", !settings.storeHistory)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      settings.storeHistory ? "bg-purple-600" : "bg-input"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.storeHistory
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Anonymous usage data
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Share anonymous usage statistics
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleChange("anonymousData", !settings.anonymousData)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      settings.anonymousData ? "bg-purple-600" : "bg-input"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.anonymousData
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">
                Advanced Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    AI Model
                  </label>
                  <select
                    value={settings.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    {models.map((model: any) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.description})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Temperature (Creativity)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) =>
                      handleChange("temperature", parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Precise</span>
                    <span>{settings.temperature}</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Max Tokens per Request
                  </label>
                  <input
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) =>
                      handleChange("maxTokens", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                    min="100"
                    max="4000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border bg-muted/50 rounded-b-xl">
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
              AI Analytics
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Insights into your AI usage patterns and performance
            </p>
          </div>

          {analytics ? (
            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-foreground">Total Requests</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatNumber(analytics.totalRequests || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-foreground">Success Rate</p>
                      <p className="text-lg font-semibold text-foreground">
                        {analytics.totalRequests > 0
                          ? Math.round(
                              (analytics.successfulRequests /
                                analytics.totalRequests) *
                                100,
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-foreground">Estimated Cost</p>
                      <p className="text-lg font-semibold text-foreground">
                        $
                        {analytics.costEstimate
                          ? analytics.costEstimate.toFixed(4)
                          : "0.0000"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-foreground">Tokens Used</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatNumber(analytics.totalTokensUsed || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Used Actions */}
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium text-foreground mb-3">
                    Most Used Actions
                  </h3>
                  {analytics.mostUsedActions &&
                  Object.keys(analytics.mostUsedActions).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(analytics.mostUsedActions)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([action, count]) => (
                          <div key={action} className="flex justify-between">
                            <span className="text-foreground capitalize">
                              {action.replace(/_/g, " ")}
                            </span>
                            <span className="font-medium text-foreground">
                              {formatNumber(count as number)}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No data available
                    </p>
                  )}
                </div>

                {/* Model Usage */}
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium text-foreground mb-3">
                    Model Usage
                  </h3>
                  {analytics.modelUsage &&
                  Object.keys(analytics.modelUsage).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(analytics.modelUsage)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([model, count]) => (
                          <div key={model} className="flex justify-between">
                            <span className="text-foreground">{model}</span>
                            <span className="font-medium text-foreground">
                              {formatNumber(count as number)}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No data available
                    </p>
                  )}
                </div>

                {/* Favorite Features */}
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium text-foreground mb-3">
                    Favorite Features
                  </h3>
                  {analytics.favoriteFeatures &&
                  Object.keys(analytics.favoriteFeatures).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(analytics.favoriteFeatures)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([feature, count]) => (
                          <div key={feature} className="flex justify-between">
                            <span className="text-foreground capitalize">
                              {feature}
                            </span>
                            <span className="font-medium text-foreground">
                              {formatNumber(count as number)}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No data available
                    </p>
                  )}
                </div>

                {/* Peak Usage Hours */}
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium text-foreground mb-3">
                    Peak Usage Hours
                  </h3>
                  {analytics.peakUsageHours &&
                  Object.keys(analytics.peakUsageHours).length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground">
                          Most Active Hour
                        </span>
                        <span className="font-medium text-foreground">
                          {getPeakUsageHour()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground">
                          Total Active Hours
                        </span>
                        <span className="font-medium text-foreground">
                          {Object.keys(analytics.peakUsageHours).length}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No data available
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Insights */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium text-foreground mb-3">
                  AI Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {getMostUsedAction().replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Most Used Action
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analytics.averageTokensPerRequest
                        ? Math.round(
                            analytics.averageTokensPerRequest,
                          ).toLocaleString()
                        : "0"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Avg. Tokens/Request
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {analytics.totalRequests > 0
                        ? `${Math.round((analytics.successfulRequests / analytics.totalRequests) * 100)}%`
                        : "0%"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Success Rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-foreground">Loading analytics data...</p>
            </div>
          )}
        </div>
      )}

      {/* BYOK (Bring Your Own Key) Tab */}
      {activeTab === "byok" && (
        <div className="space-y-6">
          {/* BYOK Header */}
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Key className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      Bring Your Own Key (BYOK)
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Use your own API keys for AI providers
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {byokSettings?.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    onClick={() => handleToggleBYOK(!byokSettings?.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      byokSettings?.enabled ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        byokSettings?.enabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Info Banner */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Secure Key Storage
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Your API keys are encrypted using AES-256-GCM and stored
                      securely. Keys are only decrypted when making AI requests
                      on your behalf.
                    </p>
                  </div>
                </div>
              </div>

              {/* Provider Selection */}
              {byokSettings?.enabled && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preferred Provider
                  </label>
                  <select
                    value={byokSettings?.provider || ""}
                    onChange={(e) =>
                      handleSetProvider(
                        (e.target.value as BYOKProvider) || null,
                      )
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground"
                  >
                    <option value="">Auto (Use available key)</option>
                    <option value="google">Google AI Studio (Gemini)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="openrouter">OpenRouter (100+ models)</option>
                  </select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select which provider to use when multiple keys are
                    configured
                  </p>
                </div>
              )}

              {/* API Key Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Google AI Studio */}
                {["google", "anthropic", "openai", "openrouter"].map(
                  (provider) => {
                    const providerInfo = BYOKFrontendService.getProviderInfo(
                      provider as BYOKProvider,
                    );
                    const displayName =
                      BYOKFrontendService.getProviderDisplayName(
                        provider as BYOKProvider,
                      );
                    const hasKey = byokSettings?.[
                      `has${provider.charAt(0).toUpperCase() + provider.slice(1)}Key` as keyof BYOKSettings
                    ] as boolean;
                    const maskedKey =
                      byokSettings?.maskedKeys?.[
                        provider as keyof typeof byokSettings.maskedKeys
                      ];
                    const isTesting = byokTesting === provider;
                    const isSaving = byokSaving === provider;

                    return (
                      <div
                        key={provider}
                        className={`border rounded-lg p-4 ${providerInfo.borderColor} ${providerInfo.bgColor}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`font-medium ${providerInfo.color}`}>
                            {displayName}
                          </h3>
                          {hasKey && (
                            <span className="flex items-center text-xs text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Configured
                            </span>
                          )}
                        </div>

                        {hasKey && (
                          <div className="mb-4 p-2 bg-white dark:bg-gray-800 rounded border">
                            <p className="text-sm font-mono text-foreground">
                              {maskedKey || "••••••••••••••••"}
                            </p>
                          </div>
                        )}

                        {/* Key Input */}
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type={
                                byokShowKeys[
                                  provider as keyof typeof byokShowKeys
                                ]
                                  ? "text"
                                  : "password"
                              }
                              value={
                                byokInputKeys[
                                  provider as keyof typeof byokInputKeys
                                ]
                              }
                              onChange={(e) =>
                                setByokInputKeys((prev) => ({
                                  ...prev,
                                  [provider]: e.target.value,
                                }))
                              }
                              placeholder={BYOKFrontendService.getKeyPlaceholder(
                                provider as BYOKProvider,
                              )}
                              className="w-full px-3 py-2 pr-10 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background text-foreground text-sm"
                            />
                            <button
                              onClick={() =>
                                setByokShowKeys((prev) => ({
                                  ...prev,
                                  [provider]:
                                    !prev[provider as keyof typeof prev],
                                }))
                              }
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {byokShowKeys[
                                provider as keyof typeof byokShowKeys
                              ] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            {byokInputKeys[
                              provider as keyof typeof byokInputKeys
                            ] && (
                              <>
                                <button
                                  onClick={() =>
                                    handleTestKey(provider as BYOKProvider)
                                  }
                                  disabled={isTesting}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                                >
                                  {isTesting ? "Testing..." : "Test"}
                                </button>
                                <button
                                  onClick={() =>
                                    handleSaveKey(provider as BYOKProvider)
                                  }
                                  disabled={isSaving}
                                  className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                  {isSaving ? "Saving..." : "Save"}
                                </button>
                              </>
                            )}
                            {hasKey && (
                              <button
                                onClick={() =>
                                  handleDeleteKey(provider as BYOKProvider)
                                }
                                className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Usage Note */}
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Important Note
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      When BYOK is enabled, all AI requests will use your API
                      keys. You are responsible for any costs incurred on your
                      API accounts. This feature is designed for users who
                      prefer to manage their own AI provider billing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISettingsPage;
