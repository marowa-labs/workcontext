"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Download,
  Trash2,
  Lock,
  Eye,
  FileText,
  ClipboardCheck,
  Brain,
  Search,
  History,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import apiClient from "../../../lib/utils/apiClient";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  created_at: string;
  ip_address: string;
}

const ComplianceSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [settings, setSettings] = useState({
    gdpr_consent_given: false,
    ferpa_consent_given: false,
    hipaa_consent_given: false,
    ai_training_opt_out: false,
    audit_logs_enabled: true,
    marketing_consent_given: false,
    data_sharing_consent: true,
    data_retention_period: 28,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        apiClient.get("/api/privacy/settings"),
        apiClient.get("/api/privacy/audit-logs"),
      ]);

      if (settingsRes.success) {
        setSettings(settingsRes.settings);
      }
      if (logsRes.success) {
        setLogs(logsRes.logs);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: string) => {
    const updatedSettings = {
      ...settings,
      [field]: !settings[field as keyof typeof settings],
    };
    setSettings(updatedSettings);

    try {
      setSaving(true);
      await apiClient.post("/api/privacy/settings", updatedSettings);
      toast({
        title: "Preference Updated",
        description: "Your compliance settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not save your preferences. Please try again.",
        variant: "destructive",
      });
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const handleDataExport = async () => {
    try {
      setExporting(true);
      const res = await apiClient.get("/api/privacy/export");

      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scholarforge_data_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Success",
        description: "Your data has been successfully exported.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "We couldn't prepare your data at this time.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (
      !confirm(
        "Are you absolutely sure? This will initiate the permanent deletion of your account and all associated data within 30 days.",
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      const res = await apiClient.post("/api/privacy/delete-request", {});
      toast({
        title: "Request Received",
        description:
          res.message || "Your account deletion request is being processed.",
      });
    } catch (error) {
      toast({
        title: "Request Failed",
        description:
          "Could not process deletion request. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground flex items-center mb-2">
          <ShieldCheck className="h-8 w-8 text-red-600 mr-3" />
          Compliance & Legal
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your data privacy rights, regulatory consents, and audit logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Regulatory Frameworks */}
          <section className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/50">
              <h2 className="text-xl font-bold text-foreground flex items-center">
                <ClipboardCheck className="h-5 w-5 text-blue-600 mr-2" />
                Regulatory Frameworks
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* GDPR */}
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center mb-1">
                    <span className="font-bold text-foreground">
                      GDPR Compliance (EU)
                    </span>
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Control how your personal data is processed under the
                    General Data Protection Regulation. ScholarForge AI
                    maintains strict adherence to data minimization and user
                    portability.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("gdpr_consent_given")}
                  disabled={saving}
                  className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.gdpr_consent_given ? "bg-red-600" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.gdpr_consent_given
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* FERPA */}
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center mb-1">
                    <span className="font-bold text-foreground">
                      FERPA Protection (Academic)
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enabled protection for student educational records.
                    Safeguards personally identifiable information in accordance
                    with the Family Educational Rights and Privacy Act.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("ferpa_consent_given")}
                  disabled={saving}
                  className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ferpa_consent_given ? "bg-red-600" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.ferpa_consent_given
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* HIPAA */}
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center mb-1">
                    <span className="font-bold text-foreground">
                      HIPAA Safeguards (Health Data)
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable administrative, physical, and technical safeguards
                    for Protected Health Information (PHI). ScholarForge AI
                    provides an encrypted environment suitable for
                    health-related research.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("hipaa_consent_given")}
                  disabled={saving}
                  className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.hipaa_consent_given ? "bg-red-600" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.hipaa_consent_given
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* AI Privacy & Data Ownership */}
          <section className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/50">
              <h2 className="text-xl font-bold text-foreground flex items-center">
                <Brain className="h-5 w-5 text-purple-600 mr-2" />
                AI Privacy & Model Usage
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <span className="font-bold text-foreground">
                    Model Training Opt-Out
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    When enabled, your research data, documents, and
                    interactions will NOT be used to train or improve our
                    proprietary AI models.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("ai_training_opt_out")}
                  disabled={saving}
                  className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ai_training_opt_out ? "bg-red-600" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.ai_training_opt_out
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <span className="font-bold text-foreground">
                    External Model Analytics
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share minimal performance telemetry with model providers
                    (OpenAI, Anthropic) to improve response quality. No PII is
                    ever included in this telemetry.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("data_sharing_consent")}
                  disabled={saving}
                  className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.data_sharing_consent ? "bg-red-600" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.data_sharing_consent
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Audit Logs */}
          <section className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground flex items-center">
                <History className="h-5 w-5 text-emerald-600 mr-2" />
                Security & Compliance Logs
              </h2>
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground mr-2">
                  Audit Logging
                </span>
                <button
                  onClick={() => handleToggle("audit_logs_enabled")}
                  disabled={saving}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.audit_logs_enabled ? "bg-emerald-500" : "bg-input"
                  }`}>
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.audit_logs_enabled
                        ? "translate-x-5"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="p-0">
              {logs.length > 0 ? (
                <div className="divide-y divide-border">
                  {logs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          {log.action.replace(/_/g, " ")}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center mt-0.5">
                          <span className="font-medium mr-2">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                          <span>IP: {log.ip_address || "Internal"}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold rounded">
                        {log.resource}
                      </span>
                    </div>
                  ))}
                  {logs.length > 5 && (
                    <button className="w-full py-3 text-xs font-bold text-red-600 hover:bg-muted/50 transition-colors">
                      VIEW ALL LOGS
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Info className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No recent activity logs available.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Your Rights
            </h3>
            <p className="text-red-100 text-sm mb-6 leading-relaxed">
              Under GDPR, CCPA, and similar regulations, you have the right to
              access, export, or delete your data at any time.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDataExport}
                disabled={exporting}
                className="w-full bg-white text-red-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-70">
                {exporting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-red-700 border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <Download className="h-5 w-5 mr-2" />
                )}
                Download My Data
              </button>

              <button
                onClick={handleDeleteRequest}
                disabled={deleting}
                className="w-full bg-red-900/40 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center border border-red-400/30 hover:bg-red-900/60 transition-colors disabled:opacity-70">
                {deleting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <Trash2 className="h-5 w-5 mr-2" />
                )}
                Delete My Account
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-yellow-500" />
              Legal Documents
            </h3>
            <div className="space-y-1">
              {[
                { label: "Terms of Service", icon: FileText },
                { label: "Privacy Policy", icon: Shield },
                { label: "Cookie Policy", icon: Search },
                { label: "Data Processing Agreement", icon: FileText },
              ].map((doc, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-xl transition-colors group">
                  <div className="flex items-center">
                    <doc.icon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-white" />
                    <span className="text-sm text-gray-300 group-hover:text-white">
                      {doc.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <h4 className="flex items-center text-blue-800 font-bold text-sm mb-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              Need a Custom BAA?
            </h4>
            <p className="text-blue-700 text-xs leading-relaxed mb-4">
              Institutional users may require a signed Business Associate
              Agreement (BAA) for HIPAA compliance.
            </p>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center transition-colors">
              Contact Compliance Team
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceSettings;
