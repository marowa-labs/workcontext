"use client";

import Link from "next/link";
import { Shield, Lock, Eye, Database, User, Mail } from "lucide-react";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium ml-1 md:ml-2 text-foreground">
                Privacy Policy
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-12">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Privacy Content */}
      <div className="max-w-none">
        {/* Section 1: Information We Collect */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            1. Information We Collect
          </h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <User className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0 dark:text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  Personal Information
                </h3>
                <p className="text-muted-foreground">
                  When you register for an account, we collect information such
                  as your name, email address, and your role. This information
                  is used to personalize your experience and provide
                  personalized features.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Database className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0 dark:text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  Usage Data
                </h3>
                <p className="text-muted-foreground">
                  We collect information about how you interact with our
                  Service, including features used, time spent on the platform,
                  and documents created. This data helps us improve our Service
                  and develop new productivity tools.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Eye className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0 dark:text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  Document Content
                </h3>
                <p className="text-muted-foreground">
                  We process the content of your documents to provide features
                  such as AI writing assistance, task management, and document
                  collaboration. Your documents are encrypted and securely
                  stored with strict access controls.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: How We Use Your Information */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            2. How We Use Your Information
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-3 dark:bg-green-900/30">
                <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
              </div>
              <span className="text-muted-foreground">
                To provide and maintain our Service
              </span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-3 dark:bg-green-900/30">
                <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
              </div>
              <span className="text-muted-foreground">
                To personalize your experience
              </span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-3 dark:bg-green-900/30">
                <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
              </div>
              <span className="text-muted-foreground">
                To improve our AI writing and productivity tools
              </span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-3 dark:bg-green-900/30">
                <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
              </div>
              <span className="text-muted-foreground">
                To communicate with you about your account and updates
              </span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-3 dark:bg-green-900/30">
                <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
              </div>
              <span className="text-muted-foreground">
                To detect and prevent misuse
              </span>
            </li>
          </ul>
        </div>

        {/* Section 3: Data Protection and Security */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            3. Data Protection and Security
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <Lock className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0 dark:text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  Encryption
                </h3>
                <p className="text-muted-foreground">
                  All data is encrypted in transit using industry-standard TLS
                  protocols and at rest using AES-256 encryption. Document
                  content is additionally encrypted with user-specific keys.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Shield className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0 dark:text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  Access Controls
                </h3>
                <p className="text-muted-foreground">
                  Access to your data is strictly limited to authorized
                  personnel who require it for legitimate business purposes. All
                  access is logged and regularly audited.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Data Retention
              </h3>
              <p className="text-muted-foreground">
                We retain your information for as long as your account is active
                or as needed to provide services. You may delete your account at
                any time, which will remove your personal information within 30
                days.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Information Sharing */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            4. Information Sharing
          </h2>
          <p className="text-muted-foreground mb-4">
            We do not sell, trade, or rent your personal information to third
            parties. We may share your information only in the following
            circumstances:
          </p>
          <ul className="space-y-3 mb-4">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3 dark:bg-blue-900/30">
                <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              </div>
              <span className="text-muted-foreground">With your consent</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3 dark:bg-blue-900/30">
                <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              </div>
              <span className="text-muted-foreground">
                To comply with legal obligations
              </span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3 dark:bg-blue-900/30">
                <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              </div>
              <span className="text-muted-foreground">
                To protect the rights and safety of our users
              </span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3 dark:bg-blue-900/30">
                <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              </div>
              <span className="text-muted-foreground">
                With service providers who assist in operating our Service
              </span>
            </li>
          </ul>
          <p className="text-muted-foreground">
            Our service providers are contractually obligated to protect your
            information and may only use it for the purposes we specify.
          </p>
        </div>

        {/* Section 5: Your Rights and Choices */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            5. Your Rights and Choices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-5">
              <h3 className="font-semibold mb-2 text-foreground">
                Access and Update
              </h3>
              <p className="text-muted-foreground text-sm">
                You can access and update your personal information through your
                account settings.
              </p>
            </div>
            <div className="border border-border rounded-lg p-5">
              <h3 className="font-semibold mb-2 text-foreground">
                Data Portability
              </h3>
              <p className="text-muted-foreground text-sm">
                You can export your documents and data in standard formats at
                any time.
              </p>
            </div>
            <div className="border border-border rounded-lg p-5">
              <h3 className="font-semibold mb-2 text-foreground">Deletion</h3>
              <p className="text-muted-foreground text-sm">
                You can delete your account and all associated data through your
                account settings.
              </p>
            </div>
            <div className="border border-border rounded-lg p-5">
              <h3 className="font-semibold mb-2 text-foreground">Opt-Out</h3>
              <p className="text-muted-foreground text-sm">
                You can opt out of marketing communications at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Section 6: Children's Privacy */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            6. Children&apos;s Privacy
          </h2>
          <p className="text-muted-foreground">
            Our Service is not intended for use by children under the age of 13.
            We do not knowingly collect personal information from children under
            13. If we become aware that we have collected personal information
            from a child under 13, we will take steps to delete such
            information.
          </p>
        </div>

        {/* Section 7: Changes to This Privacy Policy */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            7. Changes to This Privacy Policy
          </h2>
          <p className="text-muted-foreground">
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the &quot;Last updated&quot; date. You are advised to
            review this Privacy Policy periodically for any changes.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-card border border-border rounded-2xl p-8 mt-12">
        <div className="text-center max-w-2xl mx-auto">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            Contact Us About Privacy
          </h2>
          <p className="text-muted-foreground mb-6">
            If you have any questions about this Privacy Policy or our data
            practices, please contact our privacy team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:privacy@workcontextai.com"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Email Privacy Team
            </a>
            <Link
              href="/docs"
              className="px-6 py-3 border border-border rounded-lg font-medium text-center text-foreground hover:bg-muted transition-colors"
            >
              Back to Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
