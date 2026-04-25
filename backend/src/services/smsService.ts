import { SecretsService } from "./secrets-service";
import logger from "../monitoring/logger";

/**
 * SMS Service for sending SMS messages via Twilio
 */
export class SMSService {
  private static twilioClient: any = null;

  /**
   * Initialize Twilio client
   */
  private static async initializeTwilio() {
    if (this.twilioClient) {
      return this.twilioClient;
    }

    const twilio = await import("twilio");
    const accountSid = await SecretsService.getTwilioAccountSid();
    const authToken = await SecretsService.getTwilioAuthToken();

    if (!accountSid || !authToken) {
      logger.error("Twilio credentials not configured");
      throw new Error("Twilio credentials not configured");
    }

    this.twilioClient = twilio.default(accountSid, authToken);
    return this.twilioClient;
  }

  /**
   * Send OTP via SMS
   * @param phoneNumber - Phone number in E.164 format (e.g., +1234567890)
   * @param otp - The OTP code to send
   * @param fullName - User's full name (optional)
   * @returns boolean indicating success
   */
  static async sendOTPSMS(
    phoneNumber: string,
    otp: string,
    fullName: string = "",
  ): Promise<boolean> {
    try {
      const client = await this.initializeTwilio();
      const fromNumber = await SecretsService.getTwilioPhoneNumber();
      const messagingServiceSid =
        await SecretsService.getTwilioMessageServiceSid();

      if (!fromNumber && !messagingServiceSid) {
        logger.error(
          "Twilio phone number or messaging service SID not configured",
        );
        return false;
      }

      // Construct the message
      const greeting = fullName ? `Hi ${fullName}, ` : "";
      const message = `${greeting}Your ScholarForge AI verification code is: ${otp}. This code expires in 10 minutes.`;

      // Send SMS using either messaging service or direct phone number
      const sendOptions: any = {
        body: message,
        to: phoneNumber,
      };

      if (messagingServiceSid) {
        sendOptions.messagingServiceSid = messagingServiceSid;
      } else {
        sendOptions.from = fromNumber;
      }

      const messageSent = await client.messages.create(sendOptions);

      logger.info("OTP SMS sent successfully", {
        to: phoneNumber,
        messageSid: messageSent.sid,
      });

      return true;
    } catch (error) {
      logger.error("Failed to send OTP SMS", {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber,
      });
      return false;
    }
  }

  /**
   * Send a generic SMS message
   * @param phoneNumber - Phone number in E.164 format
   * @param message - The message to send
   * @returns boolean indicating success
   */
  static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const client = await this.initializeTwilio();
      const fromNumber = await SecretsService.getTwilioPhoneNumber();
      const messagingServiceSid =
        await SecretsService.getTwilioMessageServiceSid();

      if (!fromNumber && !messagingServiceSid) {
        logger.error(
          "Twilio phone number or messaging service SID not configured",
        );
        return false;
      }

      const sendOptions: any = {
        body: message,
        to: phoneNumber,
      };

      if (messagingServiceSid) {
        sendOptions.messagingServiceSid = messagingServiceSid;
      } else {
        sendOptions.from = fromNumber;
      }

      const messageSent = await client.messages.create(sendOptions);

      logger.info("SMS sent successfully", {
        to: phoneNumber,
        messageSid: messageSent.sid,
      });

      return true;
    } catch (error) {
      logger.error("Failed to send SMS", {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber,
      });
      return false;
    }
  }
}
