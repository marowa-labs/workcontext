"use client";

import Link from "next/link";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";

const TermsPage = () => {
  // Mock plan styling classes
  const planDocContentClasses = {
    container: "prose prose-gray max-w-none dark:prose-invert",
    heading: "text-2xl font-bold text-black text-black mb-4",
    subheading: "text-xl font-semibold text-black dark:text-black mb-3",
    paragraph: "text-black dark:text-black mb-4",
    listItem: "text-black dark:text-black mb-2",
  };

  const planDocHeadingClasses =
    "text-3xl font-bold text-black text-black mb-6";
  const planDocLinkClasses =
    "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline";
  const planCardClasses =
    "bg-white dark:bg-white rounded-lg shadow-md p-6 border border-white border-white";

  return (
    <div className={`min-h-screen ${planDocContentClasses.container}`}>
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/docs"
              className={`text-sm font-medium ${planDocLinkClasses}`}>
              Documentation
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-black"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-black text-sm font-medium ml-1 md:ml-2">
                Terms of Service
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mb-12 dark:bg-blue-900/20 border-white-800">
        <div className="text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1
            className={`text-3xl md:text-4xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Terms of Service
          </h1>
          <p className="text-xl text-black max-w-3xl mx-auto dark:text-black">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Terms Content */}
      <div className="prose prose-lg max-w-none">
        <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            1. Acceptance of Terms
          </h2>
          <p className="text-black mb-4 dark:text-black">
            By accessing or using ScholarForge AI("the Service"), you agree to
            be bound by these Terms of Service ("Terms"). If you disagree with
            any part of the terms, you may not access the Service.
          </p>
          <p className="text-black dark:text-black">
            These Terms apply to all visitors, users, and others who access or
            use the Service. By accessing or using the Service, you agree to be
            bound by these Terms. If you disagree with any part of the terms,
            you may not access the Service.
          </p>
        </div>

        <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            2. Description of Service
          </h2>
          <p className="text-black mb-4 dark:text-black">
            ScholarForge AIis an academic writing and research platform that
            provides tools for:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-black dark:text-black">
                AI-powered writing assistance
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Plagiarism detection and prevention
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Citation management and formatting
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Collaborative research tools
              </span>
            </li>
          </ul>
          <p className="text-black dark:text-black">
            The Service is offered subject to your acceptance without
            modification of all the terms and conditions contained herein and
            all other operating rules, policies, and procedures that may be
            published from time to time.
          </p>
        </div>

        <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            3. Account Terms
          </h2>
          <div className="space-y-4">
            <div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                3.1 Account Registration
              </h3>
              <p className="text-black dark:text-black">
                You must register for an account to access certain features of
                the Service. You agree to provide accurate, current, and
                complete information during registration.
              </p>
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                3.2 Account Security
              </h3>
              <p className="text-black dark:text-black">
                You are responsible for maintaining the security of your account
                and password. You are fully responsible for all activities that
                occur under your account.
              </p>
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                3.3 Account Restrictions
              </h3>
              <p className="text-black dark:text-black">
                You may not use the Service for any illegal or unauthorized
                purpose. You may not, in the use of the Service, violate any
                laws in your jurisdiction.
              </p>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            4. Intellectual Property
          </h2>
          <p className="text-black mb-4 dark:text-black">
            The Service and its original content, features, and functionality
            are and will remain the exclusive property of ScholarForge AIand its
            licensors. The Service is protected by copyright, trademark, and
            other laws of both the United States and foreign countries.
          </p>
          <p className="text-black dark:text-black">
            Our trademarks and trade dress may not be used in connection with
            any product or service without the prior written consent of
            ScholarForge AI.
          </p>
        </div>

        <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            5. Copyright Infringement
          </h2>
          <p className="text-black dark:text-black">
            We respect the intellectual property rights of others. If you
            believe that any content on our Service infringes upon your
            copyrights, please contact us with a detailed notice of the alleged
            infringement.
          </p>
        </div>

        <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            6. Termination
          </h2>
          <p className="text-black dark:text-black">
            We may terminate or suspend access to our Service immediately,
            without prior notice or liability, for any reason whatsoever,
            including without limitation if you breach the Terms.
          </p>
        </div>

        <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            7. Disclaimer of Warranties
          </h2>
          <p className="text-black mb-4 dark:text-black">
            Our Service is provided "as is" and "as available" without any
            warranties of any kind, either express or implied, including but not
            limited to the implied warranties of merchantability, fitness for a
            particular purpose, or non-infringement.
          </p>
          <div className="flex items-start p-4 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 border-white-800">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0 dark:text-yellow-400" />
            <p className="text-yellow-700 dark:text-yellow-300">
              <strong>Important:</strong> We do not warrant that the Service
              will be uninterrupted, timely, secure, or error-free, or that the
              results obtained from the use of the Service will be accurate or
              reliable.
            </p>
          </div>
        </div>

        <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            8. Limitation of Liability
          </h2>
          <p className="text-black dark:text-black">
            In no event shall ScholarForge AI, nor its directors, employees,
            partners, agents, suppliers, or affiliates, be liable for any
            indirect, incidental, special, consequential, or punitive damages,
            including without limitation, loss of profits, data, use, goodwill,
            or other intangible losses, resulting from your access to or use of
            or inability to access or use the Service.
          </p>
        </div>

        <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            9. Governing Law
          </h2>
          <p className="text-black dark:text-black">
            These Terms shall be governed and construed in accordance with the
            laws of the United States, without regard to its conflict of law
            provisions.
          </p>
        </div>

        <div className={`${planCardClasses} rounded-xl shadow-sm p-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            10. Changes to Terms
          </h2>
          <p className="text-black mb-4 dark:text-black">
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material, we will provide
            at least 30 days' notice prior to any new terms taking effect.
          </p>
          <p className="text-black dark:text-black">
            By continuing to access or use our Service after those revisions
            become effective, you agree to be bound by the revised terms.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mt-12 dark:bg-blue-900/20 border-white-800">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className={`text-2xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Have Questions About Our Terms?
          </h2>
          <p className="text-black mb-6 dark:text-black">
            If you have any questions about these Terms of Service, please
            contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs/contact-support"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center">
              Contact Support
            </Link>
            <Link
              href="/docs"
              className={`px-6 py-3 border border-white rounded-lg font-medium text-center ${planDocLinkClasses} hover:underline`}>
              Back to Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
