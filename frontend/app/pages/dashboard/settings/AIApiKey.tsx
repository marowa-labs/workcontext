"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Key,
  Shield,
  Check,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Settings,
  BarChart3,
  Loader2,
  ExternalLink,
  Info,
  RefreshCw,
} from "lucide-react";
import AIService from "../../../lib/utils/aiService";
import BYOKFrontendService, {
  BYOKSettings,
  BYOKProvider,
} from "../../../lib/utils/byokService";
import { getAuthToken } from "../../../lib/utils/auth";
import { useToast } from "../../../hooks/use-toast";

type ActiveTab = "keys" | "models" | "usage";

const AIApiKeyPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("keys");

  // AI Settings state
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
    model: "", // No default — will be set dynamically from user's available models
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
  const [byokEnabled, setByokEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // BYOK State
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
  const [byokConnectionStatus, setByokConnectionStatus] = useState<
    Record<string, "unknown" | "connected" | "error">
  >({
    google: "unknown",
    anthropic: "unknown",
    openai: "unknown",
    openrouter: "unknown",
  });
  const [refreshingModels, setRefreshingModels] = useState<string | null>(null);

  // Derived: does user have ANY api key configured?
  const hasAnyApiKey = byokSettings
    ? byokSettings.hasGoogleKey ||
      byokSettings.hasClaudeKey ||
      byokSettings.hasOpenAIKey ||
      byokSettings.hasOpenRouterKey
    : false;

  // Derived: count of configured providers
  const configuredProviderCount = byokSettings
    ? [
        byokSettings.hasGoogleKey,
        byokSettings.hasClaudeKey,
        byokSettings.hasOpenAIKey,
        byokSettings.hasOpenRouterKey,
      ].filter(Boolean).length
    : 0;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const usageData = await AIService.getAIUsage();
      setUsage({
        remaining: usageData.remaining,
        limit: usageData.limit,
      });

      const modelsData = await AIService.getAvailableModels();
      setModels(modelsData.models || []);
      setByokEnabled(modelsData.byokEnabled || false);

      // Auto-select model: use user's saved preference if valid, otherwise pick first available
      const availableModelIds = (modelsData.models || []).map((m: any) => m.id);
      const currentModelValid =
        modelsData.currentModel &&
        availableModelIds.includes(modelsData.currentModel);
      if (currentModelValid) {
        setSettings((prev) => ({ ...prev, model: modelsData.currentModel }));
      } else if (availableModelIds.length > 0) {
        // Auto-select first available model from user's providers
        setSettings((prev) => ({ ...prev, model: availableModelIds[0] }));
      } else {
        // No models available — clear selection
        setSettings((prev) => ({ ...prev, model: "" }));
      }

      const analyticsData = await AIService.getAIAnalytics();
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

      const preferences = await AIService.getAIPreferences();
      if (preferences) {
        setSettings((prev) => ({
          ...prev,
          ...preferences,
        }));
      }

      try {
        const byokData = await BYOKFrontendService.getSettings();
        setByokSettings(byokData);
      } catch (byokErr) {
        console.error("Failed to fetch BYOK settings:", byokErr);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast({
        title: "Error",
        description: "Failed to load AI settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applySettingChange = async (field: string, value: any) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      if (field === "model") {
        await AIService.updatePreferredModel(value);
      }
      const settingsToUpdate = { ...settings, [field]: value };
      await AIService.updateAIPreferences(settingsToUpdate);

      setSaveSuccess(true);
      toast({
        title: "Settings Updated",
        description: "Your AI preferences have been updated successfully.",
      });
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
    } finally {
      setIsSaving(false);
    }
  };

  // ==================== BYOK Handlers ====================

  const handleTestKey = async (provider: BYOKProvider) => {
    const key = byokInputKeys[provider!];
    if (!key) {
      toast({
        title: "Error",
        description: "Please enter an API key to test",
        variant: "destructive",
      });
      return;
    }
    setByokTesting(provider);
    setByokConnectionStatus((prev) => ({ ...prev, [provider!]: "unknown" }));
    try {
      const result = await BYOKFrontendService.testApiKey(provider, key);
      setByokConnectionStatus((prev) => ({
        ...prev,
        [provider!]: result.success ? "connected" : "error",
      }));
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      setByokConnectionStatus((prev) => ({ ...prev, [provider!]: "error" }));
      toast({
        title: "Error",
        description: error.message || "Failed to test API key",
        variant: "destructive",
      });
    } finally {
      setByokTesting(null);
    }
  };

  const handleSaveKey = async (provider: BYOKProvider) => {
    const key = byokInputKeys[provider!];
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
      toast({ title: "Success", description: result.message });
      const updatedSettings = await BYOKFrontendService.getSettings();
      setByokSettings(updatedSettings);
      setByokInputKeys((prev) => ({ ...prev, [provider!]: "" }));
      setByokConnectionStatus((prev) => ({
        ...prev,
        [provider!]: "connected",
      }));
      // Refresh models list
      const modelsData = await AIService.getAvailableModels();
      setModels(modelsData.models || []);
      setByokEnabled(modelsData.byokEnabled || false);
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

  const handleDeleteKey = async (provider: BYOKProvider) => {
    const displayName = BYOKFrontendService.getProviderDisplayName(provider);
    if (
      !window.confirm(
        `Are you sure you want to delete your ${displayName} API key?`,
      )
    )
      return;
    try {
      const message = await BYOKFrontendService.deleteApiKey(provider);
      toast({ title: "Success", description: message });
      const updatedSettings = await BYOKFrontendService.getSettings();
      setByokSettings(updatedSettings);
      setByokConnectionStatus((prev) => ({ ...prev, [provider!]: "unknown" }));
      const modelsData = await AIService.getAvailableModels();
      setModels(modelsData.models || []);
      setByokEnabled(modelsData.byokEnabled || false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const handleToggleBYOK = async (enabled: boolean) => {
    try {
      const updatedSettings = await BYOKFrontendService.updateSettings({
        enabled,
      });
      setByokSettings(updatedSettings);
      toast({
        title: "Success",
        description: enabled
          ? "Your API keys will now be used for all AI requests."
          : "Platform default keys will be used.",
      });
      const modelsData = await AIService.getAvailableModels();
      setModels(modelsData.models || []);
      setByokEnabled(modelsData.byokEnabled || false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update BYOK settings",
        variant: "destructive",
      });
    }
  };

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
          : "Auto provider selection enabled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update provider",
        variant: "destructive",
      });
    }
  };

  // Refresh models for a provider (re-fetch from provider API)
  const handleRefreshModels = async (provider: string) => {
    setRefreshingModels(provider);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/ai/byok/refresh-models`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ provider }),
        },
      );
      const data = await response.json();
      if (data.success) {
        toast({ title: "Models Refreshed", description: data.message });
        // Refresh the models list
        const modelsData = await AIService.getAvailableModels();
        setModels(modelsData.models || []);
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh models",
        variant: "destructive",
      });
    } finally {
      setRefreshingModels(null);
    }
  };

  const renderConnectionStatus = (provider: string) => {
    const status = byokConnectionStatus[provider];
    const hasKey = byokSettings?.[
      `has${provider.charAt(0).toUpperCase() + provider.slice(1)}Key` as keyof BYOKSettings
    ] as boolean;

    if (hasKey && status === "connected") {
      return (
        <span className="flex items-center text-xs text-green-600 dark:text-green-400">
          <Wifi className="h-3 w-3 mr-1" />
          Connected
        </span>
      );
    }
    if (hasKey && status === "error") {
      return (
        <span className="flex items-center text-xs text-red-600 dark:text-red-400">
          <WifiOff className="h-3 w-3 mr-1" />
          Error
        </span>
      );
    }
    if (hasKey) {
      return (
        <span className="flex items-center text-xs text-amber-600 dark:text-amber-400">
          <Check className="h-3 w-3 mr-1" />
          Configured
        </span>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading AI settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Key className="h-6 w-6 text-purple-500" />
          AI API Keys
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your AI provider API keys. AI features require at least one
          API key to work.
        </p>
      </div>

      {/* No API Key Warning Banner */}
      {!hasAnyApiKey && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                No API Keys Configured
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                AI features are currently disabled. Add an API key below to
                start using AI capabilities. You can configure keys from Google,
                OpenAI, Anthropic, or OpenRouter.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Summary */}
      {hasAnyApiKey && (
        <div className="mb-6 p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {configuredProviderCount} provider
                  {configuredProviderCount !== 1 ? "s" : ""} configured
                </p>
                <p className="text-xs text-muted-foreground">
                  {models.length} model{models.length !== 1 ? "s" : ""}{" "}
                  available
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleRefreshModels("openrouter")}
                disabled={refreshingModels !== null}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                title="Refresh models from providers"
              >
                <RefreshCw
                  className={`h-3 w-3 ${refreshingModels ? "animate-spin" : ""}`}
                />
                Refresh Models
              </button>
              {["google", "anthropic", "openai", "openrouter"].map(
                (provider) => {
                  const hasKey = byokSettings?.[
                    `has${provider.charAt(0).toUpperCase() + provider.slice(1)}Key` as keyof BYOKSettings
                  ] as boolean;
                  if (!hasKey) return null;
                  const status = byokConnectionStatus[provider];
                  return (
                    <span
                      key={provider}
                      className={`px-2 py-1 text-xs rounded-full ${
                        status === "connected"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : status === "error"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {BYOKFrontendService.getProviderDisplayName(
                        provider as BYOKProvider,
                      )}
                    </span>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("keys")}
          className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === "keys"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <Key className="h-4 w-4" />
          API Keys
          {hasAnyApiKey && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
              {configuredProviderCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === "models"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <Settings className="h-4 w-4" />
          Model Selection
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">
            {models.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("usage")}
          className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === "usage"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Usage & Analytics
        </button>
      </div>

      {/* ==================== TAB: API Keys ==================== */}
      {activeTab === "keys" && (
        <div className="space-y-6">
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
                      byokSettings?.enabled
                        ? "bg-purple-600"
                        : "bg-gray-200 dark:bg-gray-700"
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
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(["google", "anthropic", "openai", "openrouter"] as const).map(
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
                        className={`border rounded-lg p-4 transition-colors ${providerInfo.borderColor} ${providerInfo.bgColor} ${hasKey ? "ring-1 ring-green-200 dark:ring-green-800" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`font-medium ${providerInfo.color}`}>
                            {displayName}
                          </h3>
                          {renderConnectionStatus(provider)}
                        </div>

                        {hasKey && (
                          <div className="mb-4 p-2 bg-white dark:bg-gray-800 rounded border">
                            <p className="text-sm font-mono text-foreground">
                              {maskedKey || "••••••••••••••••"}
                            </p>
                          </div>
                        )}

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
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                >
                                  {isTesting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                  ) : (
                                    "Test"
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleSaveKey(provider as BYOKProvider)
                                  }
                                  disabled={isSaving}
                                  className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                  ) : (
                                    "Save"
                                  )}
                                </button>
                              </>
                            )}
                            {hasKey && (
                              <button
                                onClick={() =>
                                  handleDeleteKey(provider as BYOKProvider)
                                }
                                className="px-3 py-2 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Important Note
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      When you configure your own API keys, all AI requests will
                      use your keys. You are responsible for any costs incurred
                      on your API accounts. At least one API key must be
                      configured for AI features to work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: Model Selection ==================== */}
      {activeTab === "models" && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Select AI Model
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Choose which AI model to use. Available models depend on your
              configured API keys.
            </p>

            {!hasAnyApiKey ? (
              <div className="p-8 text-center bg-muted/50 rounded-lg">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  No API Keys Configured
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an API key in the "API Keys" tab to see available models.
                </p>
                <button
                  onClick={() => setActiveTab("keys")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Go to API Keys
                </button>
              </div>
            ) : models.length === 0 ? (
              <div className="p-8 text-center bg-muted/50 rounded-lg">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  No Models Available
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your configured API keys don't have any matching models. Try
                  adding a different provider key.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => applySettingChange("model", model.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      model.isCurrent
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500"
                        : "border-border hover:border-purple-300 dark:hover:border-purple-700 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">
                        {model.name}
                      </h3>
                      {model.isCurrent && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {model.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Max tokens: {model.maxTokens?.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Behavior Settings */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              AI Behavior
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Customize how the AI responds to your requests.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Formality Level
                </label>
                <select
                  value={settings.formalityLevel}
                  onChange={(e) =>
                    applySettingChange("formalityLevel", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="casual">Casual</option>
                  <option value="neutral">Neutral</option>
                  <option value="academic">Academic</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Voice Preference
                </label>
                <select
                  value={settings.voicePreference}
                  onChange={(e) =>
                    applySettingChange("voicePreference", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="active">Active Voice</option>
                  <option value="passive">Passive Voice</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    applySettingChange(
                      "temperature",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: Usage & Analytics ==================== */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Usage Overview
            </h2>

            {hasAnyApiKey ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
                <div className="flex items-center">
                  <Wifi className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>BYOK Active</strong> — You're using your own API
                    keys. Usage is unlimited and billed by your provider.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>No API Keys</strong> — AI features are disabled.
                    Configure an API key to get started.
                  </p>
                </div>
              </div>
            )}

            {usage && !hasAnyApiKey && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {usage.remaining}
                  </p>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {usage.limit}
                  </p>
                  <p className="text-sm text-muted-foreground">Limit</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {usage.limit - usage.remaining}
                  </p>
                  <p className="text-sm text-muted-foreground">Used</p>
                </div>
              </div>
            )}

            {hasAnyApiKey && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {analytics?.totalRequests || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Requests
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {analytics?.totalTokensUsed?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Tokens Used</p>
                </div>
              </div>
            )}
          </div>

          {/* Provider Links */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Get API Keys
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Don't have an API key? Get one from any of these providers:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  name: "Google AI Studio",
                  url: "https://aistudio.google.com/apikey",
                  desc: "Free tier available",
                },
                {
                  name: "OpenRouter",
                  url: "https://openrouter.ai/keys",
                  desc: "Access 100+ models",
                },
                {
                  name: "OpenAI",
                  url: "https://platform.openai.com/api-keys",
                  desc: "GPT-4o, GPT-4o-mini",
                },
                {
                  name: "Anthropic",
                  url: "https://console.anthropic.com/settings/keys",
                  desc: "Claude 3.5 Sonnet, Haiku",
                },
              ].map((provider) => (
                <a
                  key={provider.name}
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {provider.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {provider.desc}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIApiKeyPage;
