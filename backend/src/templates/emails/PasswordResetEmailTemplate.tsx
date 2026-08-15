import { Section, Text } from "@react-email/components";
import React from "react";
import { BodyText, CTAButton, EmailLayout, SmallNote } from "./EmailLayout";

interface PasswordResetEmailTemplateProps {
  resetLink: string;
  fullName?: string;
}

export function PasswordResetEmailTemplate({
  resetLink,
  fullName = "",
}: PasswordResetEmailTemplateProps) {
  return (
    <EmailLayout
      preview="Reset your WorkContext password"
      heading="Reset your password"
      footerText="You received this email because you requested a password reset for your WorkContext account."
    >
      <BodyText>
        Hello {fullName || "there"}, we received a request to reset the password
        for your WorkContext account. Click the button below to choose a new
        password.
      </BodyText>

      <CTAButton href={resetLink}>Reset Password</CTAButton>

      <BodyText style={{ marginTop: 32 }}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
      </BodyText>

      <Section
        style={{
          backgroundColor: "#f1f5f9",
          borderRadius: 6,
          padding: "12px 16px",
          margin: "0 0 32px",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: 12,
            color: "#0f172a",
            wordBreak: "break-all",
            lineHeight: 1.5,
          }}
        >
          {resetLink}
        </Text>
      </Section>

      <SmallNote>
        This link expires in 1 hour. If you didn&apos;t request a password
        reset, you can safely ignore this email.
      </SmallNote>
    </EmailLayout>
  );
}
