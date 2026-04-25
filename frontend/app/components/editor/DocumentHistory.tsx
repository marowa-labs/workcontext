"use client";

import { useState, useEffect } from "react";
import { X, User, FileText, Clock, Plus, Settings } from "lucide-react";
import ProjectService from "../../lib/utils/projectService";
import { useToast } from "../../hooks/use-toast";

interface DocumentVersion {
  id: string;
  version: number;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

interface VersionSchedule {
  id: string;
  frequency: "30min" | "hourly" | "daily" | "weekly" | "monthly";
  next_run: string;
  enabled: boolean;
  created_at: string;
}

interface DocumentHistoryProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (versionId: string) => void;
  onCreateVersion?: () => void;
  editor?: any; // Add editor prop
}

const DocumentHistory = ({
  editor,
  projectId,
  isOpen,
  onClose,
  onRestoreVersion,
  onCreateVersion,
}: DocumentHistoryProps) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<VersionSchedule[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    frequency: "hourly" as "30min" | "hourly" | "daily" | "weekly" | "monthly",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && projectId) {
      loadVersions();
      loadSchedules();
    }
  }, [isOpen, projectId]);

  const loadVersions = async () => {
    // Guard against undefined projectId
    if (!projectId) {
      console.warn("Project ID is undefined, skipping versions load");
      return;
    }

    try {
      setLoading(true);
      const versionsData = await ProjectService.getDocumentVersions(projectId);
      setVersions(versionsData);
    } catch (err) {
      console.error("Error loading versions:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      if (!projectId) {
        console.warn("Project ID is undefined, skipping schedules load");
        setSchedules([]);
        return;
      }

      const schedulesData = await ProjectService.getVersionSchedules(projectId);
      setSchedules(schedulesData || []);
    } catch (err) {
      console.error("Error loading schedules:", err);
      setSchedules([]);
      toast({
        title: "Error",
        description: "Failed to load version schedules",
        variant: "destructive",
      });
    }
  };

  const handleCreateVersion = async () => {
    // Guard against undefined projectId
    if (!projectId) {
      console.warn("Project ID is undefined, cannot create version");
      toast({
        title: "Error",
        description: "Project ID is missing, cannot create version",
        variant: "destructive",
      });
      return;
    }

    if (onCreateVersion) {
      onCreateVersion();
    } else {
      // Fallback to direct version creation if no callback provided
      try {
        // Get the actual editor content
        let content = {};
        let wordCount = 0;

        if (editor) {
          content = editor.getJSON();
          // Try to get word count from editor, fallback to character count if not available
          if (editor.storage && editor.storage.characterCount) {
            wordCount = editor.storage.characterCount.words
              ? editor.storage.characterCount.words()
              : editor.storage.characterCount.characters();
          }
        }

        // Create the version with content and metadata
        await ProjectService.createDocumentVersion(
          projectId,
          content,
          wordCount,
        );

        // Reload versions to show the new one
        await loadVersions();
        console.log("Document version created successfully");

        // Show success notification
        toast({
          title: "Success",
          description: "Document version created successfully",
        });

        if (onClose) {
          onClose();
        }
      } catch (error) {
        console.error("Error creating document version:", error);
        // Show error notification
        toast({
          title: "Error",
          description: "Failed to create document version",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateSchedule = async () => {
    if (!projectId) {
      console.warn("Project ID is undefined, cannot create schedule");
      toast({
        title: "Error",
        description: "Project ID is missing, cannot create schedule",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the schedule using ProjectService
      const scheduleData = {
        frequency: newSchedule.frequency,
      };

      await ProjectService.createVersionSchedule(projectId, scheduleData);

      // Reload schedules to show the new one
      await loadSchedules();

      // Show success notification
      toast({
        title: "Success",
        description: "Version schedule created successfully",
      });

      // Reset form
      setShowScheduleForm(false);
      setNewSchedule({
        frequency: "hourly",
      });
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to create version schedule",
        variant: "destructive",
      });
    }
  };

  const toggleSchedule = async (scheduleId: string, enabled: boolean) => {
    if (!projectId) {
      console.warn("Project ID is undefined, cannot toggle schedule");
      toast({
        title: "Error",
        description: "Project ID is missing, cannot toggle schedule",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the schedule using ProjectService
      const updateData = {
        enabled: !enabled,
      };

      await ProjectService.updateVersionSchedule(
        projectId,
        scheduleId,
        updateData,
      );

      // Reload schedules to reflect the change
      await loadSchedules();

      // Show success notification
      toast({
        title: "Success",
        description: `Schedule ${!enabled ? "enabled" : "disabled"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling schedule:", error);
      toast({
        title: "Error",
        description: `Failed to ${!enabled ? "enable" : "disable"} schedule`,
        variant: "destructive",
      });
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!projectId) {
      console.warn("Project ID is undefined, cannot delete schedule");
      toast({
        title: "Error",
        description: "Project ID is missing, cannot delete schedule",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete the schedule using ProjectService
      await ProjectService.deleteVersionSchedule(projectId, scheduleId);

      // Reload schedules to reflect the change
      await loadSchedules();

      // Show success notification
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Countdown timer component for real-time updates
  const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOverdue: false,
    });

    useEffect(() => {
      if (!targetDate) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOverdue: false,
        });
        return;
      }

      const calculateTimeLeft = () => {
        const difference =
          new Date(targetDate).getTime() - new Date().getTime();

        if (difference < 0) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true };
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, isOverdue: false };
      };

      // Set initial value
      setTimeLeft(calculateTimeLeft());

      // Update every second
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);

      return () => clearInterval(timer);
    }, [targetDate]);

    if (timeLeft.isOverdue) return <span>Overdue</span>;

    if (timeLeft.days > 0) {
      return (
        <span>
          In {timeLeft.days} day{timeLeft.days !== 1 ? "s" : ""}
        </span>
      );
    }

    if (timeLeft.hours > 0) {
      if (timeLeft.minutes > 0) {
        return (
          <span>
            In {timeLeft.hours} hour{timeLeft.hours !== 1 ? "s" : ""}
            {}
            {timeLeft.minutes} minute{timeLeft.minutes !== 1 ? "s" : ""}
          </span>
        );
      }
      return (
        <span>
          In {timeLeft.hours} hour{timeLeft.hours !== 1 ? "s" : ""}
        </span>
      );
    }

    if (timeLeft.minutes > 0) {
      if (timeLeft.seconds > 0) {
        return (
          <span>
            In {timeLeft.minutes} minute{timeLeft.minutes !== 1 ? "s" : ""}
            {}
            {timeLeft.seconds} second{timeLeft.seconds !== 1 ? "s" : ""}
          </span>
        );
      }
      return (
        <span>
          In {timeLeft.minutes} minute{timeLeft.minutes !== 1 ? "s" : ""}
        </span>
      );
    }

    if (timeLeft.seconds > 0) {
      return (
        <span>
          In {timeLeft.seconds} second{timeLeft.seconds !== 1 ? "s" : ""}
        </span>
      );
    }

    return <span>In 0 seconds</span>;
  };

  const handleRestore = (versionId: string) => {
    if (
      window.confirm(
        "Are you sure you want to restore this version? This will replace your current document content.",
      )
    ) {
      onRestoreVersion(versionId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center border border-gray-300">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-transparent bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative rounded-lg bg-white shadow-xl w-full max-w-3xl mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300">
            <h3 className="text-lg font-semibold">
              Document History & Scheduling
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto border-b border-gray-300">
            {/* Create Version Button */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleCreateVersion}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                Create Version
              </button>
            </div>

            {/* Version Schedules Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Scheduled Versions
                </h4>
                <button
                  onClick={() => setShowScheduleForm(!showScheduleForm)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                  <Settings className="h-4 w-4" />
                  {showScheduleForm ? "Cancel" : "Add Schedule"}
                </button>
              </div>

              {showScheduleForm && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <h5 className="font-medium mb-2">Create New Schedule</h5>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-sm text-black mb-1">
                        Frequency
                      </label>
                      <select
                        value={newSchedule.frequency}
                        onChange={(e) =>
                          setNewSchedule({
                            ...newSchedule,
                            frequency: e.target.value as any,
                          })
                        }
                        className="w-full p-2 border rounded text-sm">
                        <option value="30min">Every 30 Minutes</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCreateSchedule}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              )}

              {schedules.length > 0 ? (
                <div className="space-y-2">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium capitalize">
                          {schedule.frequency} schedule
                        </div>
                        <div className="text-sm text-black">
                          Next run:{" "}
                          <CountdownTimer targetDate={schedule.next_run} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={schedule.enabled}
                            onChange={(e) =>
                              toggleSchedule(schedule.id, e.target.checked)
                            }
                            className="rounded"
                          />
                          Enabled
                        </label>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="text-red-600 hover:text-red-800 text-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-black text-sm">
                  No version schedules configured
                </div>
              )}
            </div>

            {/* Document Versions Section */}
            <div>
              <h4 className="font-medium mb-3">Document Versions</h4>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b border-gray-300-2 border-b border-gray-300lue-600"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 text-center py-4">{error}</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-black">
                  <FileText className="h-12 w-12 mx-auto text-black mb-2" />
                  <p>No document versions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">
                              Version {version.version}
                            </span>
                            <span className="text-xs text-black">
                              {formatDate(version.created_at)}
                            </span>
                          </div>
                          {version.user && (
                            <div className="flex items-center space-x-1 text-sm text-black">
                              <User className="h-4 w-4" />
                              <span>
                                {version.user.full_name || version.user.email}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRestore(version.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4">
            <div className="text-sm text-black">
              {versions.length} version{versions.length !== 1 ? "s" : ""}{" "}
              available
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentHistory;
