import { BodyText, CTAButton, EmailLayout, SmallNote } from "./EmailLayout";

interface NotificationEmailTemplateProps {
  fullName?: string;
  title: string;
  message: string;
  dashboardUrl?: string;
}

export function NotificationEmailTemplate({
  fullName = "",
  title,
  message,
  dashboardUrl = "https://www.workcontext.me/dashboard",
}: NotificationEmailTemplateProps) {
  return (
    <EmailLayout
      preview={title}
      heading={title}
      footerText="You received this email because you have notifications enabled in your WorkContext settings."
    >
      <BodyText style={{ textAlign: "left" }}>
        Hello {fullName || "there"},
      </BodyText>
      <BodyText style={{ textAlign: "left" }}>{message}</BodyText>

      <CTAButton href={dashboardUrl}>View in Dashboard</CTAButton>

      <SmallNote>
        You&apos;re receiving this email because you have notifications enabled
        in your WorkContext settings.
      </SmallNote>
    </EmailLayout>
  );
}
