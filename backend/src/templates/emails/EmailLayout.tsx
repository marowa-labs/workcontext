import {
  Body,
  Button,
  Column,
  Container,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

const BASE_URL =
  "https://cdn.phototourl.com/free/2026-07-19-b81fd007-385a-4aca-8109-2962186f0c6d.png";

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  footerText?: string;
}

export function EmailLayout({
  preview,
  heading,
  children,
  footerText = "You received this email because you use WorkContext.",
}: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: "#f8fafc" }}>
        <Container
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: "#f8fafc", padding: "40px 0" }}
        >
          <Row>
            <Column align="center">
              <Section
                width={600}
                style={{
                  width: 600,
                  maxWidth: 600,
                  backgroundColor: "#ffffff",
                  borderRadius: 0,
                  overflow: "hidden",
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                }}
              >
                <Row>
                  <Column style={{ padding: 0, margin: 0, lineHeight: 0 }}>
                    <Img
                      src={BASE_URL}
                      alt="WorkContext"
                      width={600}
                      style={{
                        display: "block",
                        width: "100%",
                        maxWidth: 600,
                        height: "auto",
                        border: 0,
                      }}
                    />
                  </Column>
                </Row>

                <Row>
                  <Column
                    align="center"
                    style={{ padding: "48px 40px 56px" }}
                  >
                    <Heading
                      style={{
                        margin: "0 0 12px",
                        color: "#0f172a",
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {heading}
                    </Heading>
                    {children}
                  </Column>
                </Row>

                <Row>
                  <Column
                    align="center"
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "0 40px 40px",
                      color: "#94a3b8",
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    <Text style={{ margin: 0 }}>
                      © 2026 WorkContext. All rights reserved.
                      <br />
                      {footerText}
                    </Text>
                  </Column>
                </Row>
              </Section>
            </Column>
          </Row>
        </Container>
      </Body>
    </Html>
  );
}

export function CTAButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={{ textAlign: "center" }}>
      <Button
        href={href}
        style={{
          display: "inline-block",
          padding: "12px 36px",
          fontSize: 14,
          fontWeight: 600,
          color: "#ffffff",
          textDecoration: "none",
          borderRadius: 6,
          letterSpacing: "-0.2px",
          backgroundColor: "#a855f7",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function BodyText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Text
      style={{
        margin: "0 0 32px",
        color: "#64748b",
        fontSize: 13,
        lineHeight: 1.5,
        maxWidth: 360,
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

export function SmallNote({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Text
      style={{
        margin: "32px 0 0",
        color: "#94a3b8",
        fontSize: 12,
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </Text>
  );
}
