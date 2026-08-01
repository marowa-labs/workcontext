import { BodyText, EmailLayout, SmallNote } from "./EmailLayout";

interface SecurityEmailTemplateProps {
  fullName?: string;
  subject: string;
  alertTitle: string;
  message: string;
  details?: { label: string; value: string }[];
  securityUrl?: string;
}

export function SecurityEmailTemplate({
  fullName = "",
  subject,
  alertTitle,
  message,
  details = [],
  securityUrl = "http://workcontext.vercel.app/dashboard/settings/account",
}: SecurityEmailTemplateProps) {
  return (
    <EmailLayout
      preview={subject}
      heading={alertTitle}
      footerText="You can manage your security notification preferences in your account settings."
    >
      <BodyText style={{ textAlign: "left" }}>
        Hello {fullName || "there"},
      </BodyText>
      <BodyText style={{ textAlign: "left" }}>{message}</BodyText>

      {details.length > 0 && (
        <div
          style={{
            backgroundColor: "#f1f5f9",
            borderRadius: 8,
            padding: "20px 24px",
            margin: "0 0 32px",
            maxWidth: 360,
          }}
        >
          {details.map((d) => (
            <p
              key={d.label}
              style={{
                margin: "4px 0",
                color: "#64748b",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: "#0f172a" }}>{d.label}:</strong> {d.value}
            </p>
          ))}
        </div>
      )}

      <BodyText style={{ textAlign: "left" }}>
        <a
          href={securityUrl}
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#1e40af",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: 6,
            fontWeight: 700,
          }}
        >
          Review Account Security
        </a>
      </BodyText>

      <SmallNote>If this wasn&apos;t you, please contact support immediately.</SmallNote>
    </EmailLayout>
  );
}
