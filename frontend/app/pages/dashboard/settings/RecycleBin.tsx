"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  ArchiveRestore,
  FileText,
  BookOpen,
  Globe,
  Key,
  Search,
  HardDrive,
} from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { apiClient } from "../../../lib/utils/apiClient";

interface RecycledItem {
  id: string;
  item_type: string;
  item_data: {
    name?: string;
    title?: string;
    [key: string]: unknown;
  };
  deleted_at: string;
  expires_at: string;
  restored_at: string | null;
}

const RecycleBinPage: React.FC = () => {
  const [items, setItems] = useState<RecycledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [retentionPeriod, setRetentionPeriod] = useState(28); // Default 28 days
  const { toast } = useToast();

  const fetchRecycledItems = useCallback(async () => {
    try {
      const data = await apiClient.get("/api/recyclebin");
      setItems(data.items);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch recycled items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchRecycleBinSettings = useCallback(async () => {
    try {
      const data = await apiClient.get("/api/recyclebin/settings");
      setRetentionPeriod(data.retentionPeriod);
    } catch {
      console.log("Failed to fetch recycle bin settings");
      toast({
        title: "Error",
        description: "Failed to fetch recycle bin settings",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchRecycledItems();
    fetchRecycleBinSettings();
  }, [fetchRecycledItems, fetchRecycleBinSettings]);

  const updateRecycleBinSettings = async (newRetentionPeriod: number) => {
    try {
      await apiClient.put("/api/recyclebin/settings", {
        retentionPeriod: newRetentionPeriod,
      });
      setRetentionPeriod(newRetentionPeriod);
      toast({
        title: "Success",
        description: "Retention period updated successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update retention period",
        variant: "destructive",
      });
    }
  };

  const restoreItem = async (recycledItemId: string) => {
    try {
      await apiClient.put("/api/recyclebin/restore", { recycledItemId });
      toast({
        title: "Success",
        description: "Item restored successfully",
      });
      fetchRecycledItems(); // Refresh the list
    } catch {
      toast({
        title: "Error",
        description: "Failed to restore item",
        variant: "destructive",
      });
    }
  };

  const permanentlyDeleteItem = async (recycledItemId: string) => {
    try {
      await apiClient.delete(`/api/recyclebin?id=${recycledItemId}`, {});
      toast({
        title: "Success",
        description: "Item permanently deleted",
      });
      fetchRecycledItems(); // Refresh the list
    } catch {
      toast({
        title: "Error",
        description: "Failed to permanently delete item",
        variant: "destructive",
      });
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await apiClient.delete("/api/recyclebin/empty", {});

      toast({
        title: "Success",
        description: "Trash emptied successfully",
      });
      fetchRecycledItems(); // Refresh the list
    } catch {
      toast({
        title: "Error",
        description: "Failed to empty trash",
        variant: "destructive",
      });
    }
  };

  const handleRetentionPeriodChange = (newRetentionPeriod: number) => {
    updateRecycleBinSettings(newRetentionPeriod);
  };

  const getIconForItemType = (itemType: string) => {
    switch (itemType) {
      case "project":
        return <FileText className="w-5 h-5" />;
      case "template":
        return <BookOpen className="w-5 h-5" />;
      case "citation":
        return <Globe className="w-5 h-5" />;
      case "api_key":
        return <Key className="w-5 h-5" />;
      default:
        return <ArchiveRestore className="w-5 h-5" />;
    }
  };

  const getLabelForItemType = (itemType: string) => {
    switch (itemType) {
      case "project":
        return "Project";
      case "template":
        return "Template";
      case "citation":
        return "Citation";
      case "api_key":
        return "API Key";
      default:
        return "Item";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.item_data?.name &&
        typeof item.item_data.name === "string" &&
        item.item_data.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.item_data?.title &&
        typeof item.item_data.title === "string" &&
        item.item_data.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || item.item_type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Recycle Bin
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage your deleted items. Items are automatically deleted after
                {retentionPeriod} days.
              </p>
            </div>
            <button
              onClick={handleEmptyTrash}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/30 rounded-lg transition-colors">
              <Trash2 className="h-4 w-4 mr-1" />
              Empty Trash
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search deleted items..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="project">Projects</option>
              <option value="template">Templates</option>
              <option value="citation">Citations</option>
              <option value="api_key">API Keys</option>
            </select>
          </div>

          {/* Retention Settings */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HardDrive className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Retention Period
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Deleted items are kept for {retentionPeriod} days before
                    being permanently removed
                  </p>
                </div>
              </div>
            </div>
            <select
              value={retentionPeriod}
              onChange={(e) =>
                handleRetentionPeriodChange(Number(e.target.value))
              }
              className="px-3 py-1 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={28}>28 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              No items in recycle bin
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Items you delete will appear here for {retentionPeriod} days
              before being permanently removed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {getIconForItemType(item.item_type)}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-foreground">
                      {typeof item.item_data?.name === "string"
                        ? item.item_data.name
                        : typeof item.item_data?.title === "string"
                          ? item.item_data.title
                          : "Unnamed Item"}
                    </h3>
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <span>{getLabelForItemType(item.item_type)}</span>
                      <span className="mx-2">•</span>
                      <span>Deleted {formatDate(item.deleted_at)}</span>
                      <span className="mx-2">•</span>
                      <span>Expires {formatDate(item.expires_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => restoreItem(item.id)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors">
                    Restore
                  </button>
                  <button
                    onClick={() => permanentlyDeleteItem(item.id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleBinPage;
