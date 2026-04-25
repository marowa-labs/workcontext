"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Download,
  Trash2,
  Clock,
  FileText,
  FileSpreadsheet,
  FileCode,
  Archive,
  HardDrive,
  Loader2,
  ArrowUpCircle,
  CheckCircle,
  XCircle,
  Play,
  Settings,
  History,
} from "lucide-react";
import DataService from "../../../lib/utils/dataService";
import { useRouter } from "next/navigation";
import { useToast } from "../../../hooks/use-toast";
import BackupService, {
  BackupSchedule,
} from "../../../lib/utils/backupService";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  icon: React.ReactNode;
}

interface StorageInfo {
  used: number;
  limit: number;
  breakdown: {
    documents: number;
    exports: number;
    uploads: number;
    citations: number;
  };
}

interface BackupSettings {
  enabled: boolean;
  frequency: string;
  destination: string;
  lastBackup: string | null;
}

interface Backup {
  id: string;
  user_id: string;
  name: string;
  size: number;
  status: string;
  type: string;
  storage_path: string;
  encryption_key: string | null;
  created_at: string;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
}

interface Restore {
  id: string;
  user_id: string;
  backup_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  backup?: {
    name: string;
    created_at: string;
  };
}

const DataSettingsPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");
  const [includeOptions, setIncludeOptions] = useState({
    projects: true,
    citations: true,
    comments: true,
    activityHistory: true,
    deletedItems: false,
  });
  const [showCleanUp, setShowCleanUp] = useState(false);
  const [cleanUpOptions, setCleanUpOptions] = useState({
    oldExports: true,
    oldDrafts: true,
  });

  // Backup states
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restores, setRestores] = useState<Restore[]>([]);
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const exportFormats: ExportFormat[] = [
    {
      id: "json",
      name: "JSON",
      extension: ".json",
      description: "Raw data format",
      icon: <FileCode className="h-5 w-5 text-blue-600" />,
    },
    {
      id: "zip",
      name: "ZIP",
      extension: ".zip",
      description: "Documents + metadata",
      icon: <Archive className="h-5 w-5 text-black" />,
    },
    {
      id: "csv",
      name: "CSV",
      extension: ".csv",
      description: "Citations, projects list",
      icon: <FileSpreadsheet className="h-5 w-5 text-green-600" />,
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storageData, backupData] = await Promise.all([
          DataService.getStorageInfo(),
          DataService.getBackupSettings(),
        ]);

        setStorageInfo(storageData);
        setBackupSettings(backupData);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Fetch backup data
    fetchBackupData();
  }, [toast]);

  const fetchBackupData = async () => {
    try {
      const [backupsData, restoresData, scheduleData, statsData] =
        await Promise.all([
          BackupService.getUserBackups(),
          BackupService.getUserRestores(),
          BackupService.getUserBackupSchedule(),
          BackupService.getBackupStats(),
        ]);

      setBackups(backupsData);
      setRestores(restoresData);
      setSchedule(scheduleData);
      setStats(statsData);
    } catch (error: any) {
      console.error("Error fetching backup data:", error);
      // Don't show toast for backup errors as they might be due to missing endpoints
      // Only log to console for debugging purposes
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await DataService.exportData({
        format: exportFormat,
        include: includeOptions,
      });

      if (result && result.success) {
        toast({
          title: "Success",
          description: result.message || "Export completed successfully!",
        });
      } else {
        toast({
          title: "Partial Success",
          description:
            "Export completed with warnings. Please check your downloads.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Export failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleCleanUp = async () => {
    try {
      const result = await DataService.cleanupStorage(cleanUpOptions);

      if (result && result.success) {
        toast({
          title: "Cleanup Successful",
          description: result.message || "Storage cleaned up successfully!",
        });
      } else {
        toast({
          title: "Cleanup Completed",
          description: result.message || "Storage cleanup completed.",
          variant: "default",
        });
      }

      // Refresh storage info
      const updatedStorageInfo = await DataService.getStorageInfo();
      setStorageInfo(updatedStorageInfo);
      setShowCleanUp(false);
    } catch (error: any) {
      console.error("Clean up failed:", error);
      toast({
        title: "Cleanup Failed",
        description:
          error.message || "Storage cleanup failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackupNow = async () => {
    try {
      setIsCreatingBackup(true);
      // Use BackupService for consistency with other backup operations
      const backup = await BackupService.createBackup(
        "manual",
        backupSettings?.destination || "ScholarForge AI",
      );

      if (!backup) {
        throw new Error("Failed to initiate backup");
      }

      toast({
        title: "Backup Started",
        description:
          "Your backup is being created. This may take a few moments.",
      });

      // Refresh backup data
      fetchBackupData();
    } catch (error: any) {
      console.error("Backup failed:", error);
      toast({
        title: "Backup Failed",
        description: error.message || "Backup failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleBackupSettingsChange = async (
    newSettings: Partial<BackupSettings>,
  ) => {
    try {
      const result = await DataService.updateBackupSettings(newSettings);

      // Update local state
      if (backupSettings) {
        setBackupSettings({
          ...backupSettings,
          ...newSettings,
        });
      }

      if (result && result.success) {
        toast({
          title: "Settings Updated",
          description:
            result.message || "Backup settings updated successfully!",
        });
      } else {
        toast({
          title: "Settings Updated",
          description: "Backup settings updated successfully!",
        });
      }
    } catch (error: any) {
      console.error("Failed to update backup settings:", error);
      toast({
        title: "Update Failed",
        description:
          error.message ||
          "Failed to update backup settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Backup functions
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backup = await BackupService.createBackup(
        "manual",
        schedule?.destination ||
          backupSettings?.destination ||
          "ScholarForge AI",
      );

      if (!backup) {
        throw new Error("Failed to create backup");
      }

      toast({
        title: "Backup Started",
        description:
          "Your backup is being created. This may take a few moments.",
      });

      // Refresh data
      fetchBackupData();
    } catch (error: any) {
      console.error("Backup creation failed:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await BackupService.deleteBackup(backupId);

      toast({
        title: "Backup Deleted",
        description: "Backup has been deleted successfully.",
      });

      // Refresh data
      fetchBackupData();
    } catch (error: any) {
      console.error("Backup deletion failed:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to delete backup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      const restore = await BackupService.restoreFromBackup(backupId);

      if (!restore) {
        throw new Error("Failed to restore backup");
      }

      toast({
        title: "Restore Started",
        description:
          "Your data is being restored. This may take a few moments.",
      });

      // Refresh data
      fetchBackupData();
    } catch (error: any) {
      console.error("Restore failed:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to restore backup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSchedule = async (
    scheduleData: Partial<BackupSchedule>,
  ) => {
    try {
      const updatedSchedule =
        await BackupService.updateBackupSchedule(scheduleData);
      setSchedule(updatedSchedule);

      toast({
        title: "Schedule Updated",
        description: "Your backup schedule has been updated successfully.",
      });

      // Refresh backup settings as well since schedule changes might affect them
      const updatedBackupSettings = await DataService.getBackupSettings();
      setBackupSettings(updatedBackupSettings);
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to update backup schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStoragePercentage = () => {
    if (!storageInfo) return 0;
    if (!storageInfo.limit || storageInfo.limit <= 0) return 0;
    return ((storageInfo.used || 0) / storageInfo.limit) * 100;
  };

  const getStorageColor = () => {
    const percentage = getStoragePercentage();
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleUpgrade = () => {
    router.push("billing/subscription");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500">
            <Clock className="w-3 h-3 mr-1" /> In Progress
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "manual":
        return <Badge variant="secondary">Manual</Badge>;
      case "automatic":
        return <Badge variant="secondary">Automatic</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <Database className="h-6 w-6 text-blue-600 mr-2" />
          Data & Export
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage, export, and backup your data
        </p>
      </div>

      <div className="space-y-6">
        {/* Storage Overview */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Storage Overview
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {(storageInfo?.used || 0).toFixed(1)} GB of{" "}
              {storageInfo?.limit ?? 0} GB used
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {(storageInfo?.used || 0).toFixed(1)} GB /{" "}
                  {storageInfo?.limit ?? 0} GB
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getStoragePercentage().toFixed(1)}% used
                </p>
              </div>
              <button
                onClick={() => setShowCleanUp(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                <Trash2 className="h-4 w-4 mr-1" />
                Clean Up Storage
              </button>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full ${getStorageColor()}`}
                style={{ width: `${getStoragePercentage()}%` }}></div>
            </div>

            {/* Upgrade Button - Shown when storage is near limit */}
            {(getStoragePercentage() > 80 ||
              (storageInfo?.used || 0) >= (storageInfo?.limit || 0)) && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg border border-blue-200 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ArrowUpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-200">
                        Upgrade Your Plan
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        You're approaching your storage limit
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                    Upgrade
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">Documents</p>
                <p className="text-xs text-muted-foreground">
                  {(storageInfo?.breakdown?.documents || 0).toFixed(1)} GB
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Archive className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">Exports</p>
                <p className="text-xs text-muted-foreground">
                  {(storageInfo?.breakdown?.exports || 0).toFixed(1)} GB
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">Uploads</p>
                <p className="text-xs text-muted-foreground">
                  {(storageInfo?.breakdown?.uploads || 0).toFixed(1)} GB
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">Citations</p>
                <p className="text-xs text-muted-foreground">
                  {(storageInfo?.breakdown?.citations || 0).toFixed(1)} GB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Up Storage Modal */}
        {showCleanUp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-md w-full p-6 border border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Clean Up Storage
              </h3>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="oldExports"
                    checked={cleanUpOptions.oldExports}
                    onChange={(e) =>
                      setCleanUpOptions({
                        ...cleanUpOptions,
                        oldExports: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-input rounded"
                  />
                  <label
                    htmlFor="oldExports"
                    className="ml-3 block text-sm text-foreground">
                    Delete old exports
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="oldDrafts"
                    checked={cleanUpOptions.oldDrafts}
                    onChange={(e) =>
                      setCleanUpOptions({
                        ...cleanUpOptions,
                        oldDrafts: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-input rounded"
                  />
                  <label
                    htmlFor="oldDrafts"
                    className="ml-3 block text-sm text-foreground">
                    Delete drafts older than 30 days
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCleanUp(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted">
                  Cancel
                </button>
                <button
                  onClick={handleCleanUp}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                  Free up{" "}
                  {(cleanUpOptions.oldExports ? 0.1 : 0) +
                    (cleanUpOptions.oldDrafts ? 0.2 : 0)}{" "}
                  GB
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Export Options
            </h2>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-medium text-foreground mb-3">
                Export All Data
              </h3>
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">
                    Export Everything
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Download all your projects, citations, and data
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-foreground mb-3">
                Format Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {exportFormats.map((format) => (
                  <div
                    key={format.id}
                    onClick={() => setExportFormat(format.id)}
                    className={`border rounded-lg p-4 cursor-pointer ${
                      exportFormat === format.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-border hover:border-muted-foreground/50 transition-colors"
                    }`}>
                    <div className="flex items-center">
                      {format.icon}
                      <div className="ml-3">
                        <p className="font-medium text-foreground">
                          {format.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format.extension}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-3">
                Include in Export
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="projects"
                      checked={includeOptions.projects}
                      onChange={(e) =>
                        setIncludeOptions({
                          ...includeOptions,
                          projects: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
                    />
                    <label
                      htmlFor="projects"
                      className="ml-3 block text-sm text-black dark:text-black">
                      All projects
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="citations"
                      checked={includeOptions.citations}
                      onChange={(e) =>
                        setIncludeOptions({
                          ...includeOptions,
                          citations: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
                    />
                    <label
                      htmlFor="citations"
                      className="ml-3 block text-sm text-black">
                      All citations
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="comments"
                      checked={includeOptions.comments}
                      onChange={(e) =>
                        setIncludeOptions({
                          ...includeOptions,
                          comments: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
                    />
                    <label
                      htmlFor="comments"
                      className="ml-3 block text-sm text-black">
                      Comments
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="activityHistory"
                      checked={includeOptions.activityHistory}
                      onChange={(e) =>
                        setIncludeOptions({
                          ...includeOptions,
                          activityHistory: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
                    />
                    <label
                      htmlFor="activityHistory"
                      className="ml-3 block text-sm text-black">
                      Activity history
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="deletedItems"
                      checked={includeOptions.deletedItems}
                      onChange={(e) =>
                        setIncludeOptions({
                          ...includeOptions,
                          deletedItems: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
                    />
                    <label
                      htmlFor="deletedItems"
                      className="ml-3 block text-sm text-black">
                      Deleted items (recycle bin)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Automatic Backups */}
        <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black text-black">
              Automatic Backups
            </h2>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-black text-black">
                  Enable automatic backups
                </h3>
                <p className="text-sm text-black dark:text-black">
                  Automatically backup your data
                </p>
              </div>
              <button
                onClick={() =>
                  backupSettings &&
                  handleBackupSettingsChange({
                    enabled: !backupSettings.enabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  backupSettings?.enabled ? "bg-blue-600" : "bg-gray-200"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    backupSettings?.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {backupSettings?.enabled && (
              <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-black mb-1">
                    Backup Frequency
                  </label>
                  <select
                    value={backupSettings.frequency}
                    onChange={(e) =>
                      handleBackupSettingsChange({ frequency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white dark:bg-white text-black text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-black mb-1">
                    Backup Destination
                  </label>
                  <select
                    value={backupSettings.destination}
                    onChange={(e) =>
                      handleBackupSettingsChange({
                        destination: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white dark:bg-white text-black text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="ScholarForge AI">
                      ScholarForge AICloud (included)
                    </option>
                    <option value="google-drive">Google Drive</option>
                    <option value="onedrive">OneDrive</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-black text-black">
                      Last backup
                    </p>
                    <p className="text-sm text-black dark:text-black">
                      {backupSettings.lastBackup
                        ? new Date(backupSettings.lastBackup).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                  <button
                    onClick={handleBackupNow}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
                    <Clock className="h-4 w-4 mr-1" />
                    Backup Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backup & Restore Section */}
        <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black text-black">
                  Backup & Restore
                </h1>
                <p className="text-black dark:text-black mt-2">
                  Manage your data backups and restore points
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="backups">Backups</TabsTrigger>
                <TabsTrigger value="restore">Restore</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-gray-50 dark:bg-white border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-black text-black">
                        Total Backups
                      </CardTitle>
                      <Database className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-black text-black">
                        {stats?.totalBackups || 0}
                      </div>
                      <p className="text-xs text-black dark:text-black">
                        All backup records
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50 dark:bg-white border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-black text-black">
                        Successful Backups
                      </CardTitle>
                      <CheckCircle className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-black text-black">
                        {stats?.completedBackups || 0}
                      </div>
                      <p className="text-xs text-black dark:text-black">
                        Completed backups
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50 dark:bg-white border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-black text-black">
                        Restores
                      </CardTitle>
                      <History className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-black text-black">
                        {stats?.totalRestores || 0}
                      </div>
                      <p className="text-xs text-black dark:text-black">
                        Restore operations
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50 dark:bg-white border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-black text-black">
                        Last Backup
                      </CardTitle>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-black text-black">
                        {stats?.lastBackup
                          ? new Date(stats.lastBackup).toLocaleDateString()
                          : "Never"}
                      </div>
                      <p className="text-xs text-black dark:text-black">
                        Most recent backup
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="bg-gray-50 dark:bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-black text-black">
                        Create Backup
                      </CardTitle>
                      <CardDescription className="text-black dark:text-black">
                        Create a new backup of your data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-black dark:text-black">
                        Creating a backup will save all your projects,
                        citations, settings, and other data to a secure
                        location.
                      </p>
                      <Button
                        className="w-full"
                        onClick={handleCreateBackup}
                        disabled={isCreatingBackup}>
                        {isCreatingBackup ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating Backup...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4 mr-2" />
                            Create Backup
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50 dark:bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-black text-black">
                        Backup Information
                      </CardTitle>
                      <CardDescription className="text-black dark:text-black">
                        Your backup settings and status
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-black text-black">
                          Automatic Backups
                        </span>
                        <Badge
                          variant={
                            schedule?.enabled ? "default" : "destructive"
                          }>
                          {schedule?.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-black text-black">
                          Frequency
                        </span>
                        <span className="text-sm text-black text-black">
                          {schedule?.frequency || "Not set"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-black text-black">
                          Retention
                        </span>
                        <span className="text-sm text-black text-black">
                          {schedule?.retention_count || 0} backups
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setActiveTab("settings")}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="backups" className="space-y-6">
                <Card className="bg-gray-50 dark:bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-black text-black">
                      Your Backups
                    </CardTitle>
                    <CardDescription className="text-black dark:text-black">
                      Manage your backup history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {backups.length === 0 ? (
                      <div className="text-center py-8">
                        <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No backups yet
                        </h3>
                        <p className="text-muted-foreground">
                          You haven't created any backups.
                        </p>
                        <Button
                          className="mt-4"
                          onClick={handleCreateBackup}
                          disabled={isCreatingBackup}>
                          {isCreatingBackup ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-200 mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            "Create Your First Backup"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {backups.map((backup) => (
                          <div
                            key={backup.id}
                            className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium text-black text-black">
                                  {backup.name}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  {getTypeBadge(backup.type)}
                                  <span className="text-sm text-muted-foreground">
                                    {backup.size.toFixed(2)} MB
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(
                                      backup.created_at,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(backup.status)}
                              {backup.status === "completed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRestoreBackup(backup.id)
                                  }>
                                  <Play className="w-4 h-4 mr-1" />
                                  Restore
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteBackup(backup.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="restore" className="space-y-6">
                <Card className="bg-gray-50 dark:bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-black text-black">
                      Restore History
                    </CardTitle>
                    <CardDescription className="text-black dark:text-black">
                      Track your restore operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {restores.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No restores yet
                        </h3>
                        <p className="text-muted-foreground">
                          You haven't performed any restore operations.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {restores.map((restore) => (
                          <div
                            key={restore.id}
                            className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium text-black text-black">
                                  {restore.backup?.name || "Backup"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Started:{" "}
                                  {new Date(
                                    restore.started_at,
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(restore.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="bg-gray-50 dark:bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-black text-black">
                      Backup Settings
                    </CardTitle>
                    <CardDescription className="text-black dark:text-black">
                      Configure your backup preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-black text-black">
                            Automatic Backups
                          </h3>
                          <p className="text-sm text-black dark:text-black">
                            Enable automatic backups of your data
                          </p>
                        </div>
                        <Button
                          variant={schedule?.enabled ? "default" : "outline"}
                          onClick={() =>
                            handleUpdateSchedule({
                              enabled: !schedule?.enabled,
                            })
                          }>
                          {schedule?.enabled ? "Enabled" : "Enable"}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="frequency"
                          className="text-black text-black">
                          Backup Frequency
                        </Label>
                        <Select
                          value={schedule?.frequency || "weekly"}
                          onValueChange={(value) =>
                            handleUpdateSchedule({ frequency: value })
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="retention"
                          className="text-black text-black">
                          Retention Count
                        </Label>
                        <Select
                          value={schedule?.retention_count?.toString() || "7"}
                          onValueChange={(value) =>
                            handleUpdateSchedule({
                              retention_count: parseInt(value),
                            })
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select retention count" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 backups</SelectItem>
                            <SelectItem value="5">5 backups</SelectItem>
                            <SelectItem value="7">7 backups</SelectItem>
                            <SelectItem value="10">10 backups</SelectItem>
                            <SelectItem value="15">15 backups</SelectItem>
                            <SelectItem value="30">30 backups</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Number of backups to keep before deleting old ones
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="destination"
                          className="text-black text-black">
                          Backup Destination
                        </Label>
                        <Select
                          value={schedule?.destination || "ScholarForge AI"}
                          onValueChange={(value) =>
                            handleUpdateSchedule({ destination: value })
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ScholarForge AI">
                              ScholarForge AICloud
                            </SelectItem>
                            <SelectItem value="google-drive">
                              Google Drive
                            </SelectItem>
                            <SelectItem value="onedrive">OneDrive</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Where to store your backups
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-4 text-black text-black">
                        Manual Backup
                      </h3>
                      <p className="text-sm text-black dark:text-black mb-4">
                        Create a backup manually at any time
                      </p>
                      <Button
                        className="w-full"
                        onClick={handleCreateBackup}
                        disabled={isCreatingBackup}>
                        {isCreatingBackup ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-200 mr-2"></div>
                            Creating Backup...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4 mr-2" />
                            Create Manual Backup
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSettingsPage;
