import { prisma } from "../lib/prisma";

interface PrivacySettings {
  profile_visibility: "public" | "collaborators" | "private";
  show_activity: boolean;
  show_location_in_document: boolean;
  search_indexing: boolean;
  share_analytics: boolean;
  share_crash_reports: boolean;
  third_party_cookies: boolean;
  document_privacy: "private" | "unlisted" | "public";
  auto_save: boolean;
  offline_mode: boolean;
  email_unusual_logins: boolean;
  notify_new_devices: boolean;
  gdpr_consent_given: boolean;
  gdpr_consent_date: Date | null;
  ferpa_consent_given: boolean;
  ferpa_consent_date: Date | null;
  hipaa_consent_given: boolean;
  hipaa_consent_date: Date | null;
  ai_training_opt_out: boolean;
  audit_logs_enabled: boolean;
  marketing_consent_given: boolean;
  data_sharing_consent: boolean;
  data_retention_period: number;
}

export class PrivacySettingsService {
  // Get privacy settings for a user
  static async getSettings(userId: string): Promise<PrivacySettings> {
    try {
      let settings = await prisma.userPrivacySettings.findUnique({
        where: { user_id: userId },
      });

      // If no settings exist, create default settings
      if (!settings) {
        settings = await prisma.userPrivacySettings.create({
          data: {
            user_id: userId,
            profile_visibility: "private",
            show_activity: true,
            show_location_in_document: false,
            search_indexing: false,
            share_analytics: true,
            share_crash_reports: true,
            third_party_cookies: false,
            document_privacy: "private",
            auto_save: true,
            offline_mode: false,
            email_unusual_logins: true,
            notify_new_devices: true,
            gdpr_consent_given: false,
            ferpa_consent_given: false,
            hipaa_consent_given: false,
            ai_training_opt_out: false,
            audit_logs_enabled: true,
            marketing_consent_given: false,
            data_sharing_consent: true,
            data_retention_period: 28,
          },
        });
      }

      return {
        profile_visibility: settings.profile_visibility as
          | "public"
          | "collaborators"
          | "private",
        show_activity: settings.show_activity,
        show_location_in_document: settings.show_location_in_document,
        search_indexing: settings.search_indexing,
        share_analytics: settings.share_analytics,
        share_crash_reports: settings.share_crash_reports,
        third_party_cookies: settings.third_party_cookies,
        document_privacy: settings.document_privacy as
          | "private"
          | "unlisted"
          | "public",
        auto_save: settings.auto_save,
        offline_mode: settings.offline_mode,
        email_unusual_logins: settings.email_unusual_logins,
        notify_new_devices: settings.notify_new_devices,
        gdpr_consent_given: settings.gdpr_consent_given,
        gdpr_consent_date: settings.gdpr_consent_date,
        ferpa_consent_given: settings.ferpa_consent_given,
        ferpa_consent_date: settings.ferpa_consent_date,
        hipaa_consent_given: settings.hipaa_consent_given,
        hipaa_consent_date: settings.hipaa_consent_date,
        ai_training_opt_out: settings.ai_training_opt_out,
        audit_logs_enabled: settings.audit_logs_enabled,
        marketing_consent_given: settings.marketing_consent_given,
        data_sharing_consent: settings.data_sharing_consent,
        data_retention_period: settings.data_retention_period,
      };
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      throw new Error("Failed to fetch privacy settings");
    }
  }

  // Update privacy settings for a user
  static async updateSettings(
    userId: string,
    settings: Partial<PrivacySettings>,
  ): Promise<PrivacySettings> {
    try {
      const updatedSettings = await prisma.userPrivacySettings.upsert({
        where: { user_id: userId },
        update: settings,
        create: {
          user_id: userId,
          ...settings,
        },
      });

      return {
        profile_visibility: updatedSettings.profile_visibility as
          | "public"
          | "collaborators"
          | "private",
        show_activity: updatedSettings.show_activity,
        show_location_in_document: updatedSettings.show_location_in_document,
        search_indexing: updatedSettings.search_indexing,
        share_analytics: updatedSettings.share_analytics,
        share_crash_reports: updatedSettings.share_crash_reports,
        third_party_cookies: updatedSettings.third_party_cookies,
        document_privacy: updatedSettings.document_privacy as
          | "private"
          | "unlisted"
          | "public",
        auto_save: updatedSettings.auto_save,
        offline_mode: updatedSettings.offline_mode,
        email_unusual_logins: updatedSettings.email_unusual_logins,
        notify_new_devices: updatedSettings.notify_new_devices,
        gdpr_consent_given: updatedSettings.gdpr_consent_given,
        gdpr_consent_date: updatedSettings.gdpr_consent_date,
        ferpa_consent_given: updatedSettings.ferpa_consent_given,
        ferpa_consent_date: updatedSettings.ferpa_consent_date,
        hipaa_consent_given: updatedSettings.hipaa_consent_given,
        hipaa_consent_date: updatedSettings.hipaa_consent_date,
        ai_training_opt_out: updatedSettings.ai_training_opt_out,
        audit_logs_enabled: updatedSettings.audit_logs_enabled,
        marketing_consent_given: updatedSettings.marketing_consent_given,
        data_sharing_consent: updatedSettings.data_sharing_consent,
        data_retention_period: updatedSettings.data_retention_period,
      };
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      throw new Error("Failed to update privacy settings");
    }
  }
}
