import { BodyText, CTAButton, EmailLayout, SmallNote } from "./EmailLayout";

interface TeamInvitationEmailTemplateProps {
  inviterName: string;
  workspaceName: string;
  invitationLink: string;
  role?: string;
}

export function TeamInvitationEmailTemplate({
  inviterName,
  workspaceName,
  invitationLink,
  role,
}: TeamInvitationEmailTemplateProps) {
  const roleNode = role ? (
    <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>
      {" "}
      as a {role}
    </strong>
  ) : null;

  return (
    <EmailLayout
      preview={`You've been invited to join ${workspaceName} on WorkContext`}
      heading="You're invited to WorkContext"
      footerText="You received this email because you were invited to a workspace."
    >
      <BodyText>
        <strong style={{ color: "#0f172a" }}>{inviterName}</strong> has invited
        you to join <strong style={{ color: "#0f172a" }}>{workspaceName}</strong>
        {roleNode}. Accept the invite to start collaborating on projects,
        sharing documents, and staying in sync with your team.
      </BodyText>

      <CTAButton href={invitationLink}>Accept invitation</CTAButton>

      <SmallNote>
        This invitation link expires in 7 days. If you weren&apos;t expecting
        this invite, you can safely ignore this email.
      </SmallNote>
    </EmailLayout>
  );
}
