"use client";

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
            "url('https://calibremarketing.co.uk/wp-content/uploads/2024/04/cookie-policy.jpg?w=1200&h=800&fit=crop')",
        }}></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Cookie{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Last updated: November 22, 2025
          </p>

          <p className="text-gray-200 max-w-2xl mx-auto">
            This Cookie Policy explains how ScholarForge AI("we", "us", or
            "our") uses cookies and similar technologies to recognize you when
            you visit our website and application.
          </p>
        </div>
      </div>
    </section>
  );
}

// Cookie Policy Content
function CookiePolicyContent() {
  const sections = [
    {
      title: "What are cookies?",
      content: (
        <p className="text-gray-200">
          Cookies are small data files that are placed on your computer or
          mobile device when you visit a website. Cookies are widely used by
          website owners to make their websites work, or to work more
          efficiently, as well as to provide reporting information.
        </p>
      ),
    },
    {
      title: "Why do we use cookies?",
      content: (
        <div className="space-y-4">
          <p className="text-gray-200">We use cookies for several reasons:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-200">
            <li>To enable certain functions of our service</li>
            <li>To provide analytics and usage statistics</li>
            <li>To store your preferences and settings</li>
            <li>To improve your user experience</li>
            <li>To authenticate and secure your session</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Types of cookies we use",
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-white mb-2">Essential Cookies</h4>
            <p className="text-gray-200">
              These cookies are strictly necessary to provide you with our
              service and cannot be disabled. They include cookies that help
              with authentication, maintaining your session, and ensuring the
              security of our platform.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">
              Performance Cookies
            </h4>
            <p className="text-gray-200">
              These cookies help us understand how visitors interact with our
              service by collecting and reporting information anonymously. We
              use these cookies to improve how our service works.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">
              Functionality Cookies
            </h4>
            <p className="text-gray-200">
              These cookies enable our service to provide enhanced functionality
              and personalization. They may be set by us or by third party
              providers whose services we have added to our pages.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Targeting Cookies</h4>
            <p className="text-gray-200">
              These cookies may be set through our site by our advertising
              partners. They may be used by those companies to build a profile
              of your interests and show you relevant advertisements on other
              sites.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Third-party cookies",
      content: (
        <div className="space-y-4">
          <p className="text-gray-200">
            We work with third-party partners to provide analytics, security,
            and marketing services. These partners may place cookies on your
            device when you use our service:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-200">
            <li>
              <strong>Google Analytics:</strong> For understanding how users
              interact with our service
            </li>
            <li>
              <strong>Supabase:</strong> For authentication and database
              services
            </li>
            <li>
              <strong>Plausible Analytics:</strong> For privacy-focused usage
              analytics
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "Your cookie choices",
      content: (
        <div className="space-y-4">
          <p className="text-gray-200">
            You have the right to decide whether to accept or reject cookies.
            You can:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-200">
            <li>Set your browser to block or alert you about cookies</li>
            <li>
              Use our cookie consent manager to customize your preferences
            </li>
            <li>Delete cookies from your browser</li>
          </ul>
          <p className="mt-4 text-gray-200">
            Note that blocking all cookies may affect your user experience and
            prevent you from using certain features of our service.
          </p>
        </div>
      ),
    },
    {
      title: "Changes to this Cookie Policy",
      content: (
        <p className="text-gray-200">
          We may update this Cookie Policy from time to time to reflect changes
          in our practices or for other operational, legal, or regulatory
          reasons. We will post the revised Cookie Policy on our website with
          the "Last updated" date at the top.
        </p>
      ),
    },
    {
      title: "Contact us",
      content: (
        <div className="space-y-4">
          <p className="text-gray-200">
            If you have any questions about this Cookie Policy, please contact
            us:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-200">
            <li>By email: privacy@scholarforgeai.com</li>
            <li>
              By visiting our{" "}
              <Link href="/contact" className="text-blue-400 hover:underline">
                contact page
              </Link>
            </li>
          </ul>
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
      title: "Terms of Service",
      description: "Understand the terms that govern your use of our service.",
      href: "/docs/terms",
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

export default function CookiePolicyPage() {
  return (
    <Layout>
      <IntroHero />
      <CookiePolicyContent />
      <RelatedPolicies />
    </Layout>
  );
}
