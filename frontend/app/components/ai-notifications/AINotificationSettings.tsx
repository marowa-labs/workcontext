"use client";

import React, { useState, useEffect } from "react";
import { Toggle } from "../ui/toggle";
import NotificationService from "../../lib/utils/notificationService";

interface AINotificationSettings {
  ai_features_enabled: boolean;
  ai_features_plagiarism_complete: boolean;
  ai_features_ai_limit: boolean;
  ai_features_new_features: boolean;
  ai_features_weekly_summary: boolean;
  research_updates_enabled: boolean;
  research_updates_ai_suggestion: boolean;
  research_updates_citation_reminder: boolean;
  research_updates_research_update: boolean;
}

const AINotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<AINotificationSettings>({
    ai_features_enabled: true,
    ai_features_plagiarism_complete: true,
    ai_features_ai_limit: false,
    ai_features_new_features: true,
    ai_features_weekly_summary: false,
    research_updates_enabled: true,
    research_updates_ai_suggestion: true,
    research_updates_citation_reminder: true,
    research_updates_research_update: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // Fetch actual settings from the backend using NotificationService
        const fetchedSettings = await NotificationService.getSettings();

        // Map the fetched settings to our component state
        setSettings({
          ai_features_enabled: fetchedSettings.ai_features_enabled,
          ai_features_plagiarism_complete:
            fetchedSettings.ai_features_plagiarism_complete,
          ai_features_ai_limit: fetchedSettings.ai_features_ai_limit,
          ai_features_new_features: fetchedSettings.ai_features_new_features,
          ai_features_weekly_summary:
            fetchedSettings.ai_features_weekly_summary,
          research_updates_enabled: fetchedSettings.research_updates_enabled,
          research_updates_ai_suggestion:
            fetchedSettings.research_updates_ai_suggestion,
          research_updates_citation_reminder:
            fetchedSettings.research_updates_citation_reminder,
          research_updates_research_update:
            fetchedSettings.research_updates_research_update,
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch notification settings:", err);
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = (field: keyof AINotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Save the settings to the backend using NotificationService
      await NotificationService.updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save notification settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-white border-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black text-black">
            AI Notification Settings
          </h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>

        {success && (
          <div className="mb-6 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
            Notification settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* AI Features */}
          <div>
            <h3 className="text-lg font-medium text-black text-black mb-4">
              AI Features
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black text-black">
                    Enable AI Feature Notifications
                  </p>
                  <p className="text-sm text-black dark:text-black">
                    Receive notifications about AI features and updates
                  </p>
                </div>
                <Toggle
                  pressed={settings.ai_features_enabled}
                  onPressedChange={() => handleToggle("ai_features_enabled")}
                  aria-label="Toggle AI features notifications"
                />
              </div>

              {settings.ai_features_enabled && (
                <>
                  <div className="flex items-center justify-between pl-6">
                    <div>
                      <p className="font-medium text-black text-black">
                        Plagiarism Check Complete
                      </p>
                      <p className="text-sm text-black dark:text-black">
                        Get notified when plagiarism checks are complete
                      </p>
                    </div>
                    <Toggle
                      pressed={settings.ai_features_plagiarism_complete}
                      onPressedChange={() =>
                        handleToggle("ai_features_plagiarism_complete")
                      }
                      aria-label="Toggle plagiarism check notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between pl-6">
                    <div>
                      <p className="font-medium text-black text-black">
                        AI Usage Limits
                      </p>
                      <p className="text-sm text-black dark:text-black">
                        Get alerts when approaching AI usage limits
                      </p>
                    </div>
                    <Toggle
                      pressed={settings.ai_features_ai_limit}
                      onPressedChange={() =>
                        handleToggle("ai_features_ai_limit")
                      }
                      aria-label="Toggle AI limit notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between pl-6">
                    <div>
                      <p className="font-medium text-black text-black">
                        New AI Features
                      </p>
                      <p className="text-sm text-black dark:text-black">
                        Get notified about new AI features and improvements
                      </p>
                    </div>
                    <Toggle
                      pressed={settings.ai_features_new_features}
                      onPressedChange={() =>
                        handleToggle("ai_features_new_features")
                      }
                      aria-label="Toggle new features notifications"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Research Updates */}
          <div>
            <h3 className="text-lg font-medium text-black text-black mb-4">
              Research Updates
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black text-black">
                    Enable Research Updates
                  </p>
                  <p className="text-sm text-black dark:text-black">
                    Receive notifications about research-related AI suggestions
                  </p>
                </div>
                <Toggle
                  pressed={settings.research_updates_enabled}
                  onPressedChange={() =>
                    handleToggle("research_updates_enabled")
                  }
                  aria-label="Toggle research updates notifications"
                />
              </div>

              {settings.research_updates_enabled && (
                <>
                  <div className="flex items-center justify-between pl-6">
                    <div>
                      <p className="font-medium text-black text-black">
                        AI Suggestions
                      </p>
                      <p className="text-sm text-black dark:text-black">
                        Get notified when AI has new suggestions for your
                        research
                      </p>
                    </div>
                    <Toggle
                      pressed={settings.research_updates_ai_suggestion}
                      onPressedChange={() =>
                        handleToggle("research_updates_ai_suggestion")
                      }
                      aria-label="Toggle AI suggestion notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between pl-6">
                    <div>
                      <p className="font-medium text-black text-black">
                        Citation Reminders
                      </p>
                      <p className="text-sm text-black dark:text-black">
                        Get reminders to update or check citations
                      </p>
                    </div>
                    <Toggle
                      pressed={settings.research_updates_citation_reminder}
                      onPressedChange={() =>
                        handleToggle("research_updates_citation_reminder")
                      }
                      aria-label="Toggle citation reminder notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between pl-6">
                    <div>
                      <p className="font-medium text-black text-black">
                        Research Updates
                      </p>
                      <p className="text-sm text-black dark:text-black">
                        Get notified about research methodology or findings
                        updates
                      </p>
                    </div>
                    <Toggle
                      pressed={settings.research_updates_research_update}
                      onPressedChange={() =>
                        handleToggle("research_updates_research_update")
                      }
                      aria-label="Toggle research update notifications"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AINotificationSettings;
