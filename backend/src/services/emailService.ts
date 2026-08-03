import Plunk from "@plunk/node";
import React from "react";
import { render } from "@react-email/render";
import { SecretsService } from "./secrets-service";
import { OTPEmailTemplate } from "../templates/emails/OTPEmailTemplate";
import { WelcomeEmailTemplate } from "../templates/emails/WelcomeEmailTemplate";
import { NotificationEmailTemplate } from "../templates/emails/NotificationEmailTemplate";
import { TeamInvitationEmailTemplate } from "../templates/emails/TeamInvitationEmailTemplate";
import { SecurityEmailTemplate } from "../templates/emails/SecurityEmailTemplate";

const FROM_ADDRESS = "noreply@workcontext.me";

let plunkPromise: Promise<Plunk | null> | null = null;

async function initializePlunk(): Promise<Plunk | null> {
  const plunkApiKey = await SecretsService.getSecret("PLUNK_API_KEY");

  if (!plunkApiKey) {
    console.error("PLUNK_API_KEY is not set in environment variables");
    return null;
  }

  return new Plunk(plunkApiKey, {
    baseUrl: "https://next-api.useplunk.com/v1/",
  });
}

async function getPlunk(): Promise<Plunk | null> {
  if (!plunkPromise) {
    plunkPromise = initializePlunk().catch((error) => {
      console.error("Error initializing Plunk client:", error);
      return null;
    });
  }
  return plunkPromise;
}

async function renderTemplate(element: React.ReactElement): Promise<string> {
  return render(element);
}

async function send(
  to: string | string[],
  subject: string,
  element: React.ReactElement,
  name = "WorkContext",
): Promise<boolean> {
  try {
    const plunk = await getPlunk();
    if (!plunk) {
      console.error("Plunk client not initialized");
      return false;
    }

    const body = await renderTemplate(element);
    const success = await plunk.emails.send({
      to,
      subject,
      body,
      from: FROM_ADDRESS,
      name,
    });

    if (!success) {
      console.error("Plunk email error:", { to, subject });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email via Plunk:", { error, to, subject });
    return false;
  }
}

export class EmailService {
  // Send OTP via email using Plunk
  static async sendOTPEmail(
    to: string,
    otp: string,
    fullName: string = "",
  ): Promise<boolean> {
    if (!to || !otp) {
      console.error("Email address and OTP are required");
      return false;
    }

    return send(
      to,
      "Verify your WorkContext sign-up",
      OTPEmailTemplate({ otp, fullName }),
    );
  }

  // Send welcome email
  static async sendWelcomeEmail(
    to: string,
    fullName: string = "",
  ): Promise<boolean> {
    return send(
      to,
      "Welcome to WorkContext!",
      WelcomeEmailTemplate({
        fullName,
        dashboardUrl: `${process.env.FRONTEND_URL || "https://www.workcontext.me"}/dashboard`,
      }),
    );
  }

  // Send notification email
  static async sendNotificationEmail(
    to: string,
    fullName: string,
    title: string,
    message: string,
    type?: string,
  ): Promise<boolean> {
    return send(
      to,
      title,
      NotificationEmailTemplate({
        fullName,
        title,
        message,
        dashboardUrl: `${process.env.FRONTEND_URL || "https://www.workcontext.me"}/dashboard`,
      }),
    );
  }

  // Send team/workspace invitation email (branded)
  static async sendTeamInvitationEmail(
    to: string,
    inviterName: string,
    workspaceName: string,
    invitationLink: string,
    role?: string,
  ): Promise<boolean> {
    return send(
      to,
      `You've been invited to join ${workspaceName} on WorkContext`,
      TeamInvitationEmailTemplate({
        inviterName,
        workspaceName,
        invitationLink,
        role,
      }),
    );
  }

  // Send security alert email (new device, password changed, email changed, etc.)
  static async sendSecurityAlertEmail(
    to: string,
    subject: string,
    alertTitle: string,
    message: string,
    details: { label: string; value: string }[] = [],
    fullName: string = "",
  ): Promise<boolean> {
    return send(
      to,
      subject,
      SecurityEmailTemplate({
        fullName,
        subject,
        alertTitle,
        message,
        details,
        securityUrl: `${process.env.FRONTEND_URL || "https://www.workcontext.me"}/dashboard/settings/account`,
      }),
    );
  }

  // Send custom HTML email (for arbitrary pre-rendered HTML bodies)
  static async sendCustomEmail(
    to: string,
    subject: string,
    htmlBody: string,
  ): Promise<boolean> {
    try {
      const plunk = await getPlunk();
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject,
        body: htmlBody,
        from: FROM_ADDRESS,
      });

      if (!success) {
        console.error("Plunk custom email error:", { to, subject });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending custom email via Plunk:", {
        error,
        to,
        subject,
      });
      return false;
    }
  }
}

export default EmailService;
