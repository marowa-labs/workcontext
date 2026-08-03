"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  LogIn,
  LogOut,
  KeyRound,
  Mail,
  Download,
  Trash2,
  XCircle,
  AlertTriangle,
  MapPin,
  Monitor,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import SecurityLogService, {
  type SecurityEvent,
} from "../../../lib/utils/securityLogService";

const TYPE_LABELS: Record<SecurityEvent["type"], { label: string; icon: any; color: string }> = {
  LOGIN_SUCCESS: { label: "Successful Login", icon: LogIn, color: "text-green-600" },
  LOGIN_FAILED: { label: "Failed Login", icon: LogOut, color: "text-red-600" },
  PASSWORD_CHANGED: { label: "Password Changed", icon: KeyRound, color: "text-orange-600" },
  EMAIL_CHANGED: { label: "Email Changed", icon: Mail, color: "text-blue-600" },
  DATA_EXPORT: { label: "Data Export", icon: Download, color: "text-purple-600" },
  ACCOUNT_DELETION_REQUEST: { label: "Account Deletion Requested", icon: AlertTriangle, color: "text-red-700" },
  SESSION_ENDED: { label: "Session Ended", icon: XCircle, color: "text-gray-600" },
};

const TYPE_FILTERS = [
  { label: "All Events", value: "" },
  { label: "Successful Logins", value: "success" },
  { label: "Failed Logins", value: "failed" },
  { label: "Password Changes", value: "password_changed" },
  { label: "Email Changes", value: "email_changed" },
  { label: "Data Exports", value: "data_export" },
];

const TIME_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
];

function getTimeFilterDates(value: string): { from?: string; to?: string } {
  const now = new Date();
  if (value === "all") return {};
  const to = now.toISOString();
  let from: Date;
  switch (value) {
    case "24h":
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      return {};
  }
  return { from: from.toISOString(), to };
}

const ITEMS_PER_PAGE = 20;

export default function SecurityLogPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { from, to } = getTimeFilterDates(timeFilter);
      const data = await SecurityLogService.getSecurityLog(
        200,
        0,
        typeFilter || undefined,
        from,
        to,
      );
      setEvents(data.events);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || "Failed to load security log");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, timeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Client-side search filtering
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.ip_address?.toLowerCase().includes(q) ||
        event.device_info?.toLowerCase().includes(q) ||
        event.location?.toLowerCase().includes(q) ||
        event.details?.toLowerCase().includes(q) ||
        TYPE_LABELS[event.type]?.label.toLowerCase().includes(q),
    );
  }, [events, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-foreground">
            Security Log
          </h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        View all security-related activity on your account, including logins,
        password changes, and data exports.
      </p>

      {/* Search and Time Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by IP, device, location, or event type..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-10 py-2 text-sm rounded-lg bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(0);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Time Filter Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={timeFilter}
            onChange={(e) => {
              setTimeFilter(e.target.value);
              setPage(0);
            }}
            className="pl-10 pr-8 py-2 text-sm rounded-lg bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer min-w-[160px]"
          >
            {TIME_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none rotate-90" />
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setTypeFilter(f.value);
              setPage(0);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              typeFilter === f.value
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {(searchQuery || timeFilter !== "all") && (
        <p className="text-xs text-muted-foreground">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
          {searchQuery && ` matching "${searchQuery}"`}
          {timeFilter !== "all" && ` in ${TIME_FILTERS.find((f) => f.value === timeFilter)?.label}`}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600">{error}</div>
      ) : paginatedEvents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>
            {searchQuery
              ? `No events matching "${searchQuery}"`
              : "No security events found."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedEvents.map((event) => {
              const typeInfo = TYPE_LABELS[event.type];
              if (!typeInfo) return null;
              const Icon = typeInfo.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className={`mt-0.5 ${typeInfo.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">
                        {typeInfo.label}
                      </span>
                      {event.details && (
                        <span className="text-xs text-muted-foreground">
                          — {event.details}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(event.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3.5 w-3.5" />
                        {event.device_info}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location || "Unknown"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      IP: {event.ip_address}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {page * ITEMS_PER_PAGE + 1}–
                {Math.min((page + 1) * ITEMS_PER_PAGE, filteredEvents.length)} of {filteredEvents.length} events
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
