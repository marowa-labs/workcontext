"use client";

import React, { useState, useEffect } from "react";
import { Bell, Smartphone, Monitor } from "lucide-react";
import { Button } from "../../../components/ui/button";

import { supabase } from "../../../lib/supabase/client";
import { useToast } from "../../../hooks/use-toast";

// Define proper types for our settings
interface ProjectActivitySettings {
  enabled: boolean;
  comments: boolean;
  mentions: boolean;
  changes: boolean;
  shared: boolean;
}

interface CollaborationSettings {
  enabled: boolean;
  newCollaborator: boolean;
  permissionChanges: boolean;
  commentsResolved: boolean;
  realTime: boolean;
}

interface AiFeaturesSettings {
  enabled: boolean;
  plagiarismComplete: boolean;
  aiLimit: boolean;
  newFeatures: boolean;
  weeklySummary: boolean;
}

interface AccountBillingSettings {
  enabled: boolean;
  paymentSuccess: boolean;
  paymentFailed: boolean;
  subscriptionRenewed: boolean;
  subscriptionExpiring: boolean;
  securityAlerts: boolean;
  subscriptionCreated: boolean;
  subscriptionUpdated: boolean;
  subscriptionCancelled: boolean;
  subscriptionResumed: boolean;
  subscriptionExpired: boolean;
  paymentRefunded: boolean;
  invoiceAvailable: boolean;
}

interface ProductUpdatesSettings {
  enabled: boolean;
  newFeatures: boolean;
  tips: boolean;
  newsletter: boolean;
  specialOffers: boolean;
}

interface QuietHoursSettings {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface PushNotificationsSettings {
  enabled: boolean;
  mentions: boolean;
  comments: boolean;
  directMessages: boolean;
  marketing: boolean;
}

interface InAppNotificationsSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
}

interface WritingProgressSettings {
  enabled: boolean;
  documentDeadline: boolean;
  writingStreak: boolean;
  goalAchieved: boolean;
}

interface ResearchUpdatesSettings {
  enabled: boolean;
  aiSuggestion: boolean;
  citationReminder: boolean;
  researchUpdate: boolean;
}

interface DocumentManagementSettings {
  enabled: boolean;
  backupAvailable: boolean;
  templateUpdate: boolean;
  documentVersion: boolean;
}

interface CollaborationRequestSettings {
  enabled: boolean;
  collaboratorRequest: boolean;
}

interface SMSNotificationsSettings {
  enabled: boolean;
  highPriorityOnly: boolean;
}

interface NotificationSettings {
  projectActivity: ProjectActivitySettings;
  collaboration: CollaborationSettings;
  aiFeatures: AiFeaturesSettings;
  accountBilling: AccountBillingSettings;
  productUpdates: ProductUpdatesSettings;
  writingProgress: WritingProgressSettings;
  researchUpdates: ResearchUpdatesSettings;
  documentManagement: DocumentManagementSettings;
  collaborationRequest: CollaborationRequestSettings;
  smsNotifications: SMSNotificationsSettings;
  frequency: string;
  quietHours: QuietHoursSettings;
  pushNotifications: PushNotificationsSettings;
  inAppNotifications: InAppNotificationsSettings;
}

const NotificationsSettingsPage: React.FC = () => {
  const { toast } = useToast();
  // Mock notification settings
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [settings, setSettings] = useState<NotificationSettings>({
    projectActivity: {
      enabled: true,
      comments: true,
      mentions: true,
      changes: true,
      shared: false,
    },
    collaboration: {
      enabled: true,
      newCollaborator: true,
      permissionChanges: true,
      commentsResolved: true,
      realTime: false,
    },
    aiFeatures: {
      enabled: true,
      plagiarismComplete: true,
      aiLimit: false,
      newFeatures: true,
      weeklySummary: false,
    },
    accountBilling: {
      enabled: true,
      paymentSuccess: true,
      paymentFailed: true,
      subscriptionRenewed: true,
      subscriptionExpiring: true,
      securityAlerts: true,
      subscriptionCreated: true,
      subscriptionUpdated: true,
      subscriptionCancelled: true,
      subscriptionResumed: true,
      subscriptionExpired: true,
      paymentRefunded: true,
      invoiceAvailable: true,
    },
    productUpdates: {
      enabled: true,
      newFeatures: true,
      tips: false,
      newsletter: false,
      specialOffers: false,
    },
    writingProgress: {
      enabled: true,
      documentDeadline: true,
      writingStreak: true,
      goalAchieved: true,
    },
    researchUpdates: {
      enabled: true,
      aiSuggestion: true,
      citationReminder: true,
      researchUpdate: true,
    },
    documentManagement: {
      enabled: true,
      backupAvailable: true,
      templateUpdate: true,
      documentVersion: true,
    },
    collaborationRequest: {
      enabled: true,
      collaboratorRequest: true,
    },
    smsNotifications: {
      enabled: false,
      highPriorityOnly: true,
    },
    frequency: "real-time",
    quietHours: {
      enabled: false,
      startTime: "22:00",
      endTime: "08:00",
    },
    pushNotifications: {
      enabled: true,
      mentions: true,
      comments: true,
      directMessages: true,
      marketing: false,
    },
    inAppNotifications: {
      enabled: true,
      sound: true,
      desktop: true,
    },
  });

  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) throw new Error("Not authenticated");

        const response = await fetch("/api/notifications/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.success && data.settings) {
          // Update local state with fetched settings
          const s = data.settings;
          setSettings({
            projectActivity: {
              enabled: s.project_activity_enabled,
              comments: s.project_activity_comments,
              mentions: s.project_activity_mentions,
              changes: s.project_activity_changes,
              shared: s.project_activity_shared,
            },
            collaboration: {
              enabled: s.collaboration_enabled,
              newCollaborator: s.collaboration_new_collaborator,
              permissionChanges: s.collaboration_permission_changes,
              commentsResolved: s.collaboration_comments_resolved,
              realTime: s.collaboration_real_time,
            },
            aiFeatures: {
              enabled: s.ai_features_enabled,
              plagiarismComplete: s.ai_features_plagiarism_complete,
              aiLimit: s.ai_features_ai_limit,
              newFeatures: s.ai_features_new_features,
              weeklySummary: s.ai_features_weekly_summary,
            },
            accountBilling: {
              enabled: s.account_billing_enabled,
              paymentSuccess: s.account_billing_payment_success,
              paymentFailed: s.account_billing_payment_failed,
              subscriptionRenewed: s.account_billing_subscription_renewed,
              subscriptionExpiring: s.account_billing_subscription_expiring,
              securityAlerts: s.account_billing_security_alerts,
              subscriptionCreated: s.account_billing_subscription_created,
              subscriptionUpdated: s.account_billing_subscription_updated,
              subscriptionCancelled: s.account_billing_subscription_cancelled,
              subscriptionResumed: s.account_billing_subscription_resumed,
              subscriptionExpired: s.account_billing_subscription_expired,
              paymentRefunded: s.account_billing_payment_refunded,
              invoiceAvailable: s.account_billing_invoice_available,
            },
            productUpdates: {
              enabled: s.product_updates_enabled,
              newFeatures: s.product_updates_new_features,
              tips: s.product_updates_tips,
              newsletter: s.product_updates_newsletter,
              specialOffers: s.product_updates_special_offers,
            },
            writingProgress: {
              enabled: s.writing_progress_enabled,
              documentDeadline: s.writing_progress_document_deadline,
              writingStreak: s.writing_progress_writing_streak,
              goalAchieved: s.writing_progress_goal_achieved,
            },
            researchUpdates: {
              enabled: s.research_updates_enabled,
              aiSuggestion: s.research_updates_ai_suggestion,
              citationReminder: s.research_updates_citation_reminder,
              researchUpdate: s.research_updates_research_update,
            },
            documentManagement: {
              enabled: s.document_management_enabled,
              backupAvailable: s.document_management_backup_available,
              templateUpdate: s.document_management_template_update,
              documentVersion: s.document_management_document_version,
            },
            collaborationRequest: {
              enabled: s.collaboration_request_enabled,
              collaboratorRequest: s.collaboration_request_collaborator_request,
            },
            smsNotifications: {
              enabled: s.sms_notifications_enabled,
              highPriorityOnly: s.sms_notifications_high_priority_only,
            },
            frequency: s.frequency,
            quietHours: {
              enabled: s.quiet_hours_enabled,
              startTime: s.quiet_hours_start_time,
              endTime: s.quiet_hours_end_time,
            },
            pushNotifications: {
              enabled: s.push_notifications_enabled,
              mentions: s.push_notifications_mentions,
              comments: s.push_notifications_comments,
              directMessages: s.push_notifications_direct_messages,
              marketing: s.push_notifications_marketing,
            },
            inAppNotifications: {
              enabled: s.in_app_notifications_enabled,
              sound: s.in_app_notifications_sound,
              desktop: s.in_app_notifications_desktop,
            },
          });
        }
      } catch (error: any) {
        setSettingsError(error.message);
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  // Update function to call backend
  const updateSettingsOnBackend = async (backendSettings: any) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendSettings),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const handleToggle = (category: string, field?: string) => {
    setSettings((prev) => {
      // Type assertion to work with the generic object structure
      const prevSettings = prev as Record<string, any>;

      if (field) {
        const categorySettings = prevSettings[category];
        // Type guard to ensure we're working with an object
        if (typeof categorySettings === "object" && categorySettings !== null) {
          const newSettings = {
            ...prev,
            [category]: {
              ...categorySettings,
              [field]: !categorySettings[field],
            },
          };

          // Save to backend
          saveSettingsToBackend(newSettings);

          return newSettings;
        }
        return prev;
      } else {
        const categorySettings = prevSettings[category];
        // Handle toggling the enabled property of a category
        if (
          typeof categorySettings === "object" &&
          categorySettings !== null &&
          "enabled" in categorySettings
        ) {
          const newSettings = {
            ...prev,
            [category]: {
              ...categorySettings,
              enabled: !categorySettings.enabled,
            },
          };

          // Save to backend
          saveSettingsToBackend(newSettings);

          return newSettings;
        }
        return prev;
      }
    });
  };

  // Save settings to backend
  const saveSettingsToBackend = async (newSettings: NotificationSettings) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Convert settings to backend format
      const backendSettings = {
        project_activity_enabled: newSettings.projectActivity.enabled,
        project_activity_comments: newSettings.projectActivity.comments,
        project_activity_mentions: newSettings.projectActivity.mentions,
        project_activity_changes: newSettings.projectActivity.changes,
        project_activity_shared: newSettings.projectActivity.shared,
        collaboration_enabled: newSettings.collaboration.enabled,
        collaboration_new_collaborator:
          newSettings.collaboration.newCollaborator,
        collaboration_permission_changes:
          newSettings.collaboration.permissionChanges,
        collaboration_comments_resolved:
          newSettings.collaboration.commentsResolved,
        collaboration_real_time: newSettings.collaboration.realTime,
        ai_features_enabled: newSettings.aiFeatures.enabled,
        ai_features_plagiarism_complete:
          newSettings.aiFeatures.plagiarismComplete,
        ai_features_ai_limit: newSettings.aiFeatures.aiLimit,
        ai_features_new_features: newSettings.aiFeatures.newFeatures,
        ai_features_weekly_summary: newSettings.aiFeatures.weeklySummary,
        account_billing_enabled: newSettings.accountBilling.enabled,
        account_billing_payment_success:
          newSettings.accountBilling.paymentSuccess,
        account_billing_payment_failed:
          newSettings.accountBilling.paymentFailed,
        account_billing_subscription_renewed:
          newSettings.accountBilling.subscriptionRenewed,
        account_billing_subscription_expiring:
          newSettings.accountBilling.subscriptionExpiring,
        account_billing_security_alerts:
          newSettings.accountBilling.securityAlerts,
        account_billing_subscription_created:
          newSettings.accountBilling.subscriptionCreated,
        account_billing_subscription_updated:
          newSettings.accountBilling.subscriptionUpdated,
        account_billing_subscription_cancelled:
          newSettings.accountBilling.subscriptionCancelled,
        account_billing_subscription_resumed:
          newSettings.accountBilling.subscriptionResumed,
        account_billing_subscription_expired:
          newSettings.accountBilling.subscriptionExpired,
        account_billing_payment_refunded:
          newSettings.accountBilling.paymentRefunded,
        account_billing_invoice_available:
          newSettings.accountBilling.invoiceAvailable,
        product_updates_enabled: newSettings.productUpdates.enabled,
        product_updates_new_features: newSettings.productUpdates.newFeatures,
        product_updates_tips: newSettings.productUpdates.tips,
        product_updates_newsletter: newSettings.productUpdates.newsletter,
        product_updates_special_offers:
          newSettings.productUpdates.specialOffers,
        // New notification settings
        writing_progress_enabled: newSettings.writingProgress.enabled,
        writing_progress_document_deadline:
          newSettings.writingProgress.documentDeadline,
        writing_progress_writing_streak:
          newSettings.writingProgress.writingStreak,
        writing_progress_goal_achieved:
          newSettings.writingProgress.goalAchieved,
        research_updates_enabled: newSettings.researchUpdates.enabled,
        research_updates_ai_suggestion:
          newSettings.researchUpdates.aiSuggestion,
        research_updates_citation_reminder:
          newSettings.researchUpdates.citationReminder,
        research_updates_research_update:
          newSettings.researchUpdates.researchUpdate,
        document_management_enabled: newSettings.documentManagement.enabled,
        document_management_backup_available:
          newSettings.documentManagement.backupAvailable,
        document_management_template_update:
          newSettings.documentManagement.templateUpdate,
        document_management_document_version:
          newSettings.documentManagement.documentVersion,
        collaboration_request_enabled: newSettings.collaborationRequest.enabled,
        collaboration_request_collaborator_request:
          newSettings.collaborationRequest.collaboratorRequest,
        frequency: newSettings.frequency,
        quiet_hours_enabled: newSettings.quietHours.enabled,
        quiet_hours_start_time: newSettings.quietHours.startTime,
        quiet_hours_end_time: newSettings.quietHours.endTime,
        push_notifications_enabled: newSettings.pushNotifications.enabled,
        push_notifications_mentions: newSettings.pushNotifications.mentions,
        push_notifications_comments: newSettings.pushNotifications.comments,
        push_notifications_direct_messages:
          newSettings.pushNotifications.directMessages,
        push_notifications_marketing: newSettings.pushNotifications.marketing,
        in_app_notifications_enabled: newSettings.inAppNotifications.enabled,
        in_app_notifications_sound: newSettings.inAppNotifications.sound,
        in_app_notifications_desktop: newSettings.inAppNotifications.desktop,
        sms_notifications_enabled: newSettings.smsNotifications.enabled,
        sms_notifications_high_priority_only:
          newSettings.smsNotifications.highPriorityOnly,
      };

      const result = await updateSettingsOnBackend(backendSettings);

      if (result.success) {
        toast({
          title: "Settings Saved",
          description:
            "Your notification preferences have been updated successfully.",
        });
      } else {
        throw new Error(result.message || "Failed to save settings");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSaveError(errorMessage);
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error saving notification settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        frequency,
      };

      // Save to backend
      saveSettingsToBackend(newSettings);

      return newSettings;
    });
  };

  const handleQuietHoursChange = (field: string, value: string | boolean) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        quietHours: {
          ...prev.quietHours,
          [field]: value,
        },
      };

      // Save to backend
      saveSettingsToBackend(newSettings);

      return newSettings;
    });
  };

  const handleTestNotification = async () => {
    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to send a test notification",
          variant: "destructive",
        });
        return;
      }

      // Show loading state
      toast({
        title: "Sending Test Notification",
        description: "Please wait while we send your test notification...",
      });

      // Create a test notification
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "test",
          title: "Test Notification",
          message: "This is a test notification from ScholarForge AI",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Test Notification Sent",
          description: "Test notification sent successfully!",
        });
      } else {
        toast({
          title: "Test Notification Failed",
          description: "Failed to send test notification: " + data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast({
        title: "Test Notification Failed",
        description:
          "Failed to send test notification: " +
          (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Notification Preferences
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose how you want to be notified
        </p>
        {(settingsLoading || isSaving) && (
          <div className="mt-4 flex items-center text-primary">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
            <span>
              {settingsLoading ? "Loading settings..." : "Saving settings..."}
            </span>
          </div>
        )}
        {settingsError && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg">
            Error loading settings: {settingsError}
          </div>
        )}
        {saveError && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg">
            Error saving settings: {saveError}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Email Notifications
            </h2>

            {/* Project Activity */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">
                  Project Activity
                </h3>
                <button
                  onClick={() => handleToggle("projectActivity")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.projectActivity.enabled ? "bg-primary" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                      settings.projectActivity.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {settings.projectActivity.enabled && (
                <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.projectActivity.comments}
                      onChange={() =>
                        handleToggle("projectActivity", "comments")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Someone comments on my document
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.projectActivity.mentions}
                      onChange={() =>
                        handleToggle("projectActivity", "mentions")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Someone mentions me (@name)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.projectActivity.changes}
                      onChange={() =>
                        handleToggle("projectActivity", "changes")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      A collaborator makes changes
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.projectActivity.shared}
                      onChange={() => handleToggle("projectActivity", "shared")}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      A document is shared with me
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Collaboration */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Collaboration</h3>
                <button
                  onClick={() => handleToggle("collaboration")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.collaboration.enabled ? "bg-primary" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                      settings.collaboration.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {settings.collaboration.enabled && (
                <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.collaboration.newCollaborator}
                      onChange={() =>
                        handleToggle("collaboration", "newCollaborator")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      New collaborator joins
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.collaboration.permissionChanges}
                      onChange={() =>
                        handleToggle("collaboration", "permissionChanges")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Permission changes
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.collaboration.commentsResolved}
                      onChange={() =>
                        handleToggle("collaboration", "commentsResolved")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Comments resolved
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.collaboration.realTime}
                      onChange={() => handleToggle("collaboration", "realTime")}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Real-time editing notifications
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* AI & Features */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">AI & Features</h3>
                <button
                  onClick={() => handleToggle("aiFeatures")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.aiFeatures.enabled ? "bg-primary" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                      settings.aiFeatures.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {settings.aiFeatures.enabled && (
                <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.aiFeatures.plagiarismComplete}
                      onChange={() =>
                        handleToggle("aiFeatures", "plagiarismComplete")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Plagiarism check complete
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.aiFeatures.aiLimit}
                      onChange={() => handleToggle("aiFeatures", "aiLimit")}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      AI usage approaching limit
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.aiFeatures.newFeatures}
                      onChange={() => handleToggle("aiFeatures", "newFeatures")}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      New AI features available
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.aiFeatures.weeklySummary}
                      onChange={() =>
                        handleToggle("aiFeatures", "weeklySummary")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Weekly AI usage summary
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Account & Billing */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">
                  Account & Billing
                </h3>
                <button
                  onClick={() => handleToggle("accountBilling")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.accountBilling.enabled ? "bg-primary" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                      settings.accountBilling.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {settings.accountBilling.enabled && (
                <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.paymentSuccess}
                      onChange={() =>
                        handleToggle("accountBilling", "paymentSuccess")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Payment successful
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.paymentFailed}
                      onChange={() =>
                        handleToggle("accountBilling", "paymentFailed")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Payment failed
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.subscriptionRenewed}
                      onChange={() =>
                        handleToggle("accountBilling", "subscriptionRenewed")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Subscription renewed
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.subscriptionExpiring}
                      onChange={() =>
                        handleToggle("accountBilling", "subscriptionExpiring")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Subscription expiring soon
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.securityAlerts}
                      onChange={() =>
                        handleToggle("accountBilling", "securityAlerts")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Security alerts
                    </span>
                  </label>
                  {/* Additional billing notification preferences */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.subscriptionCreated}
                      onChange={() =>
                        handleToggle("accountBilling", "subscriptionCreated")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Subscription created
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.subscriptionUpdated}
                      onChange={() =>
                        handleToggle("accountBilling", "subscriptionUpdated")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Subscription updated
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.subscriptionCancelled}
                      onChange={() =>
                        handleToggle("accountBilling", "subscriptionCancelled")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Subscription cancelled
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.subscriptionResumed}
                      onChange={() =>
                        handleToggle("accountBilling", "subscriptionResumed")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Subscription resumed
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.subscriptionExpired}
                      onChange={() =>
                        handleToggle("accountBilling", "subscriptionExpired")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Subscription expired
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.paymentRefunded}
                      onChange={() =>
                        handleToggle("accountBilling", "paymentRefunded")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Payment refunded
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.accountBilling.invoiceAvailable}
                      onChange={() =>
                        handleToggle("accountBilling", "invoiceAvailable")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Invoice available
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Product Updates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Product Updates</h3>
                <button
                  onClick={() => handleToggle("productUpdates")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.productUpdates.enabled ? "bg-primary" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                      settings.productUpdates.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {settings.productUpdates.enabled && (
                <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.productUpdates.newFeatures}
                      onChange={() =>
                        handleToggle("productUpdates", "newFeatures")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      New features announcement
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.productUpdates.tips}
                      onChange={() => handleToggle("productUpdates", "tips")}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Product tips and tricks
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.productUpdates.newsletter}
                      onChange={() =>
                        handleToggle("productUpdates", "newsletter")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Monthly newsletter
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.productUpdates.specialOffers}
                      onChange={() =>
                        handleToggle("productUpdates", "specialOffers")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Special offers and promotions
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Frequency Settings */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Frequency Settings
            </h2>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                <span className="block text-sm font-medium text-foreground mb-2">
                  Digest Options
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => handleFrequencyChange("real-time")}
                  className={`px-4 py-2 text-sm rounded-lg border ${
                    settings.frequency === "real-time"
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}>
                  Real-time
                </button>
                <button
                  onClick={() => handleFrequencyChange("daily")}
                  className={`px-4 py-2 text-sm rounded-lg border ${
                    settings.frequency === "daily"
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}>
                  Daily digest
                </button>
                <button
                  onClick={() => handleFrequencyChange("weekly")}
                  className={`px-4 py-2 text-sm rounded-lg border ${
                    settings.frequency === "weekly"
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}>
                  Weekly digest
                </button>
                <button
                  onClick={() => handleFrequencyChange("never")}
                  className={`px-4 py-2 text-sm rounded-lg border ${
                    settings.frequency === "never"
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}>
                  Never
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  <span className="block text-sm font-medium text-foreground">
                    Quiet Hours
                  </span>
                </label>
                <button
                  onClick={() =>
                    handleQuietHoursChange(
                      "enabled",
                      !settings.quietHours.enabled,
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.quietHours.enabled ? "bg-primary" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                      settings.quietHours.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {settings.quietHours.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm text-foreground mb-1">
                      <span className="block text-sm text-foreground mb-1">
                        Start time
                      </span>
                    </label>
                    <input
                      type="time"
                      value={settings.quietHours.startTime}
                      onChange={(e) =>
                        handleQuietHoursChange("startTime", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground mb-1">
                      <span className="block text-sm text-foreground mb-1">
                        End time
                      </span>
                    </label>
                    <input
                      type="time"
                      value={settings.quietHours.endTime}
                      onChange={(e) =>
                        handleQuietHoursChange("endTime", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Writing Progress */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Writing Progress
          </h2>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">
                Writing Progress Notifications
              </h3>
              <button
                onClick={() => handleToggle("writingProgress")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.writingProgress.enabled ? "bg-primary" : "bg-input"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                    settings.writingProgress.enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {settings.writingProgress.enabled && (
              <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.writingProgress.documentDeadline}
                    onChange={() =>
                      handleToggle("writingProgress", "documentDeadline")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    Document deadline reminders
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.writingProgress.writingStreak}
                    onChange={() =>
                      handleToggle("writingProgress", "writingStreak")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    Writing streak achievements
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.writingProgress.goalAchieved}
                    onChange={() =>
                      handleToggle("writingProgress", "goalAchieved")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    Writing goals achieved
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Research Updates */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Research Updates
          </h2>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">
                Research & AI Updates
              </h3>
              <button
                onClick={() => handleToggle("researchUpdates")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.researchUpdates.enabled ? "bg-primary" : "bg-input"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                    settings.researchUpdates.enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {settings.researchUpdates.enabled && (
              <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.researchUpdates.aiSuggestion}
                    onChange={() =>
                      handleToggle("researchUpdates", "aiSuggestion")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    AI research suggestions
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.researchUpdates.citationReminder}
                    onChange={() =>
                      handleToggle("researchUpdates", "citationReminder")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    Citation reminders
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.researchUpdates.researchUpdate}
                    onChange={() =>
                      handleToggle("researchUpdates", "researchUpdate")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    Research database updates
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Management */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Document Management
          </h2>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">
                Document Management Notifications
              </h3>
              <button
                onClick={() => handleToggle("documentManagement")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.documentManagement.enabled
                    ? "bg-primary"
                    : "bg-input"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                    settings.documentManagement.enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {settings.documentManagement.enabled && (
              <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.documentManagement.backupAvailable}
                    onChange={() =>
                      handleToggle("documentManagement", "backupAvailable")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    Backup available
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.documentManagement.templateUpdate}
                    onChange={() =>
                      handleToggle("documentManagement", "templateUpdate")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    Template updates
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.documentManagement.documentVersion}
                    onChange={() =>
                      handleToggle("documentManagement", "documentVersion")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    Document version changes
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collaboration Requests */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Collaboration Requests
          </h2>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">
                Collaboration Request Notifications
              </h3>
              <button
                onClick={() => handleToggle("collaborationRequest")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.collaborationRequest.enabled
                    ? "bg-primary"
                    : "bg-input"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                    settings.collaborationRequest.enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {settings.collaborationRequest.enabled && (
              <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.collaborationRequest.collaboratorRequest}
                    onChange={() =>
                      handleToggle(
                        "collaborationRequest",
                        "collaboratorRequest",
                      )
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    New collaborator requests
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Push & In-App Notifications */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Push & In-App Notifications
          </h2>

          <div className="space-y-6">
            {/* Push Notifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-foreground mr-2" />
                  <h3 className="font-medium text-foreground">
                    Push Notifications
                  </h3>
                </div>
                <button
                  onClick={() => handleToggle("pushNotifications", "enabled")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.pushNotifications.enabled
                      ? "bg-primary"
                      : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                      settings.pushNotifications.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {settings.pushNotifications.enabled && (
                <div className="ml-2 space-y-2 pl-7 border-l-2 border-border">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications.mentions}
                      onChange={() =>
                        handleToggle("pushNotifications", "mentions")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Mentions
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications.comments}
                      onChange={() =>
                        handleToggle("pushNotifications", "comments")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Comments
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications.directMessages}
                      onChange={() =>
                        handleToggle("pushNotifications", "directMessages")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Direct messages
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications.marketing}
                      onChange={() =>
                        handleToggle("pushNotifications", "marketing")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Marketing
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* In-App Notifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Monitor className="h-5 w-5 text-foreground mr-2" />
                  <h3 className="font-medium text-foreground">
                    In-App Notifications
                  </h3>
                </div>
                <button
                  onClick={() => handleToggle("inAppNotifications", "enabled")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.inAppNotifications.enabled
                      ? "bg-primary"
                      : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                      settings.inAppNotifications.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {settings.inAppNotifications.enabled && (
                <div className="ml-2 space-y-2 pl-7 border-l-2 border-border">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.inAppNotifications.sound}
                      onChange={() =>
                        handleToggle("inAppNotifications", "sound")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Sound effects
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.inAppNotifications.desktop}
                      onChange={() =>
                        handleToggle("inAppNotifications", "desktop")
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Desktop notifications
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            SMS Notifications
          </h2>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">SMS Notifications</h3>
              <button
                onClick={() => handleToggle("smsNotifications")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.smsNotifications.enabled ? "bg-primary" : "bg-input"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                    settings.smsNotifications.enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {settings.smsNotifications.enabled && (
              <div className="ml-2 space-y-2 pl-4 border-l-2 border-border">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications.highPriorityOnly}
                    onChange={() =>
                      handleToggle("smsNotifications", "highPriorityOnly")
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">
                    High priority only
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Test */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">
                Notification Test
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sends sample email/push notification
              </p>
            </div>
            <Button onClick={handleTestNotification} disabled={isSaving}>
              <Bell className="h-4 w-4 mr-2" />
              {isSaving ? "Sending..." : "Send Test Notification"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettingsPage;
