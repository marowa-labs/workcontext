"use client";

import React from "react";
import { Shield, Lock, Eye, Database, User, Mail } from "lucide-react";
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
            "url('https://images.unsplash.com/photo-1559526324-593bc073d938?w=1200&h=800&fit=crop')",
        }}
      ></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Privacy{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="text-gray-200 max-w-2xl mx-auto">
            We are committed to protecting your privacy and being transparent about how we handle your data.
          </p>
        </div>
      </div>
    </section>
  );
}

function PrivacyContent() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <User className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
              <p className="text-gray-700">
                When you register for an account, we collect information such as your name, email address, and your role. This information is used to personalize your experience and provide personalized features.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Database className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Usage Data</h4>
              <p className="text-gray-700">
                We collect information about how you interact with our Service, including features used, time spent on the platform, and documents created. This data helps us improve our Service and develop new productivity tools.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Eye className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Document Content</h4>
              <p className="text-gray-700">
                We process the content of your documents to provide features such as AI writing assistance, task management, and document collaboration. Your documents are encrypted and securely stored with strict access controls.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2. How We Use Your Information",
      content: (
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>To provide and maintain our Service</li>
          <li>To personalize your experience</li>
          <li>To improve our AI writing and productivity tools</li>
          <li>To communicate with you about your account and updates</li>
          <li>To detect and prevent misuse</li>
        </ul>
      ),
    },
    {
      title: "3. Data Protection and Security",
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Lock className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Encryption</h4>
              <p className="text-gray-700">
                All data is encrypted in transit using industry-standard TLS protocols and at rest using AES-256 encryption. Document content is additionally encrypted with user-specific keys.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Access Controls</h4>
              <p className="text-gray-700">
                Access to your data is strictly limited to authorized personnel who require it for legitimate business purposes. All access is logged and regularly audited.
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Data Retention</h4>
            <p className="text-gray-700">
              We retain your information for as long as your account is active or as needed to provide services. You may delete your account at any time, which will remove your personal information within 30 days.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "4. Information Sharing",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect the rights and safety of our users</li>
            <li>With service providers who assist in operating our Service</li>
          </ul>
          <p className="text-gray-700">
            Our service providers are contractually obligated to protect your information and may only use it for the purposes we specify.
          </p>
        </div>
      ),
    },
    {
      title: "5. Your Rights and Choices",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-5">
            <h4 className="font-semibold text-gray-900 mb-2">Access and Update</h4>
            <p className="text-gray-600 text-sm">You can access and update your personal information through your account settings.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-5">
            <h4 className="font-semibold text-gray-900 mb-2">Data Portability</h4>
            <p className="text-gray-600 text-sm">You can export your documents and data in standard formats at any time.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-5">
            <h4 className="font-semibold text-gray-900 mb-2">Deletion</h4>
            <p className="text-gray-600 text-sm">You can delete your account and all associated data through your account settings.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-5">
            <h4 className="font-semibold text-gray-900 mb-2">Opt-Out</h4>
            <p className="text-gray-600 text-sm">You can opt out of marketing communications at any time.</p>
          </div>
        </div>
      ),
    },
    {
      title: "6. Children\u2019s Privacy",
      content: (
        <p className="text-gray-700">
          Our Service is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
        </p>
      ),
    },
    {
      title: "7. Changes to This Privacy Policy",
      content: (
        <p className="text-gray-700">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Us About Privacy</h2>
              <p className="text-gray-600 mb-6">
                If you have any questions about this Privacy Policy or our data practices, please contact our privacy team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:privacy@workcontextai.com"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium text-center"
                >
                  Email Privacy Team
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
      title: "Terms of Service",
      description: "Understand the terms that govern your use of our service.",
      href: "/legal/terms",
    },
    {
      title: "Cookie Policy",
      description: "Information about how we use cookies and similar technologies.",
      href: "/legal/cookies",
    },
    {
      title: "GDPR Compliance",
      description: "Information about our compliance with the General Data Protection Regulation.",
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

export default function PrivacyPage() {
  return (
    <Layout>
      <IntroHero />
      <PrivacyContent />
      <RelatedPolicies />
    </Layout>
  );
}
