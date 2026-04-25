"use client";

import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { ScrollArea } from "../../ui/scroll-area";
import SearchAlertService, {
  SearchAlert,
} from "../../../lib/utils/searchAlertService";
import {
  Bell,
  BellRing,
  Plus,
  Search,
  Trash2,
  Play,
  Pause,
  Calendar,
  Clock,
  X,
  Loader2,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";

interface SearchAlertsPanelProps {
  projectId?: string;
}

export function SearchAlertsPanel({ projectId }: SearchAlertsPanelProps) {
  const [view, setView] = useState<"list" | "create" | "matches">("list");
  // const [selectedAlert, setSelectedAlert] = useState<SearchAlert | null>(null); // Unused for now
  const [newQuery, setNewQuery] = useState("");
  const [newFrequency, setNewFrequency] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");

  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // Results for the "matches" view
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [activeMatchQuery, setActiveMatchQuery] = useState("");

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await SearchAlertService.getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error("Failed to load alerts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!newQuery.trim()) return;
    try {
      setLoading(true);
      await SearchAlertService.createAlert(newQuery, newFrequency);
      await loadAlerts();
      setNewQuery("");
      setView("list");
    } catch (error) {
      console.error("Failed to create alert", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      // Optimistic update
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      await SearchAlertService.deleteAlert(id);
    } catch (error) {
      console.error("Failed to delete alert", error);
      loadAlerts(); // Revert on error
    }
  };

  const handleToggleActive = async (alert: SearchAlert) => {
    try {
      // Optimistic update
      const newStatus = !alert.is_active;
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id ? { ...a, is_active: newStatus } : a,
        ),
      );
      await SearchAlertService.updateAlert(alert.id, { is_active: newStatus });
    } catch (error) {
      console.error("Failed to update alert", error);
      loadAlerts();
    }
  };

  const handleCheckAlert = async (alert: SearchAlert) => {
    try {
      setCheckingId(alert.id);
      const { alert: updatedAlert, results } =
        await SearchAlertService.checkAlert(alert.id);

      // Update the list with new data
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? updatedAlert : a)),
      );

      // Show results
      setMatchResults(results || []);
      setActiveMatchQuery(alert.query);
      setView("matches");
    } catch (error) {
      console.error("Failed to check alert", error);
    } finally {
      setCheckingId(null);
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return <Clock className="h-3 w-3" />;
      case "weekly":
        return <Calendar className="h-3 w-3" />;
      case "monthly":
        return <Calendar className="h-3 w-3" />;
      default:
        return <Bell className="h-3 w-3" />;
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "bg-blue-100 text-blue-700";
      case "weekly":
        return "bg-green-100 text-green-700";
      case "monthly":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading && alerts.length === 0 && view === "list") {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  // Empty state
  if (view === "list" && alerts.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Search Alerts</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-blue-600" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            No alerts yet
          </h4>
          <p className="text-xs text-gray-500 mb-6 max-w-xs">
            Stay updated on research matching your interests. Create alerts for
            specific topics.
          </p>
          <Button
            onClick={() => setView("create")}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Alert
          </Button>
        </div>
      </div>
    );
  }

  // Create alert view
  if (view === "create") {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Create Search Alert
            </h3>
            <button
              onClick={() => setView("list")}
              className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Get notified when new papers match your query
          </p>
        </div>
        <div className="flex-1 p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="e.g., AI ethics research"
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                className="pl-9 bg-white border-gray-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Alert Frequency
            </label>
            <div className="space-y-2">
              {(["daily", "weekly", "monthly"] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setNewFrequency(freq)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    newFrequency === freq
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      newFrequency === freq
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}>
                    {newFrequency === freq && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {freq}
                    </div>
                    <div className="text-xs text-gray-500">
                      {freq === "daily" && "Check for new papers every day"}
                      {freq === "weekly" && "Check for new papers every week"}
                      {freq === "monthly" && "Check for new papers every month"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <Button
            variant="outline"
            onClick={() => setView("list")}
            className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreateAlert}
            disabled={!newQuery.trim() || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Alert"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Matches view (Results)
  if (view === "matches") {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("list")}
              className="-ml-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-semibold text-gray-900">
              Latest Matches
            </h3>
          </div>
          <p className="text-xs text-gray-500 line-clamp-1">
            Found {matchResults.length} matches for "{activeMatchQuery}"
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {matchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent papers found matching this query.
              </div>
            ) : (
              matchResults.map((paper, idx) => (
                <div
                  key={paper.paperId || idx}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                    {paper.title}
                  </h4>
                  <div className="text-xs text-gray-500 mb-2">
                    {paper.year && <span className="mr-2">{paper.year}</span>}
                    {paper.venue && (
                      <span className="mr-2 italic">{paper.venue}</span>
                    )}
                    {paper.authors && paper.authors.length > 0 && (
                      <span className="truncate block mt-1">
                        {paper.authors
                          .map((a: any) => a.name)
                          .slice(0, 3)
                          .join(", ")}
                        {paper.authors.length > 3 && " et al."}
                      </span>
                    )}
                  </div>
                  {paper.abstract && (
                    <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                      {paper.abstract}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center text-blue-600 hover:underline">
                        View Paper <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                    {paper.openAccessPdf && (
                      <a
                        href={paper.openAccessPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center text-green-600 hover:underline">
                        PDF <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // List view (Default)
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Search Alerts</h3>
          <Button
            size="sm"
            onClick={() => setView("create")}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Alert
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"} •{" "}
          {alerts.reduce((sum, a) => sum + (a.new_matches_count || 0), 0)} new
          matches
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                alert.is_active
                  ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                  : "border-gray-100 bg-gray-50/50 opacity-60"
              }`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.new_matches_count > 0 ? (
                    <BellRing className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bell className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                      "{alert.query}"
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getFrequencyColor(alert.frequency)}`}>
                      {getFrequencyIcon(alert.frequency)}
                      {alert.frequency}
                    </span>
                    {alert.new_matches_count > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                        {alert.new_matches_count} new
                      </span>
                    )}
                    {!alert.is_active && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-600">
                        Paused
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-gray-400 mb-3">
                    Last checked:{" "}
                    {alert.last_checked
                      ? new Date(alert.last_checked).toLocaleDateString()
                      : "Never"}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCheckAlert(alert)}
                      disabled={checkingId === alert.id}
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      {checkingId === alert.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Search className="h-3 w-3 mr-1" />
                      )}
                      Check Now
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleActive(alert)}
                      className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700">
                      {alert.is_active ? (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </>
                      )}
                    </Button>
                    <div className="flex-1" /> {/* Spacer */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
