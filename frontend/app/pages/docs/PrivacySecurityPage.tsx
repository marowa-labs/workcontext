"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Database,
  Key,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const PrivacySecurityPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const securityFeatures = [
    {
      title: "End-to-End Encryption",
      description: "All data is encrypted in transit and at rest",
      icon: <Lock className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      icon: <Key className="h-6 w-6 text-green-600" />,
    },
    {
      title: "Regular Security Audits",
      description: "We conduct frequent security assessments",
      icon: <Shield className="h-6 w-6 text-purple-600" />,
    },
    {
      title: "GDPR Compliance",
      description: "We meet strict European data protection standards",
      icon: <Database className="h-6 w-6 text-orange-600" />,
    },
  ];

  const privacyControls = [
    {
      title: "Data Access",
      description: "Control what data we collect and how we use it",
      icon: <Eye className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "Data Portability",
      description: "Export your data in standard formats anytime",
      icon: <FileText className="h-6 w-6 text-green-600" />,
    },
    {
      title: "Account Deletion",
      description: "Permanently delete your account and data",
      icon: <User className="h-6 w-6 text-purple-600" />,
    },
    {
      title: "Third-Party Sharing",
      description: "Control sharing with integrated services",
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
    },
  ];

  const dataPractices = [
    {
      category: "Data We Collect",
      items: [
        "Account information (name, email, institution)",
        "Usage data (features used, time spent)",
        "Document content (for processing and AI assistance)",
        "Device information (browser, operating system)",
      ],
    },
    {
      category: "How We Use Your Data",
      items: [
        "Provide and improve our services",
        "Personalize your experience",
        "Communicate with you about your account",
        "Conduct research to improve our AI models",
      ],
    },
    {
      category: "Data Protection Measures",
      items: [
        "Encryption of data in transit and at rest",
        "Regular security audits and penetration testing",
        "Strict access controls and monitoring",
        "Employee training on data protection",
      ],
    },
  ];

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      <div className="mb-8">
        <Link
          href="/docs"
          className={`inline-flex items-center ${planDocLinkClasses} mb-4`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
        <div className="text-center">
          <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Privacy & Security
          </h1>
          <p className="text-lg text-black dark:text-black">
            How we protect your data and respect your privacy
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white mb-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1 mb-4 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">Your Privacy Matters</h2>
            <p className="opacity-90">
              We're committed to protecting your academic work and personal
              information
            </p>
          </div>
          <div className="flex space-x-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Lock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Security Features
          </h2>
          <div className="space-y-4">
            {securityFeatures.map((feature, index) => (
              <div key={index} className={`${planCardClasses} p-5`}>
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 mr-3">{feature.icon}</div>
                  <h3
                    className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                    {feature.title}
                  </h3>
                </div>
                <p className="text-black dark:text-black">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Privacy Controls
          </h2>
          <div className="space-y-4">
            {privacyControls.map((control, index) => (
              <div key={index} className={`${planCardClasses} p-5`}>
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 mr-3">{control.icon}</div>
                  <h3
                    className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                    {control.title}
                  </h3>
                </div>
                <p className="text-black dark:text-black">
                  {control.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-5 dark:bg-green-900/20 border-white-800">
            <h3
              className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
              Your Rights
            </h3>
            <p className="text-green-800 dark:text-green-200">
              You have the right to access, correct, or delete your personal
              data. You can also object to or restrict certain processing
              activities.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Data Practices
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dataPractices.map((practice, index) => (
            <div key={index} className={`${planCardClasses} p-5`}>
              <h3
                className={`text-lg font-semibold mb-4 ${planDocHeadingClasses}`}>
                {practice.category}
              </h3>
              <ul className="space-y-2">
                {practice.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                    <span className="text-black text-sm dark:text-black">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={`${planCardClasses} p-6`}>
        <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
          Privacy & Security Tips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3
              className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
              Protect Your Account
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                <span className="text-black dark:text-black">
                  Use a strong, unique password
                </span>
              </li>
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                <span className="text-black dark:text-black">
                  Enable two-factor authentication
                </span>
              </li>
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                <span className="text-black dark:text-black">
                  Regularly review account activity
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h3
              className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
              Manage Your Privacy
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                <span className="text-black dark:text-black">
                  Review and update privacy settings
                </span>
              </li>
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                <span className="text-black dark:text-black">
                  Be mindful of what you share publicly
                </span>
              </li>
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                <span className="text-black dark:text-black">
                  <Link
                    href="/docs/contact-support"
                    className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                    Contact us
                  </Link>{" "}
                  with privacy questions
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySecurityPage;
