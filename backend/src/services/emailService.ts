import { Resend } from "resend";
import { SecretsService } from "./secrets-service";

// Initialize Resend client
let resend: Resend | null = null;

// Initialize Resend client with API key from secrets
const initializeResend = async () => {
  const resendApiKey = await SecretsService.getSecret("RESEND_API_KEY");

  console.log(
    "Initializing Resend client with API key:",
    resendApiKey ? "[REDACTED]" : "MISSING",
  );

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set in environment variables");
    return null;
  }

  resend = new Resend(resendApiKey);

  // Test Resend client initialization
  try {
    console.log("Resend client initialized:", !!resend);
  } catch (error) {
    console.error("Error initializing Resend client:", error);
  }

  return resend;
};

// Initialize at startup
initializeResend();

export class EmailService {
  // Send OTP via email using Resend
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

      console.log("Attempting to send OTP email via Resend:", {
        to,
        fullName,
        timestamp: new Date().toISOString(),
      });

      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<noreply@email.scholarforge.ai>",
        to,
        subject: "Verify your ScholarForge AI sign-up",
        html: `
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

      if (error) {
        console.error("Resend OTP email error:", {
          error,
          to,
          fullName,
          timestamp: new Date().toISOString(),
        });

        // Provide more specific error messages for common issues
        if (error.message && error.message.includes("domain is not verified")) {
          console.error(
            "DOMAIN VERIFICATION ISSUE: You need to verify your domain (scholarforge.ai) in your Resend dashboard: https://resend.com/domains",
          );
        }

        return false;
      }

      console.log("OTP email sent successfully via Resend", {
        to,
        fullName,
        messageId: data?.id,
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Error sending OTP email via Resend:", {
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
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<welcome@email.scholarforge.ai>",
        to,
        subject: "Welcome to ScholarForge AI!",
        html: `
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

      if (error) {
        console.error("Resend welcome email error:", error);
        return false;
      }

      console.log("Welcome email sent successfully via Resend", {
        to,
        fullName,
        messageId: data?.id,
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Error sending welcome email via Resend:", error);
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
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<noreply@email.scholarforge.ai>",
        to,
        subject: "Reset your ScholarForge AIpassword",
        html: `
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

      if (error) {
        console.error("Resend password reset email error:", error);
        return false;
      }

      console.log("Password reset email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error("Error sending password reset email via Resend:", error);
      return false;
    }
  }

  // Send notification email
  static async sendNotificationEmail(
    to: string,
    fullName: string,
    title: string,
    message: string,
    type: string,
  ): Promise<boolean> {
    try {
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<notifications@email.scholarforge.ai>",
        to,
        subject: title,
        html: `
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

      if (error) {
        console.error("Resend notification email error:", error);
        return false;
      }

      console.log("Notification email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error("Error sending notification email via Resend:", error);
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

      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<noreply@email.scholarforge.ai>",
        to,
        subject,
        html: `
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

      if (error) {
        console.error("Resend profile update OTP email error:", error);
        return false;
      }

      console.log("Profile update OTP email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error(
        "Error sending profile update OTP email via Resend:",
        error,
      );
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
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<billing@email.scholarforge.ai>",
        to,
        subject: `ScholarForge AI${planName} Plan Subscription Confirmed`,
        html: `
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

      if (error) {
        console.error("Resend subscription confirmation email error:", error);
        return false;
      }

      console.log(
        "Subscription confirmation email sent successfully via Resend",
      );
      return true;
    } catch (error) {
      console.error(
        "Error sending subscription confirmation email via Resend:",
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
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<billing@email.scholarforge.ai>",
        to,
        subject: `ScholarForge AIPayment Successful - $${amount.toFixed(2)}`,
        html: `
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

      if (error) {
        console.error("Resend payment success email error:", error);
        return false;
      }

      console.log("Payment success email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error("Error sending payment success email via Resend:", error);
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
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<billing@email.scholarforge.ai>",
        to,
        subject: `ScholarForge AIPayment Failed - $${amount.toFixed(2)}`,
        html: `
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
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Please update your payment method in your account settings to continue using ScholarForge AIand keep your submissions safe.
              </p>
              
              <div style="margin: 30px 0;">
                <a href="http://app.scholarforge.aibilling" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Update Payment Method
                </a>
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                If you need assistance, please contact our support team. Your academic integrity is important to us.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Resend payment failed email error:", error);
        return false;
      }

      console.log("Payment failed email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error("Error sending payment failed email via Resend:", error);
      return false;
    }
  }

  // Send invoice available email
  static async sendInvoiceAvailableEmail(
    to: string,
    fullName: string,
    planName: string,
    amount: number,
    invoiceUrl: string,
  ): Promise<boolean> {
    try {
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<billing@email.scholarforge.ai>",
        to,
        subject: `ScholarForge AIInvoice Available - $${amount.toFixed(2)}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Invoice Available</h1>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName},
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Your invoice for $${amount.toFixed(2)} for the ${planName} plan is now available. We appreciate your commitment to protecting your academic work with ScholarForge AI.
              </p>
              
              <div style="margin: 30px 0;">
                <a href="${invoiceUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View Invoice
                </a>
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

      if (error) {
        console.error("Resend invoice available email error:", error);
        return false;
      }

      console.log("Invoice available email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error("Error sending invoice available email via Resend:", error);
      return false;
    }
  }

  // Send analytics notification email
  static async sendAnalyticsNotificationEmail(
    to: string,
    fullName: string,
    title: string,
    message: string,
    data?: any,
  ): Promise<boolean> {
    try {
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data: emailData, error } = await resend.emails.send({
        from: "ScholarForge AI<analytics@email.scholarforge.ai>",
        to,
        subject: title,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">${title}</h1>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName},
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              
              ${
                data
                  ? `<div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: left;">
                  <h2 style="color: #1e40af; margin-top: 0;">Analytics Data</h2>
                  <pre style="white-space: pre-wrap; word-wrap: break-word; background-color: #fff; padding: 10px; border-radius: 4px; font-size: 14px;">${JSON.stringify(data, null, 2)}</pre>
                </div>`
                  : ""
              }
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                You're receiving this email because you have analytics notifications enabled in your ScholarForge AIsettings. Your academic integrity is important to us.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Resend analytics notification email error:", error);
        return false;
      }

      console.log("Analytics notification email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error(
        "Error sending analytics notification email via Resend:",
        error,
      );
      return false;
    }
  }

  // Send analytics report email with attachment
  static async sendAnalyticsReportEmail(
    to: string,
    fullName: string,
    period: "week" | "month" | "year",
    reportPath: string,
    reportFileName: string,
  ): Promise<boolean> {
    try {
      // Read the PDF report file
      const fs = require("fs");
      const reportBuffer = fs.readFileSync(reportPath);

      const periodLabels = {
        week: "Weekly",
        month: "Monthly",
        year: "Yearly",
      };

      const subject = `ScholarForge AI${periodLabels[period]} Analytics Report`;

      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<analytics@email.scholarforge.ai>",
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">${periodLabels[period]} Analytics Report</h1>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName},
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Your ${periodLabels[period].toLowerCase()} analytics report is now available. Please find the attached PDF document with your detailed analytics on how you're protecting your academic work.
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                This report includes insights on your writing activity, feature usage, productivity trends, and personalized recommendations to enhance your academic integrity.
              </p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                You're receiving this email because you have automated analytics reports enabled in your ScholarForge AIsettings. Your academic integrity is important to us.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: reportFileName,
            content: reportBuffer,
          },
        ],
      });

      if (error) {
        console.error("Resend analytics report email error:", error);
        return false;
      }

      console.log("Analytics report email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error("Error sending analytics report email via Resend:", error);
      return false;
    }
  }

  // Send search alert email
  static async sendSearchAlertEmail(
    to: string,
    fullName: string,
    query: string,
    results: any[],
  ): Promise<boolean> {
    try {
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }

      const papersHtml = results
        .map(
          (paper) => `
        <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <a href="${paper.url || "#"}" style="font-weight: bold; color: #1e40af; text-decoration: none; font-size: 16px;">
                ${paper.title}
            </a>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                ${paper.year ? `(${paper.year})` : ""} ${paper.venue || ""} - ${paper.authors
                  ?.map((a: any) => a.name)
                  .slice(0, 2)
                  .join(", ")}
            </div>
            ${paper.abstract ? `<div style="font-size: 13px; color: #444; margin-top: 6px; line-height: 1.4;">${paper.abstract.substring(0, 150)}...</div>` : ""}
        </div>
      `,
        )
        .join("");

      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI <alerts@email.scholarforge.ai>",
        to,
        subject: `New Papers Found: "${query}"`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 20px;">
                <h1 style="color: #1e40af; font-size: 20px; margin: 10px 0;">New Research Matches</h1>
                <p style="color: #666; font-size: 14px;">For your alert: <strong>${query}</strong></p>
              </div>
              
              <div style="margin-top: 20px;">
                ${papersHtml}
              </div>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="http://app.scholarforge.ai/dashboard" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View All Matches
                </a>
              </div>
              
              <p style="color: #999; font-size: 11px; margin-top: 20px;">
                You are receiving this because you subscribed to search alerts on ScholarForge AI.
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Resend search alert email error:", error);
        return false;
      }

      console.log("Search alert email sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending search alert email:", error);
      return false;
    }
  }

  // Send collaboration notification email
  static async sendCollaborationNotificationEmail(
    to: string,
    fullName: string,
    title: string,
    message: string,
    projectId: string,
    projectName: string,
  ): Promise<boolean> {
    try {
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<collaboration@email.scholarforge.ai>",
        to,
        subject: title,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">${title}</h1>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName},
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: left;">
                <h2 style="color: #1e40af; margin-top: 0;">Project Details</h2>
                <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
                <p style="margin: 5px 0;"><strong>Project ID:</strong> ${projectId}</p>
              </div>
              
              <div style="margin: 30px 0;">
                <a href="http://app.scholarforge.aiprojects/${projectId}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View Project
                </a>
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                You're receiving this email because you are collaborating on this project. Your academic integrity is important to us.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Resend collaboration notification email error:", error);
        return false;
      }

      console.log(
        "Collaboration notification email sent successfully via Resend",
      );
      return true;
    } catch (error) {
      console.error(
        "Error sending collaboration notification email via Resend:",
        error,
      );
      return false;
    }
  }

  // Send account deletion confirmation email
  static async sendAccountDeletionEmail(
    to: string,
    fullName: string = "",
  ): Promise<boolean> {
    try {
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<noreply@email.scholarforge.ai>",
        to,
        subject: "ScholarForge AIAccount Deletion Confirmation",
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AILogo"style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Account Deletion Confirmation</h1>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${fullName || "there"},
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Your ScholarForge AIaccount has been successfully deleted. All your data has been permanently removed from our systems. We hope you found value in protecting your academic work during your time with us.
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                We're sorry to see you go. If you have any feedback about your experience with ScholarForge AI, we'd love to hear it.
              </p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                Thank you for using ScholarForge AI. Your academic integrity is important to us.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam - Your Academic Integrity Partner
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Resend account deletion email error:", error);
        return false;
      }

      console.log("Account deletion email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error("Error sending account deletion email via Resend:", error);
      return false;
    }
  }

  // Send institutional plan request email
  static async sendInstitutionalPlanRequestEmail({
    institutionName,
    contactName,
    contactEmail,
    contactPhone,
    institutionType,
    estimatedUsers,
    department,
    message,
  }: {
    institutionName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    institutionType: string;
    estimatedUsers: number;
    department?: string;
    message?: string;
  }): Promise<boolean> {
    try {
      // Send notification to sales team
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data: salesData, error: salesError } = await resend.emails.send({
        from: "ScholarForge AI<noreply@email.scholarforge.ai>",
        to: "sales@scholarforge.ai", // Replace with actual sales email
        subject: `New Institutional Plan Request - ${institutionName}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">New Institutional Plan Request</h1>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                A new institutional plan request has been submitted with the following details:
              </p>
              
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: left;">
                <p style="color: #666666; font-size: 16px; margin: 10px 0;">
                  <strong>Institution:</strong> ${institutionName}
                </p>
                <p style="color: #666666; font-size: 16px; margin: 10px 0;">
                  <strong>Contact Person:</strong> ${contactName}
                </p>
                <p style="color: #666666; font-size: 16px; margin: 10px 0;">
                  <strong>Contact Email:</strong> ${contactEmail}
                </p>
                <p style="color: #666666; font-size: 16px; margin: 10px 0;">
                  <strong>Contact Phone:</strong> ${contactPhone}
                </p>
                <p style="color: #666666; font-size: 16px; margin: 10px 0;">
                  <strong>Institution Type:</strong> ${institutionType}
                </p>
                <p style="color: #666666; font-size: 16px; margin: 10px 0;">
                  <strong>Estimated Users:</strong> ${estimatedUsers}
                </p>
                ${
                  department
                    ? `<p style="color: #666666; font-size: 16px; margin: 10px 0;">
                  <strong>Department:</strong> ${department}
                </p>`
                    : ""
                }
                ${
                  message
                    ? `<p style="color: #666666; font-size: 16px; margin: 10px 0;">
                  <strong>Message:</strong> ${message}
                </p>`
                    : ""
                }
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                Please follow up with this potential customer within 1 business day.
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AISales Notification
              </p>
            </div>
          </div>
        `,
      });

      if (salesError) {
        console.error(
          "Resend institutional plan request email error:",
          salesError,
        );
        return false;
      }

      // Send confirmation to requester
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data: confirmationData, error: confirmationError } =
        await resend.emails.send({
          from: "ScholarForge AI<noreply@email.scholarforge.ai>",
          to: contactEmail,
          subject: "ScholarForge AIInstitutional Plan Request Received",
          html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; ">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Institutional Plan Request Received</h1>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${contactName},
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in ScholarForge AI's institutional plan. We have received your request for ${institutionName} and will contact you within 1 business day to discuss your needs.
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                In the meantime, if you have any urgent questions, please feel free to contact our sales team at sales@scholarforge.ai.
              </p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                We look forward to working with you!
              </p>

              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AITeam
              </p>
            </div>
          </div>
        `,
        });

      if (confirmationError) {
        console.error(
          "Resend institutional plan confirmation email error:",
          confirmationError,
        );
        return false;
      }

      console.log(
        "Institutional plan request emails sent successfully via Resend",
      );
      return true;
    } catch (error) {
      console.error(
        "Error sending institutional plan request emails via Resend:",
        error,
      );
      return false;
    }
  }

  // Send project share email with attachment
  static async sendProjectShareEmail(
    to: string,
    subject: string,
    html: string,
    attachmentBuffer: Buffer,
    attachmentFilename: string,
  ): Promise<boolean> {
    try {
      // For the project share email, we'll keep the html parameter as is since it's passed in
      // Just removing the text-align: center from the outer container if it exists
      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }
      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<noreply@email.scholarforge.ai>",
        to,
        subject,
        html,
        attachments: [
          {
            filename: attachmentFilename,
            content: attachmentBuffer,
          },
        ],
      });

      if (error) {
        console.error("Resend project share email error:", error);
        return false;
      }

      console.log("Project share email sent successfully via Resend");
      return true;
    } catch (error) {
      console.error("Error sending project share email via Resend:", error);
      return false;
    }
  }

  // Send workspace invitation email
  static async sendWorkspaceInvitation(params: {
    to: string;
    workspaceName: string;
    inviterName: string;
    role: string;
    acceptUrl: string;
    expiresAt: Date;
  }): Promise<boolean> {
    try {
      const { to, workspaceName, inviterName, role, acceptUrl, expiresAt } =
        params;

      if (!resend) {
        console.error("Resend client not initialized");
        return false;
      }

      const { data, error } = await resend.emails.send({
        from: "ScholarForge AI<invitations@email.scholarforge.ai>",
        to,
        subject: `You've been invited to join ${workspaceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5;">
            <div style="background-color: #ffffff; padding: 20px 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <div style="margin-bottom: 30px;">
                <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="ScholarForge AI Logo" style="width: 100%; height: 120px; max-height: 200px; margin-bottom: 5px;">
                <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Workspace Invitation</h1>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong> on ScholarForge AI.
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                You've been invited as a <strong>${role}</strong>.
              </p>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="${acceptUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                This invitation expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              
              <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
                ScholarForge AI Team - Your Academic Integrity Partner
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Resend workspace invitation email error:", error);
        return false;
      }

      console.log("Workspace invitation email sent successfully via Resend", {
        to,
        workspaceName,
        messageId: data?.id,
      });
      return true;
    } catch (error) {
      console.error(
        "Error sending workspace invitation email via Resend:",
        error,
      );
      return false;
    }
  }
}
