"use client";

import { useState, useEffect, useCallback } from "react";
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

const ITEMS_PER_PAGE = 20;

export default function SecurityLogPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SecurityLogService.getSecurityLog(
        ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE,
        typeFilter || undefined,
      );
      setEvents(data.events);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || "Failed to load security log");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

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

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No security events found.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {events.map((event) => {
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
                {Math.min((page + 1) * ITEMS_PER_PAGE, total)} of {total} events
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
