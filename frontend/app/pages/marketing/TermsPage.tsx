"use client";

import React from "react";
import { Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";

function IntroHero() {
  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=800&fit=crop')",
        }}
      ></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Terms of{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Service
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Please read these terms carefully before using WorkContext.
          </p>
        </div>
      </div>
    </section>
  );
}

function TermsContent() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            By accessing or using WorkContext ("the Service"), you agree to be
            bound by these Terms of Service ("Terms"). If you disagree with any
            part of the terms, you may not access the Service.
          </p>
          <p className="text-gray-700">
            These Terms apply to all visitors, users, and others who access or
            use the Service. By accessing or using the Service, you agree to be
            bound by these Terms.
          </p>
        </div>
      ),
    },
    {
      title: "2. Description of Service",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            WorkContext is a context-aware productivity workspace for
            individuals and teams that provides tools for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>AI-powered writing assistance and chat</li>
            <li>Task management with priorities, assignees, and due dates</li>
            <li>Document editing with real-time collaboration</li>
            <li>Multi-format export (PDF, DOCX, LaTeX, RTF, TXT)</li>
            <li>Time tracking and progress monitoring</li>
            <li>Team workspaces with role-based access</li>
          </ul>
        </div>
      ),
    },
    {
      title: "3. Account Terms",
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              3.1 Account Registration
            </h4>
            <p className="text-gray-700">
              You must register for an account to access certain features of the
              Service. You agree to provide accurate, current, and complete
              information during registration.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              3.2 Account Security
            </h4>
            <p className="text-gray-700">
              You are responsible for maintaining the security of your account
              and password. You are fully responsible for all activities that
              occur under your account.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              3.3 Account Restrictions
            </h4>
            <p className="text-gray-700">
              You may not use the Service for any illegal or unauthorized
              purpose. You may not, in the use of the Service, violate any laws
              in your jurisdiction.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "4. Intellectual Property",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            The Service and its original content, features, and functionality
            are and will remain the exclusive property of WorkContext and its
            licensors. The Service is protected by copyright, trademark, and
            other laws.
          </p>
          <p className="text-gray-700">
            Our trademarks and trade dress may not be used in connection with
            any product or service without the prior written consent of
            WorkContext.
          </p>
        </div>
      ),
    },
    {
      title: "5. Content Policy",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            We respect the intellectual property rights of others. If you
            believe that any content on our Service infringes upon your
            copyrights, please contact us with a detailed notice of the alleged
            infringement.
          </p>
          <p className="text-gray-700">
            We reserve the right to remove any content that violates these Terms
            or applicable law, without prior notice.
          </p>
        </div>
      ),
    },
    {
      title: "6. Termination",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            We may terminate or suspend your account immediately, without prior
            notice or liability, for any reason, including if you breach the
            Terms.
          </p>
          <p className="text-gray-700">
            Upon termination, your right to use the Service will immediately
            cease. If you wish to terminate your account, you may simply
            discontinue using the Service.
          </p>
        </div>
      ),
    },
    {
      title: "7. Limitation of Liability",
      content: (
        <p className="text-gray-700">
          In no event shall WorkContext, its directors, employees, partners,
          agents, suppliers, or affiliates be liable for any indirect,
          incidental, special, consequential, or punitive damages, including
          loss of profits, data, or other intangible losses.
        </p>
      ),
    },
    {
      title: "8. Governing Law",
      content: (
        <p className="text-gray-700">
          These Terms shall be governed and construed in accordance with the
          laws applicable in your jurisdiction, without regard to its conflict
          of law provisions.
        </p>
      ),
    },
    {
      title: "9. Changes to Terms",
      content: (
        <p className="text-gray-700">
          We reserve the right to modify these Terms at any time. We will notify
          you of any changes by posting the new Terms on this page and updating
          the "Last updated" date.
        </p>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {section.title}
                </h2>
                <div className="space-y-4">{section.content}</div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 mt-12">
            <div className="text-center max-w-2xl mx-auto">
              <Mail className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Contact Us
              </h2>
              <p className="text-gray-600 mb-6">
                If you have any questions about these Terms of Service, please
                contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:legal@WorkContextai.com"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium text-center"
                >
                  Email Legal Team
                </a>
                <Link
                  href="/docs"
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-center text-gray-700 hover:bg-gray-50"
                >
                  Back to Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
      title: "GDPR Compliance",
      description:
        "Information about our compliance with the General Data Protection Regulation.",
      href: "/legal/gdpr",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Related Policies
          </h2>
          <p className="text-gray-600">
            Learn more about our commitment to privacy and security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {policies.map((policy, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {policy.title}
              </h3>
              <p className="text-gray-600 mb-4">{policy.description}</p>
              <Button
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                asChild
              >
                <Link href={policy.href}>Read More</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <Layout>
      <IntroHero />
      <TermsContent />
      <RelatedPolicies />
    </Layout>
  );
}
