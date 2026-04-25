"use client";

import React, { useState, useEffect } from "react";
import { Lock, MapPin, Shield, Download, Trash2 } from "lucide-react";

import PrivacySettingsService, {
  PrivacySettings,
} from "../../../lib/utils/privacySettingsService";
import { useToast } from "../../../hooks/use-toast";

interface Session {
  id: string;
  user_id: string;
  device_info: string;
  ip_address: string;
  location: string | null;
  last_active: string;
  is_current: boolean;
  created_at: string;
  expires_at: string;
  browser: string;
  device: string;
  lastActive: Date;
  current: boolean;
}

interface LoginHistoryItem {
  id: string;
  user_id: string;
  ip_address: string;
  device_info: string;
  location: string | null;
  status: string;
  error_code: string | null;
  created_at: string;
  date: Date;
  device: string;
  browser: string;
  ip: string;
}

const PrivacySettingsPage: React.FC = () => {
  const { toast } = useToast();
  // Mock privacy settings
  const [mockSettings, setMockSettings] = useState<PrivacySettings>({
    id: "mock-1",
    user_id: "user-1",
    profile_visibility: "public",
    show_activity: true,
    show_location_in_document: true,
    search_indexing: true,
    share_analytics: true,
    share_crash_reports: true,
    third_party_cookies: true,
    document_privacy: "private",
    auto_save: true,
    offline_mode: false,
    email_unusual_logins: true,
    notify_new_devices: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const loading = false;
  const error = null;

  const updateSetting = async (newSettings: Partial<PrivacySettings>) => {
    try {
      setMockSettings((prev) => ({ ...prev, ...newSettings }));
      toast({
        title: "Setting Updated",
        description: "Privacy settings have been updated.",
      });
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, message: error.message };
    }
  };

  const refreshSettings = async () => {
    // Mock refresh function
    console.log("Refreshing privacy settings");
  };

  // Real data for sessions and login history
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(true);
  const [sessionOperationLoading, setSessionOperationLoading] = useState(false);

  // State for tracking when settings are being updated
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Wrapper function for updateSetting with better user feedback
  const updateSettingWithFeedback = async (
    newSettings: Partial<PrivacySettings>,
  ) => {
    setUpdatingSettings(true);
    try {
      await updateSetting(newSettings);

      // If we reach this point, the update was successful
      toast({
        title: "Settings Updated",
        description: "Your privacy settings have been updated successfully.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error updating privacy settings:", error);
      throw error;
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Fetch real session data
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessionsLoading(true);
        const sessionData = await PrivacySettingsService.getUserSessions();

        // Check if sessionData is valid before mapping
        if (Array.isArray(sessionData)) {
          // Transform backend data to match our interface
          const transformedSessions: Session[] = sessionData.map((session) => ({
            ...session,
            device: session.device_info.split(" ")[0] || "Unknown Device",
            browser: session.device_info.split(" ")[1] || "Unknown Browser",
            lastActive: new Date(session.last_active),
            current: session.is_current,
          }));

          setSessions(transformedSessions);
        } else {
          // Set empty array if no data or invalid data
          setSessions([]);
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        // Set empty array on error
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    const fetchLoginHistory = async () => {
      try {
        setLoginHistoryLoading(true);
        const loginData = await PrivacySettingsService.getLoginHistory();

        // Check if loginData is valid before mapping
        if (Array.isArray(loginData)) {
          // Transform backend data to match our interface
          const transformedLoginHistory: LoginHistoryItem[] = loginData.map(
            (login) => ({
              ...login,
              date: new Date(login.created_at),
              device: login.device_info.split(" ")[0] || "Unknown Device",
              browser: login.device_info.split(" ")[1] || "Unknown Browser",
              ip: login.ip_address,
            }),
          );

          setLoginHistory(transformedLoginHistory);
        } else {
          // Set empty array if no data or invalid data
          setLoginHistory([]);
        }
      } catch (err) {
        console.error("Failed to fetch login history:", err);
        // Set empty array on error
        setLoginHistory([]);
      } finally {
        setLoginHistoryLoading(false);
      }
    };

    fetchSessions();
    fetchLoginHistory();
  }, []);

  const handleSignOutSession = async (id: string) => {
    setSessionOperationLoading(true);
    try {
      await PrivacySettingsService.endSession(id);
      setSessions(sessions.filter((session) => session.id !== id));
      toast({
        title: "Session Ended",
        description: "The session has been successfully ended.",
      });
    } catch (err) {
      console.error("Failed to end session:", err);
      toast({
        title: "Session End Failed",
        description: "Failed to end the session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSessionOperationLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    setSessionOperationLoading(true);
    try {
      // End all non-current sessions
      const nonCurrentSessions = sessions.filter((session) => !session.current);
      await Promise.all(
        nonCurrentSessions.map((session) =>
          PrivacySettingsService.endSession(session.id),
        ),
      );
      setSessions(sessions.filter((session) => session.current));
      toast({
        title: "Sessions Ended",
        description: "All other sessions have been successfully ended.",
      });
    } catch (err) {
      console.error("Failed to end all sessions:", err);
      toast({
        title: "Session End Failed",
        description: "Failed to end all sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSessionOperationLoading(false);
    }
  };

  const getStatusBadge = (status: "success" | "failed") => {
    return status === "success" ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
        Success
      </span>
    ) : (
      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
        Failed
      </span>
    );
  };

  if (loading) {
    return (
      <div className="w-full py-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Error: {error}</div>
          <button
            onClick={refreshSettings}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!mockSettings) {
    return (
      <div className="w-full py-6">
        <div className="bg-muted/30 rounded-lg border border-border p-8 text-center">
          <div className="text-muted-foreground">
            No privacy settings available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <Lock className="h-6 w-6 text-red-600 mr-2" />
          Privacy & Security
        </h1>
        <p className="text-muted-foreground mt-1">
          Control your data privacy and security settings
        </p>
        {loading && (
          <div className="mt-4 flex items-center text-red-600 dark:text-red-400">
            <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
            <span>Loading settings...</span>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            Error: {error}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Data Privacy */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              Data Privacy
            </h2>
            {updatingSettings && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-medium text-foreground mb-3">
                Profile Visibility
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="public"
                    name="profileVisibility"
                    checked={mockSettings.profile_visibility === "public"}
                    onChange={() =>
                      updateSettingWithFeedback({
                        profile_visibility: "public",
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="public"
                    className="ml-3 block text-sm text-foreground">
                    <span className="font-medium">Public</span>
                    <p className="text-muted-foreground">
                      Anyone can see your profile
                    </p>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="collaborators"
                    name="profileVisibility"
                    checked={
                      mockSettings.profile_visibility === "collaborators"
                    }
                    onChange={() =>
                      updateSettingWithFeedback({
                        profile_visibility: "collaborators",
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="collaborators"
                    className="ml-3 block text-sm text-foreground">
                    <span className="font-medium">Collaborators</span>
                    <p className="text-muted-foreground">
                      Only people you work with
                    </p>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="private"
                    name="profileVisibility"
                    checked={mockSettings.profile_visibility === "private"}
                    onChange={() =>
                      updateSettingWithFeedback({
                        profile_visibility: "private",
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="private"
                    className="ml-3 block text-sm text-foreground">
                    <span className="font-medium">Private</span>
                    <p className="text-muted-foreground">
                      Only you can see your profile
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-3">
                Activity Visibility
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-foreground">
                      Show when I'm online
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see when you're online
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettingWithFeedback({
                        show_activity: !mockSettings.show_activity,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      mockSettings.show_activity ? "bg-blue-600" : "bg-gray-200"
                    }`}>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        mockSettings.show_activity
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-foreground">
                      Show what I'm working on
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see what section you're working on
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettingWithFeedback({
                        show_location_in_document:
                          !mockSettings.show_location_in_document,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      mockSettings.show_location_in_document
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        mockSettings.show_location_in_document
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-foreground">
                  Search Engine Indexing
                </label>
                <p className="text-sm text-muted-foreground">
                  Allow search engines to index your public profile
                </p>
              </div>
              <button
                onClick={() =>
                  updateSettingWithFeedback({
                    search_indexing: !mockSettings.search_indexing,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  mockSettings.search_indexing ? "bg-blue-600" : "bg-gray-200"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    mockSettings.search_indexing
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Collection */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              Data Collection
            </h2>
            {updatingSettings && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-foreground">
                  Share Anonymous Usage Data
                </label>
                <p className="text-sm text-muted-foreground">
                  Help us improve ScholarForge AIby sharing usage statistics
                </p>
              </div>
              <button
                onClick={() =>
                  updateSettingWithFeedback({
                    share_analytics: !mockSettings.share_analytics,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  mockSettings.share_analytics ? "bg-blue-600" : "bg-gray-200"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    mockSettings.share_analytics
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-foreground">
                  Share Crash Reports
                </label>
                <p className="text-sm text-muted-foreground">
                  Send crash reports to help us fix bugs
                </p>
              </div>
              <button
                onClick={() =>
                  updateSettingWithFeedback({
                    share_crash_reports: !mockSettings.share_crash_reports,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  mockSettings.share_crash_reports
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    mockSettings.share_crash_reports
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-foreground">
                  Third-Party Cookies
                </label>
                <p className="text-sm text-muted-foreground">
                  Allow third-party cookies for analytics and marketing
                </p>
              </div>
              <button
                onClick={() =>
                  updateSettingWithFeedback({
                    third_party_cookies: !mockSettings.third_party_cookies,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  mockSettings.third_party_cookies
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    mockSettings.third_party_cookies
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Document Privacy */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              Document Privacy
            </h2>
            {updatingSettings && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-medium text-foreground mb-3">
                Default Sharing
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="doc-private"
                    name="documentPrivacy"
                    checked={mockSettings.document_privacy === "private"}
                    onChange={() =>
                      updateSettingWithFeedback({ document_privacy: "private" })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="doc-private"
                    className="ml-3 block text-sm text-foreground">
                    <span className="font-medium">Private</span>
                    <p className="text-muted-foreground">
                      Only you can access (default)
                    </p>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="doc-unlisted"
                    name="documentPrivacy"
                    checked={mockSettings.document_privacy === "unlisted"}
                    onChange={() =>
                      updateSettingWithFeedback({
                        document_privacy: "unlisted",
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="doc-unlisted"
                    className="ml-3 block text-sm text-foreground">
                    <span className="font-medium">Unlisted</span>
                    <p className="text-muted-foreground">Anyone with link</p>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="doc-public"
                    name="documentPrivacy"
                    checked={mockSettings.document_privacy === "public"}
                    onChange={() =>
                      updateSettingWithFeedback({ document_privacy: "public" })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="doc-public"
                    className="ml-3 block text-sm text-foreground">
                    <span className="font-medium">Public</span>
                    <p className="text-muted-foreground">
                      Anyone can find and view
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-foreground">
                    Auto-Save to Cloud
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Documents stored securely in the cloud
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateSettingWithFeedback({
                      auto_save: !mockSettings.auto_save,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    mockSettings.auto_save ? "bg-blue-600" : "bg-gray-200"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      mockSettings.auto_save ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-foreground">
                    Enable Offline Mode
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Store documents locally and sync when online
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateSettingWithFeedback({
                      offline_mode: !mockSettings.offline_mode,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    mockSettings.offline_mode ? "bg-blue-600" : "bg-gray-200"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      mockSettings.offline_mode
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              Security Settings
            </h2>
            {updatingSettings && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Session Management */}
            <div>
              <h3 className="font-medium text-foreground mb-3">
                Active Sessions
              </h3>
              {sessionsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-foreground">
                              {session.device} - {session.browser}
                            </span>
                            {session.current && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                This Device
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {session.location}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Last active: {session.lastActive.toLocaleString()}
                          </p>
                        </div>
                        {!session.current && (
                          <button
                            onClick={() => handleSignOutSession(session.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center"
                            disabled={sessionOperationLoading}>
                            {sessionOperationLoading && (
                              <div className="animate-spin h-3 w-3 border border-red-600 border-t-transparent rounded-full mr-1"></div>
                            )}
                            Sign Out
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleSignOutAll}
                      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center"
                      disabled={sessionsLoading || sessionOperationLoading}>
                      {sessionOperationLoading && (
                        <div className="animate-spin h-3 w-3 border border-red-600 border-t-transparent rounded-full mr-1"></div>
                      )}
                      Sign Out All Other Devices
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Login History */}
            <div>
              <h3 className="font-medium text-black mb-3">Login History</h3>
              {loginHistoryLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Date/Time
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Device/Browser
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Location
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          IP Address
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loginHistory.map((login) => (
                        <tr key={login.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {login.date.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {login.device} - {login.browser}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {login.location || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {login.ip}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {getStatusBadge(
                              login.status as "success" | "failed",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Security Alerts */}
            <div>
              <h3 className="font-medium text-black mb-3">Security Alerts</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-black">
                      Email me about unusual login attempts
                    </label>
                    <p className="text-sm text-black">
                      Get notified when we detect suspicious activity
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettingWithFeedback({
                        email_unusual_logins:
                          !mockSettings.email_unusual_logins,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      mockSettings.email_unusual_logins
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        mockSettings.email_unusual_logins
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-black">
                      Notify me of new device logins
                    </label>
                    <p className="text-sm text-black">
                      Get notified when you sign in from a new device
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettingWithFeedback({
                        notify_new_devices: !mockSettings.notify_new_devices,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      mockSettings.notify_new_devices
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        mockSettings.notify_new_devices
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Rights */}
        <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black text-black">
              Data Rights
            </h2>
            {updatingSettings && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Download className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-black">Download Your Data</h3>
                </div>
                <p className="text-sm text-black mt-2">
                  Get a copy of all your documents, citations, and data
                </p>
                <button
                  onClick={() => {
                    toast({
                      title: "Export Started",
                      description:
                        "Your data export has started. You'll receive an email when it's ready.",
                    });
                  }}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Export Data
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-medium text-black">Data Portability</h3>
                </div>
                <p className="text-sm text-black mt-2">
                  Export your data in standard formats for other services
                </p>
                <button
                  onClick={() => {
                    toast({
                      title: "Export Started",
                      description:
                        "Your data export has started. You'll receive an email when it's ready.",
                    });
                  }}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Export Data
                </button>
              </div>

              <div className="border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Trash2 className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="font-medium text-black">Delete Account</h3>
                </div>
                <p className="text-sm text-black mt-2">
                  Permanently delete your account and all associated data
                </p>
                <button
                  onClick={() => {
                    toast({
                      title: "Account Deletion",
                      description:
                        "Account deletion is a permanent action. Please contact support if you wish to proceed.",
                      variant: "destructive",
                    });
                  }}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-700">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsPage;
