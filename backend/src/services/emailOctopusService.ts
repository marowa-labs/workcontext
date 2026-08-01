import { createHash } from "crypto";
import { SecretsService } from "./secrets-service";
import logger from "../monitoring/logger";

const EMAIL_OCTOPUS_API_BASE = "https://emailoctopus.com/api/1.6";

export interface EmailOctopusContact {
  emailAddress: string;
  firstName: string;
  lastName: string;
  tags?: string[];
  status?: "SUBSCRIBED" | "UNSUBSCRIBED" | "PENDING";
}

export class EmailOctopusService {
  // Load EmailOctopus credentials; returns null when not configured
  private static async getConfig(): Promise<{
    apiKey: string;
    listId: string;
  } | null> {
    const [apiKey, listId] = await Promise.all([
      SecretsService.getSecret("EMAILOCTOPUS_API_KEY"),
      SecretsService.getSecret("EMAILOCTOPUS_LIST_ID"),
    ]);

    if (!apiKey || !listId) {
      logger.warn(
        "EMAILOCTOPUS_API_KEY or EMAILOCTOPUS_LIST_ID not configured - skipping EmailOctopus contact sync",
      );
      return null;
    }

    return { apiKey, listId };
  }

  // EmailOctopus lets you address a contact by the MD5 hash of its lowercase
  // email, so no contact-ID lookup is needed before updating.
  private static getMemberId(emailAddress: string): string {
    return createHash("md5")
      .update(emailAddress.toLowerCase().trim())
      .digest("hex");
  }

  // Add a contact to a list (used for marketing/newsletter signups)
  static async addContactToList(
    contact: EmailOctopusContact,
  ): Promise<boolean> {
    try {
      const config = await this.getConfig();

      if (!config) {
        return false;
      }

      if (!contact.emailAddress) {
        logger.error("EmailOctopus contact requires an email address");
        return false;
      }

      const response = await fetch(
        `${EMAIL_OCTOPUS_API_BASE}/lists/${config.listId}/contacts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: config.apiKey,
            email_address: contact.emailAddress,
            fields: {
              FirstName: contact.firstName,
              LastName: contact.lastName,
            },
            tags: contact.tags || [],
            status: contact.status || "SUBSCRIBED",
          }),
        },
      );

      const data = (await response.json()) as {
        error?: { code?: string; message?: string };
        id?: string;
      };

      if (!response.ok) {
        // MEMBER_EXISTS_WITH_EMAIL_ADDRESS is expected on re-signup — don't log as error
        if (data?.error?.code === "MEMBER_EXISTS_WITH_EMAIL_ADDRESS") {
          logger.info(
            "EmailOctopus contact already exists - skipping",
            { email: contact.emailAddress },
          );
          return true;
        }

        logger.error("EmailOctopus add contact failed", {
          code: data?.error?.code,
          message: data?.error?.message,
          email: contact.emailAddress,
        });
        return false;
      }

      logger.info("EmailOctopus contact added", {
        email: contact.emailAddress,
        contactId: data?.id,
      });
      return true;
    } catch (error: any) {
      logger.error("Error adding EmailOctopus contact", {
        error: error?.message || error,
        email: contact.emailAddress,
      });
      return false;
    }
  }

  // Update a contact's custom fields (e.g. Last_Login_Date) on login/activity.
  // Contacts are addressed by MD5 hash of the lowercase email.
  static async updateContactFields(
    emailAddress: string,
    fields: Record<string, string | number | null>,
  ): Promise<boolean> {
    try {
      const config = await this.getConfig();

      if (!config) {
        return false;
      }

      if (!emailAddress) {
        logger.error("EmailOctopus update requires an email address");
        return false;
      }

      const memberId = this.getMemberId(emailAddress);

      const response = await fetch(
        `${EMAIL_OCTOPUS_API_BASE}/lists/${config.listId}/contacts/${memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: config.apiKey,
            fields,
          }),
        },
      );

      const data = (await response.json()) as {
        error?: { code?: string; message?: string };
        id?: string;
      };

      if (!response.ok) {
        logger.error("EmailOctopus update contact failed", {
          code: data?.error?.code,
          message: data?.error?.message,
          email: emailAddress,
        });
        return false;
      }

      logger.info("EmailOctopus contact updated", {
        email: emailAddress,
        contactId: data?.id,
      });
      return true;
    } catch (error: any) {
      logger.error("Error updating EmailOctopus contact", {
        error: error?.message || error,
        email: emailAddress,
      });
      return false;
    }
  }

  // Convenience helper: stamp the contact's Last_Login_Date field with today
  // (DATE type expects YYYY-MM-DD).
  static async updateContactLastLogin(
    emailAddress: string,
  ): Promise<boolean> {
    const today = new Date().toISOString().slice(0, 10);
    return this.updateContactFields(emailAddress, {
      Last_Login_Date: today,
    });
  }
}

export default EmailOctopusService;
