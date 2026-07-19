import Plunk from "@plunk/node";
import { SecretsService } from "./secrets-service";

// Initialize Plunk client
let plunk: Plunk | null = null;

// Initialize Plunk client with API key from secrets
const initializePlunk = async () => {
  const plunkApiKey = await SecretsService.getSecret("PLUNK_API_KEY");

  console.log(
    "Initializing Plunk client with API key:",
    plunkApiKey ? "[REDACTED]" : "MISSING",
  );

  if (!plunkApiKey) {
    console.error("PLUNK_API_KEY is not set in environment variables");
    return null;
  }

  plunk = new Plunk(plunkApiKey);

  // Test Plunk client initialization
  try {
    console.log("Plunk client initialized:", !!plunk);
  } catch (error) {
    console.error("Error initializing Plunk client:", error);
  }

  return plunk;
};

// Initialize at startup
initializePlunk();

export class EmailService {
  // Send OTP via email using Plunk
  static async sendOTPEmail(
    to: string,
    otp: string,
    fullName: string = "",
  ): Promise<boolean> {
    try {
      // Validate inputs
      if (!to) {
        console.error("Email address is required");
        return false;
      }

      if (!otp) {
        console.error("OTP is required");
        return false;
      }

      console.log("Attempting to send OTP email via Plunk:", {
        to,
        fullName,
        timestamp: new Date().toISOString(),
      });

      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject: "Verify your WorkContext sign-up",
        body: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin:0; padding:0; background-color:#f8fafc;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                     <!-- Full-Width Header Image (Edge to Edge) -->
            <tr>
              <td style="padding:0; margin:0; line-height:0;">
                <img
                  src="https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png"
                  alt="WorkContext"
                  width="600"
                  style="display:block; width:100%; max-width:600px; height:auto; border:0;"
                />
              </td>
            </tr>
            
            <!-- Email Body Content -->
                    <tr>
                      <td align="center" style="padding:48px 40px 56px;">
                        <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px; font-weight:700; letter-spacing:-0.3px;">
                          Verify your account
                        </h2>
                        <p style="margin:0 0 32px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          Hello ${fullName || "there"}, thank you for signing up with WorkContext. Use the code below to verify your account.
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="border-radius:6px; background-color:#f1f5f9;">
                              <p style="margin:0; font-size:28px; font-weight:700; color:#0f172a; letter-spacing:6px; padding:16px 28px;">
                                ${otp}
                              </p>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:24px 0 0; color:#94a3b8; font-size:12px;">
                          This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#ffffff; padding:0 40px 40px; color:#94a3b8; font-size:12px; line-height:1.5;">
                        &copy; 2026 WorkContext. All rights reserved.<br />
                        You received this email because you signed up for WorkContext.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      });

      if (!success) {
        console.error("Plunk OTP email error:", {
          to,
          fullName,
          timestamp: new Date().toISOString(),
        });
        return false;
      }

      console.log("OTP email sent successfully via Plunk", {
        to,
        fullName,
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Error sending OTP email via Plunk:", {
        error,
        to,
        fullName,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  }

  // Send welcome email
  static async sendWelcomeEmail(
    to: string,
    fullName: string = "",
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject: "Welcome to WorkContext!",
        body: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin:0; padding:0; background-color:#f8fafc;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                     <!-- Full-Width Header Image (Edge to Edge) -->
            <tr>
              <td style="padding:0; margin:0; line-height:0;">
                <img
                  src="https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png"
                  alt="WorkContext"
                  width="600"
                  style="display:block; width:100%; max-width:600px; height:auto; border:0;"
                />
              </td>
            </tr>
            
            <!-- Email Body Content -->
                    <tr>
                      <td align="center" style="padding:48px 40px 56px;">
                        <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px; font-weight:700; letter-spacing:-0.3px;">
                          Welcome to Your Workspace!
                        </h2>
                        <p style="margin:0 0 24px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          Hello ${fullName || "there"}, welcome to WorkContext! Your journey to anxiety-free writing starts here.
                        </p>
                        <p style="margin:0 0 12px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px; text-align:left;">
                          With WorkContext, you can:
                        </p>
                        <table role="presentation" align="left" cellpadding="0" cellspacing="0" style="margin:0 0 32px; text-align:left;">
                          <tr><td style="color:#64748b; font-size:13px; line-height:1.8;">&bull; Check your document's originality with our Smart Context Map</td></tr>
                          <tr><td style="color:#64748b; font-size:13px; line-height:1.8;">&bull; Verify citations with our Link Verification</td></tr>
                          <tr><td style="color:#64748b; font-size:13px; line-height:1.8;">&bull; Write safely with our Focus Mode</td></tr>
                          <tr><td style="color:#64748b; font-size:13px; line-height:1.8;">&bull; Generate Work Certificates to prove your work</td></tr>
                        </table>
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="border-radius:6px; background-color:#a855f7;">
                              <a href="${process.env.FRONTEND_URL || "http://workcontext.vercel.app"}/dashboard" style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none;">
                                Get Started
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:32px 0 0; color:#94a3b8; font-size:12px; line-height:1.5; max-width:360px;">
                          Your success is our mission. If you have any questions, feel free to reach out to our support team.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#ffffff; padding:0 40px 40px; color:#94a3b8; font-size:12px; line-height:1.5;">
                        &copy; 2026 WorkContext. All rights reserved.<br />
                        You received this email because you joined WorkContext.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      });

      if (!success) {
        console.error("Plunk welcome email error");
        return false;
      }

      console.log("Welcome email sent successfully via Plunk", {
        to,
        fullName,
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Error sending welcome email via Plunk:", error);
      return false;
    }
  }

  // Send notification email
  static async sendNotificationEmail(
    to: string,
    fullName: string,
    title: string,
    message: string,
    type?: string,
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject: title,
        body: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin:0; padding:0; background-color:#f8fafc;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                     <!-- Full-Width Header Image (Edge to Edge) -->
            <tr>
              <td style="padding:0; margin:0; line-height:0;">
                <img
                  src="https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png"
                  alt="WorkContext"
                  width="600"
                  style="display:block; width:100%; max-width:600px; height:auto; border:0;"
                />
              </td>
            </tr>
            
            <!-- Email Body Content -->
                    <tr>
                      <td align="center" style="padding:48px 40px 56px;">
                        <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px; font-weight:700; letter-spacing:-0.3px;">
                          ${title}
                        </h2>
                        <p style="margin:0 0 12px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          Hello ${fullName || "there"},
                        </p>
                        <p style="margin:0 0 32px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          ${message}
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="border-radius:6px; background-color:#a855f7;">
                              <a href="${process.env.FRONTEND_URL || "http://workcontext.vercel.app"}/dashboard" style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none;">
                                View in Dashboard
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:32px 0 0; color:#94a3b8; font-size:12px; line-height:1.5; max-width:360px;">
                          You're receiving this email because you have notifications enabled in your WorkContext settings. Your productivity is important to us.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#ffffff; padding:0 40px 40px; color:#94a3b8; font-size:12px; line-height:1.5;">
                        &copy; 2026 WorkContext. All rights reserved.<br />
                        You received this email because you use WorkContext.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      });

      if (!success) {
        console.error("Plunk notification email error");
        return false;
      }

      console.log("Notification email sent successfully via Plunk");
      return true;
    } catch (error) {
      console.error("Error sending notification email via Plunk:", error);
      return false;
    }
  }

  // Send subscription confirmation email
  static async sendSubscriptionConfirmationEmail(
    to: string,
    fullName: string,
    planName: string,
    amount: number,
    nextBillingDate: string,
    transactionId: string,
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject: `WorkContext${planName} Plan Subscription Confirmed`,
        body: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin:0; padding:0; background-color:#f8fafc;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                     <!-- Full-Width Header Image (Edge to Edge) -->
            <tr>
              <td style="padding:0; margin:0; line-height:0;">
                <img
                  src="https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png"
                  alt="WorkContext"
                  width="600"
                  style="display:block; width:100%; max-width:600px; height:auto; border:0;"
                />
              </td>
            </tr>
            
            <!-- Email Body Content -->
                    <tr>
                      <td align="center" style="padding:48px 40px 56px;">
                        <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px; font-weight:700; letter-spacing:-0.3px;">
                          Subscription Confirmed
                        </h2>
                        <p style="margin:0 0 32px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          Hello ${fullName}, thank you for subscribing to the WorkContext ${planName} plan! You're now one step closer to protecting your work.
                        </p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; border-radius:8px; margin:0 0 32px;">
                          <tr><td style="padding:20px 24px 4px; color:#64748b; font-size:13px;"><strong style="color:#0f172a;">Plan:</strong> ${planName}</td></tr>
                          <tr><td style="padding:4px 24px; color:#64748b; font-size:13px;"><strong style="color:#0f172a;">Amount:</strong> $${amount.toFixed(2)}</td></tr>
                          <tr><td style="padding:4px 24px; color:#64748b; font-size:13px;"><strong style="color:#0f172a;">Next Billing Date:</strong> ${nextBillingDate}</td></tr>
                          <tr><td style="padding:4px 24px 20px; color:#64748b; font-size:13px;"><strong style="color:#0f172a;">Transaction ID:</strong> ${transactionId}</td></tr>
                        </table>
                        <p style="margin:0; color:#94a3b8; font-size:12px;">
                          You can manage your subscription in your account settings.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#ffffff; padding:0 40px 40px; color:#94a3b8; font-size:12px; line-height:1.5;">
                        &copy; 2026 WorkContext. All rights reserved.<br />
                        You received this email because you subscribed to WorkContext.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      });

      if (!success) {
        console.error("Plunk subscription confirmation email error");
        return false;
      }

      console.log(
        "Subscription confirmation email sent successfully via Plunk",
      );
      return true;
    } catch (error) {
      console.error(
        "Error sending subscription confirmation email via Plunk:",
        error,
      );
      return false;
    }
  }

  // Send payment success email
  static async sendPaymentSuccessEmail(
    to: string,
    fullName: string,
    planName: string,
    amount: number,
    transactionId: string,
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject: `WorkContextPayment Successful - $${amount.toFixed(2)}`,
        body: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin:0; padding:0; background-color:#f8fafc;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                     <!-- Full-Width Header Image (Edge to Edge) -->
            <tr>
              <td style="padding:0; margin:0; line-height:0;">
                <img
                  src="https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png"
                  alt="WorkContext"
                  width="600"
                  style="display:block; width:100%; max-width:600px; height:auto; border:0;"
                />
              </td>
            </tr>
            
            <!-- Email Body Content -->
                    <tr>
                      <td align="center" style="padding:48px 40px 56px;">
                        <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px; font-weight:700; letter-spacing:-0.3px;">
                          Payment Successful
                        </h2>
                        <p style="margin:0 0 32px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          Hello ${fullName}, your payment of $${amount.toFixed(2)} for the ${planName} plan has been processed successfully.
                        </p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; border-radius:8px; margin:0 0 32px;">
                          <tr><td style="padding:20px 24px 4px; color:#64748b; font-size:13px;"><strong style="color:#0f172a;">Plan:</strong> ${planName}</td></tr>
                          <tr><td style="padding:4px 24px; color:#64748b; font-size:13px;"><strong style="color:#0f172a;">Amount:</strong> $${amount.toFixed(2)}</td></tr>
                          <tr><td style="padding:4px 24px 20px; color:#64748b; font-size:13px;"><strong style="color:#0f172a;">Transaction ID:</strong> ${transactionId}</td></tr>
                        </table>
                        <p style="margin:0; color:#94a3b8; font-size:12px;">
                          Thank you for choosing WorkContext! Your productivity is our priority.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#ffffff; padding:0 40px 40px; color:#94a3b8; font-size:12px; line-height:1.5;">
                        &copy; 2026 WorkContext. All rights reserved.<br />
                        You received this email because you made a payment to WorkContext.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      });

      if (!success) {
        console.error("Plunk payment success email error");
        return false;
      }

      console.log("Payment success email sent successfully via Plunk");
      return true;
    } catch (error) {
      console.error("Error sending payment success email via Plunk:", error);
      return false;
    }
  }

  // Send invoice available email
  static async sendInvoiceAvailableEmail(
    to: string,
    fullName: string,
    planName: string,
    amount: number,
    downloadUrl: string,
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      await plunk.emails.send({
        to,
        subject: `WorkContext — Invoice Available for ${planName}`,
        body: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin:0; padding:0; background-color:#f8fafc;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                     <!-- Full-Width Header Image (Edge to Edge) -->
            <tr>
              <td style="padding:0; margin:0; line-height:0;">
                <img
                  src="https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png"
                  alt="WorkContext"
                  width="600"
                  style="display:block; width:100%; max-width:600px; height:auto; border:0;"
                />
              </td>
            </tr>
            
            <!-- Email Body Content -->
                    <tr>
                      <td align="center" style="padding:48px 40px 56px;">
                        <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px; font-weight:700; letter-spacing:-0.3px;">
                          Invoice Available
                        </h2>
                        <p style="margin:0 0 32px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          Hello ${fullName}, your invoice for the ${planName} plan ($${amount.toFixed(2)}) is now available.
                        </p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; border-radius:8px; margin:0 0 32px;">
                          <tr><td style="padding:20px 24px 4px; color:#64748b; font-size:13px;"><strong style="color:#0f172a;">Plan:</strong> ${planName}</td></tr>
                          <tr><td style="padding:4px 24px 20px; color:#64748b; font-size:13px;"><strong style="color:#0f172a;">Amount:</strong> $${amount.toFixed(2)}</td></tr>
                        </table>
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="border-radius:6px; background-color:#a855f7;">
                              <a href="${downloadUrl}" style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none;">
                                Download Invoice
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#ffffff; padding:0 40px 40px; color:#94a3b8; font-size:12px; line-height:1.5;">
                        &copy; 2026 WorkContext. All rights reserved.<br />
                        You received this email because you have an invoice from WorkContext.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      });

      console.log("Invoice email sent successfully via Plunk");
      return true;
    } catch (error) {
      console.error("Error sending invoice email via Plunk:", error);
      return false;
    }
  }

  // Send payment failed email
  static async sendPaymentFailedEmail(
    to: string,
    fullName: string,
    planName: string,
    amount: number,
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject: `WorkContextPayment Failed - $${amount.toFixed(2)}`,
        body: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin:0; padding:0; background-color:#f8fafc;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                     <!-- Full-Width Header Image (Edge to Edge) -->
            <tr>
              <td style="padding:0; margin:0; line-height:0;">
                <img
                  src="https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png"
                  alt="WorkContext"
                  width="600"
                  style="display:block; width:100%; max-width:600px; height:auto; border:0;"
                />
              </td>
            </tr>
            
            <!-- Email Body Content -->
                    <tr>
                      <td align="center" style="padding:48px 40px 56px;">
                        <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px; font-weight:700; letter-spacing:-0.3px;">
                          Payment Failed
                        </h2>
                        <p style="margin:0 0 32px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          Hello ${fullName}, we're sorry, but your payment of $${amount.toFixed(2)} for the ${planName} plan has failed. Please update your payment method to continue.
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="border-radius:6px; background-color:#a855f7;">
                              <a href="${process.env.FRONTEND_URL || "http://workcontext.vercel.app"}/billing" style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none;">
                                Update Payment Method
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:32px 0 0; color:#94a3b8; font-size:12px; line-height:1.5; max-width:360px;">
                          If you have any questions, please contact our support team. Your productivity is our priority.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#ffffff; padding:0 40px 40px; color:#94a3b8; font-size:12px; line-height:1.5;">
                        &copy; 2026 WorkContext. All rights reserved.<br />
                        You received this email because a payment to WorkContext failed.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      });

      if (!success) {
        console.error("Plunk payment failed email error");
        return false;
      }

      console.log("Payment failed email sent successfully via Plunk");
      return true;
    } catch (error) {
      console.error("Error sending payment failed email via Plunk:", error);
      return false;
    }
  }

  // Send subscription cancelled email
  static async sendSubscriptionCancelledEmail(
    to: string,
    fullName: string,
    planName: string,
    cancellationDate: string,
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject: `WorkContext Subscription Cancelled`,
        body: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin:0; padding:0; background-color:#f8fafc;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                     <!-- Full-Width Header Image (Edge to Edge) -->
            <tr>
              <td style="padding:0; margin:0; line-height:0;">
                <img
                  src="https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png"
                  alt="WorkContext"
                  width="600"
                  style="display:block; width:100%; max-width:600px; height:auto; border:0;"
                />
              </td>
            </tr>
            
            <!-- Email Body Content -->
                    <tr>
                      <td align="center" style="padding:48px 40px 56px;">
                        <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px; font-weight:700; letter-spacing:-0.3px;">
                          Subscription Cancelled
                        </h2>
                        <p style="margin:0 0 12px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          Hello ${fullName}, we're sorry to see you go. Your ${planName} plan subscription has been cancelled as of ${cancellationDate}.
                        </p>
                        <p style="margin:0 0 32px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                          You'll continue to have access to your plan benefits until the end of your current billing period.
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="border-radius:6px; background-color:#a855f7;">
                              <a href="${process.env.FRONTEND_URL || "http://workcontext.vercel.app"}/billing" style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none;">
                                Reactivate Subscription
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:32px 0 0; color:#94a3b8; font-size:12px; line-height:1.5; max-width:360px;">
                          We'd love to hear your feedback. If there's anything we can do to improve, please let us know.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#ffffff; padding:0 40px 40px; color:#94a3b8; font-size:12px; line-height:1.5;">
                        &copy; 2026 WorkContext. All rights reserved.<br />
                        You received this email because you cancelled your WorkContext subscription.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      });

      if (!success) {
        console.error("Plunk subscription cancelled email error");
        return false;
      }

      console.log("Subscription cancelled email sent successfully via Plunk");
      return true;
    } catch (error) {
      console.error(
        "Error sending subscription cancelled email via Plunk:",
        error,
      );
      return false;
    }
  }

  // Send team/workspace invitation email (branded)
  static async sendTeamInvitationEmail(
    to: string,
    inviterName: string,
    workspaceName: string,
    invitationLink: string,
    role?: string,
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const roleCopy = role
        ? ` as a <strong style="color:#0f172a; text-transform:capitalize;">${role}</strong>`
        : "";

      const success = await plunk.emails.send({
        to,
        subject: `You've been invited to join ${workspaceName} on WorkContext`,
        body: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:#f8fafc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
              <td align="center">
                  <img src="https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png" alt="WorkContext" width="220" style="display:block; width:220px; max-width:220px; height:auto;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:48px 40px 56px;">
                <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px; font-weight:700; letter-spacing:-0.3px;">
                  You're invited to WorkContext
                </h2>
                <p style="margin:0 0 32px; color:#64748b; font-size:13px; line-height:1.5; max-width:360px;">
                  <strong style="color:#0f172a;">${inviterName}</strong> has invited you to join <strong style="color:#0f172a;">${workspaceName}</strong>${roleCopy}. Accept the invite to start collaborating on projects, sharing documents, and staying in sync with your team.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="border-radius:6px; background-color:#a855f7;">
                      <a href="${invitationLink}" style="display:inline-block; padding:12px 36px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:6px; letter-spacing:-0.2px;">
                        Accept invitation
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:32px 0 0; color:#94a3b8; font-size:12px;">
                  This invitation link expires in 7 days. If you weren't expecting this invite, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="background-color:#ffffff; padding:0 40px 40px; color:#94a3b8; font-size:12px; line-height:1.5;">
                © 2026 WorkContext. All rights reserved.<br />
                You received this email because you were invited to a workspace.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
      });

      if (!success) {
        console.error("Plunk team invitation email error");
        return false;
      }

      console.log("Team invitation email sent successfully via Plunk");
      return true;
    } catch (error) {
      console.error("Error sending team invitation email via Plunk:", error);
      return false;
    }
  }

  // Send custom HTML email (for security alerts, etc.)
  static async sendCustomEmail(
    to: string,
    subject: string,
    htmlBody: string,
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject,
        body: htmlBody,
      });

      if (!success) {
        console.error("Plunk custom email error:", { to, subject });
        return false;
      }

      console.log("Custom email sent successfully via Plunk", { to, subject });
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
