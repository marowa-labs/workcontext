import { BodyText, CTAButton, EmailLayout, SmallNote } from "./EmailLayout";

interface WelcomeEmailTemplateProps {
  fullName?: string;
  dashboardUrl?: string;
}

export function WelcomeEmailTemplate({
  fullName = "",
  dashboardUrl = "http://workcontext.vercel.app/dashboard",
}: WelcomeEmailTemplateProps) {
  return (
    <EmailLayout
      preview="Welcome to WorkContext!"
      heading="Welcome to Your Workspace!"
      footerText="You received this email because you joined WorkContext."
    >
      <BodyText>
        Hello {fullName || "there"}, welcome to WorkContext! Your journey to a
        smarter, context-aware workspace starts here.
      </BodyText>
      <BodyText style={{ textAlign: "left", marginBottom: 12 }}>
        With WorkContext, you can:
      </BodyText>
      <BodyText style={{ textAlign: "left", marginBottom: 32 }}>
        &bull; Turn any text into an actionable task in one click
        <br />
        &bull; Ask your AI questions grounded in your own documents
        <br />
        &bull; Collaborate in real time with your team
        <br />
        &bull; Keep your projects, tasks, and notes in one place
      </BodyText>

      <CTAButton href={dashboardUrl}>Get Started</CTAButton>

      <SmallNote>
        Your success is our mission. If you have any questions, feel free to
        reach out to our support team.
      </SmallNote>
    </EmailLayout>
  );
}
