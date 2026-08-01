import { Section, Text } from "@react-email/components";
import React from "react";
import { BodyText, EmailLayout, SmallNote } from "./EmailLayout";

interface OTPEmailTemplateProps {
  otp: string;
  fullName?: string;
}

export function OTPEmailTemplate({
  otp,
  fullName = "",
}: OTPEmailTemplateProps) {
  return (
    <EmailLayout
      preview="Verify your WorkContext sign-up"
      heading="Verify your account"
      footerText="You received this email because you signed up for WorkContext."
    >
      <BodyText>
        Hello {fullName || "there"}, thank you for signing up with WorkContext.
        Use the code below to verify your account.
      </BodyText>

      <Section
        align="center"
        style={{ borderRadius: 6, backgroundColor: "#f1f5f9", padding: "16px 28px" }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: 6,
          }}
        >
          {otp}
        </Text>
      </Section>

      <SmallNote>
        This code expires in 10 minutes. If you didn&apos;t request it, you can
        safely ignore this email.
      </SmallNote>
    </EmailLayout>
  );
}
