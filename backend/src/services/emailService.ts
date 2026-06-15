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
        subject: "Verify your ScholarForge AI sign-up",
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Verify Your Account</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName || "there"},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for signing up with ScholarForge AI. You're one step closer to protecting your academic work. Please use the following code to verify your account:
              </p>

              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <p style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px; margin: 0;">
                  ${otp}
                </p>
                <p style="color: #666666; font-size: 14px; margin-top: 10px;">
                  This code will expire in 10 minutes
                </p>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                If you did not request this code, please disregard this email. Your academic integrity is important to us.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AI- Your Academic Integrity Partner
              </p>

              <p style="color: #999999; font-size: 12px; margin: 0;">
                &copy; 2024 ScholarForge AI. All rights reserved.
              </p>
            </div>
          </div>
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
        subject: "Welcome to ScholarForge AI!",
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Welcome to Your Submission Shield!</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName || "there"},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Welcome to ScholarForge AI! Your journey to anxiety-free academic writing starts here.
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                With ScholarForge AI, you can:
              </p>

              <ul style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                <li>Check your document's originality with our Explainable Originality Map</li>
                <li>Verify citations with our Citation Confidence Auditor</li>
                <li>Write safely with our Submission-Safe Writing Mode</li>
                <li>Generate Authorship Certificates to prove your work</li>
              </ul>

              <div style="margin: 30px 0; text-align: center;">
                <a href="http://app.scholarforge.ai/dashboard" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Start Writing Safely
                </a>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                Your academic success is our mission. If you have any questions, feel free to reach out to our support team.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
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

  // Send password reset email
  static async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    fullName: string = "",
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject: "Reset your ScholarForge AIpassword",
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Password Reset</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName || "there"},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your ScholarForge AIaccount. Click the button below to create a new password and continue protecting your academic work:
              </p>

              <div style="margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Reset Password
                </a>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your academic integrity is important to us.
              </p>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                This link will expire in 1 hour for security reasons.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
        `,
      });

      if (!success) {
        console.error("Plunk password reset email error");
        return false;
      }

      console.log("Password reset email sent successfully via Plunk");
      return true;
    } catch (error) {
      console.error("Error sending password reset email via Plunk:", error);
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
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">${title}</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName || "there"},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>

              <div style="margin: 30px 0;">
                <a href="http://app.scholarforge.ai/dashboard" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View in Dashboard
                </a>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                You're receiving this email because you have notifications enabled in your ScholarForge AIsettings. Your academic integrity is important to us.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
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

  // Send profile update OTP email
  static async sendProfileUpdateOTPEmail(
    to: string,
    otp: string,
    isEmailChange: boolean = false,
  ): Promise<boolean> {
    try {
      const subject = isEmailChange
        ? "Verify your email change request"
        : "Verify your profile update";

      const bodyMessage = isEmailChange
        ? "You have requested to change your email address. Please enter the following code to confirm this change."
        : "You have requested to update your profile information. Please enter the following code to confirm these changes.";

      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject,
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">${subject}</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                ${bodyMessage}
              </p>

              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px; margin: 0;">
                  ${otp}
                </p>
                <p style="color: #666666; font-size: 14px; margin-top: 10px;">
                  This code will expire in 10 minutes
                </p>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                If you did not request this change, please disregard this email. The code will remain active for 10 minutes.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AI, an effortless identity solution with all the features you need.
              </p>

              <p style="color: #999999; font-size: 12px; margin: 0;">
                &copy; 2024 ScholarForge AI. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      if (!success) {
        console.error("Plunk profile update OTP email error");
        return false;
      }

      console.log("Profile update OTP email sent successfully via Plunk");
      return true;
    } catch (error) {
      console.error("Error sending profile update OTP email via Plunk:", error);
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
        subject: `ScholarForge AI${planName} Plan Subscription Confirmed`,
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Subscription Confirmed</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for subscribing to ScholarForge AI${planName} plan! You're now one step closer to protecting your academic work and ensuring your submissions are defensible.
              </p>

              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: left;">
                <h2 style="color: #1e40af; margin-top: 0;">Subscription Details</h2>
                <p style="margin: 5px 0;"><strong>Plan:</strong> ${planName}</p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Next Billing Date:</strong> ${nextBillingDate}</p>
                <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                You can manage your subscription in your account settings. Your academic integrity is our priority.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
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
        subject: `ScholarForge AIPayment Successful - $${amount.toFixed(2)}`,
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Payment Successful</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Your payment of $${amount.toFixed(2)} for the ${planName} plan has been processed successfully. You're now one step closer to protecting your academic work and ensuring your submissions are defensible.
              </p>

              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: left;">
                <h2 style="color: #1e40af; margin-top: 0;">Payment Details</h2>
                <p style="margin: 5px 0;"><strong>Plan:</strong> ${planName}</p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                Thank you for choosing ScholarForge AI! Your academic integrity is our priority.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
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
        subject: `ScholarForge AI — Invoice Available for ${planName}`,
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5;">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #1e40af; font-size: 24px;">Invoice Available</h1>
              <p style="color: #666666; font-size: 16px;">Hello ${fullName},</p>
              <p style="color: #666666; font-size: 16px;">Your invoice for the ${planName} plan ($${amount.toFixed(2)}) is now available.</p>
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Plan:</strong> ${planName}</p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
              </div>
              <a href="${downloadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: #ffffff; text-decoration: none; border-radius: 8px;">Download Invoice</a>
            </div>
          </div>
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
        subject: `ScholarForge AIPayment Failed - $${amount.toFixed(2)}`,
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Payment Failed</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                We're sorry, but your payment of $${amount.toFixed(2)} for the ${planName} plan has failed. We want to ensure you can continue protecting your academic work.
              </p>

              <div style="margin: 30px 0;">
                <a href="http://app.scholarforge.ai/billing" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Update Payment Method
                </a>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                If you have any questions, please contact our support team. Your academic integrity is our priority.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
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
        subject: `ScholarForge AI Subscription Cancelled`,
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Subscription Cancelled</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                We're sorry to see you go. Your ${planName} plan subscription has been cancelled as of ${cancellationDate}.
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                You'll continue to have access to your plan benefits until the end of your current billing period.
              </p>

              <div style="margin: 30px 0;">
                <a href="http://app.scholarforge.ai/billing" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Reactivate Subscription
                </a>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                We'd love to hear your feedback. If there's anything we can do to improve, please let us know.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
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

  // Send team invitation email
  static async sendTeamInvitationEmail(
    to: string,
    inviterName: string,
    workspaceName: string,
    invitationLink: string,
  ): Promise<boolean> {
    try {
      if (!plunk) {
        console.error("Plunk client not initialized");
        return false;
      }

      const success = await plunk.emails.send({
        to,
        subject: `You've been invited to join ${workspaceName} on ScholarForge AI`,
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Team Invitation</h1>
              </div>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                ${inviterName} has invited you to join <strong>${workspaceName}</strong> on ScholarForge AI!
              </p>

              <div style="margin: 30px 0;">
                <a href="${invitationLink}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Accept Invitation
                </a>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                Join your team and start collaborating on academic projects with confidence.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
        `,
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
}

export default EmailService;
