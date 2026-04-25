"use client";

import React from "react";
import { Shield, FileText, Lock, User, Mail, Database } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";

// Intro Hero Section
function IntroHero() {
  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage:
            "url('https://www.nokia.com/sites/default/files/2022-01/cybersecurity4.jpg?w=1200&h=800&fit=crop')",
        }}></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            GDPR{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Compliance
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Last updated: November 22, 2025
          </p>

          <p className="text-gray-200 max-w-2xl mx-auto">
            ScholarForge AIis committed to protecting your privacy and complying
            with the General Data Protection Regulation (GDPR).
          </p>
        </div>
      </div>
    </section>
  );
}

// GDPR Content
function GDPRContent() {
  const sections = [
    {
      title: "Your Rights Under GDPR",
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <User className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-2">Right to Access</h4>
              <p className="text-gray-200">
                You have the right to request copies of your personal data that
                we hold.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Database className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-2">
                Right to Rectification
              </h4>
              <p className="text-gray-200">
                You have the right to request that we correct any information
                you believe is inaccurate.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Lock className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-2">
                Right to Erasure
              </h4>
              <p className="text-gray-200">
                You have the right to request that we erase your personal data,
                under certain conditions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-2">
                Right to Restrict Processing
              </h4>
              <p className="text-gray-200">
                You have the right to request that we restrict the processing of
                your personal data, under certain conditions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <FileText className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-2">
                Right to Data Portability
              </h4>
              <p className="text-gray-200">
                You have the right to request that we transfer the data that we
                have collected to another organization, or directly to you,
                under certain conditions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Mail className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-2">Right to Object</h4>
              <p className="text-gray-200">
                You have the right to object to our processing of your personal
                data, under certain conditions.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "How We Process Your Data",
      content: (
        <div className="space-y-4">
          <p className="text-gray-200">
            We process your personal data in the following lawful ways:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-200">
            <li>
              <strong>Consent:</strong> We have your explicit consent to process
              your data for specific purposes
            </li>
            <li>
              <strong>Contract:</strong> Processing is necessary for a contract
              we have with you
            </li>
            <li>
              <strong>Legal Obligation:</strong> Processing is necessary for us
              to comply with the law
            </li>
            <li>
              <strong>Vital Interests:</strong> Processing is necessary to
              protect someone's life
            </li>
            <li>
              <strong>Public Task:</strong> Processing is necessary for a task
              carried out in the public interest
            </li>
            <li>
              <strong>Legitimate Interests:</strong> Processing is necessary for
              our legitimate interests or those of a third party
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "Data We Collect",
      content: (
        <div className="space-y-4">
          <p className="text-gray-200">
            We collect the following categories of personal data:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-200">
            <li>
              <strong>Identity Data:</strong> Name, username, profile picture
            </li>
            <li>
              <strong>Contact Data:</strong> Email address, phone number
            </li>
            <li>
              <strong>Technical Data:</strong> IP address, browser type, time
              zone settings
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you use our
              service
            </li>
            <li>
              <strong>Content Data:</strong> Documents, citations, and other
              content you create
            </li>
            <li>
              <strong>Marketing Data:</strong> Your preferences in receiving
              marketing communications
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "Data Retention",
      content: (
        <div className="space-y-4">
          <p className="text-gray-200">
            We retain your personal data for as long as necessary to provide our
            service and fulfill the purposes described in this policy:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-200">
            <li>
              <strong>Account Data:</strong> While your account is active, or as
              needed to provide our service
            </li>
            <li>
              <strong>Content Data:</strong> While your account is active, or as
              needed to provide our service
            </li>
            <li>
              <strong>Usage Data:</strong> For up to 24 months to improve our
              service
            </li>
            <li>
              <strong>Marketing Data:</strong> Until you ask us to stop sending
              marketing communications
            </li>
          </ul>
          <p className="mt-4 text-gray-200">
            When we no longer need your personal data, we will delete it or
            anonymize it.
          </p>
        </div>
      ),
    },
    {
      title: "International Data Transfers",
      content: (
        <p className="text-gray-200">
          We may transfer your personal data outside of the European Economic
          Area (EEA). Whenever we do so, we ensure a similar degree of
          protection by using appropriate safeguards.
        </p>
      ),
    },
    {
      title: "Data Security",
      content: (
        <div className="space-y-4">
          <p className="text-gray-200">
            We implement appropriate technical and organizational measures to
            protect your personal data:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-200">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and penetration testing</li>
            <li>Access controls and authentication measures</li>
            <li>Employee training on data protection</li>
            <li>Incident response procedures</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Contacting Our Data Protection Officer",
      content: (
        <div className="space-y-4">
          <p className="text-gray-200">
            You can contact our Data Protection Officer with any questions about
            this policy or your rights:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-200">
            <li>By email: dpo@scholarforgeai.com</li>
            <li>
              By post: Data Protection Officer, ScholarForge AI, 123 Privacy
              Street, San Francisco, CA 94107
            </li>
          </ul>
          <p className="mt-4 text-gray-200">
            We will respond to your request within one month, though this may be
            extended by two months for complex requests.
          </p>
        </div>
      ),
    },
  ];
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="prose max-w-none">
            {sections.map((section, index) => (
              <div key={index} className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {section.title}
                </h2>
                <div className="space-y-4">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Related Policies
function RelatedPolicies() {
  const policies = [
    {
      title: "Privacy Policy",
      description:
        "Learn how we collect, use, and protect your personal information.",
      href: "/docs/privacy",
    },
    {
      title: "Cookie Policy",
      description:
        "Information about how we use cookies and similar technologies.",
      href: "/legal/cookies",
    },
    {
      title: "Security",
      description: "Details about our security measures and practices.",
      href: "/legal/security",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Related Policies
          </h2>
          <p className="text-gray-200">
            Learn more about our commitment to privacy and security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {policies.map((policy, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-white">
              <h3 className="text-xl font-bold text-white mb-3">
                {policy.title}
              </h3>
              <p className="text-gray-200 mb-4">{policy.description}</p>
              <Button
                variant="outline"
                className="bg-white border-white text-white hover:bg-white"
                asChild>
                <Link href={policy.href}>Read More</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function GDPRPage() {
  return (
    <Layout>
      <IntroHero />
      <GDPRContent />
      <RelatedPolicies />
    </Layout>
  );
}
