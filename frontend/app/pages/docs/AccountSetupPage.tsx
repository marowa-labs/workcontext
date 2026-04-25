"use client";

import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  GraduationCap,
  BookOpen,
  Bell,
  CreditCard,
  Shield,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const AccountSetupPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const setupSteps = [
    {
      id: 1,
      title: "Create Your Account",
      description: "Sign up with email or social login",
      icon: <User className="h-6 w-6 text-blue-600" />,
      completed: true,
    },
    {
      id: 2,
      title: "Verify Your Email",
      description: "Confirm your email address for security",
      icon: <Mail className="h-6 w-6 text-blue-600" />,
      completed: true,
    },
    {
      id: 3,
      title: "Complete Profile",
      description: "Add academic information and preferences",
      icon: <GraduationCap className="h-6 w-6 text-blue-600" />,
      completed: false,
    },
    {
      id: 4,
      title: "Set Preferences",
      description: "Configure notification and writing settings",
      icon: <Bell className="h-6 w-6 text-blue-600" />,
      completed: false,
    },
    {
      id: 5,
      title: "Secure Your Account",
      description: "Enable two-factor authentication",
      icon: <Lock className="h-6 w-6 text-blue-600" />,
      completed: false,
    },
  ];

  const profileSections = [
    {
      icon: <GraduationCap className="h-6 w-6 text-green-600" />,
      title: "Academic Information",
      fields: [
        "Institution",
        "Academic Level",
        "Field of Study",
        "Graduation Year",
      ],
    },
    {
      icon: <BookOpen className="h-6 w-6 text-purple-600" />,
      title: "Writing Preferences",
      fields: [
        "Preferred Citation Style",
        "Document Types",
        "Writing Goals",
        "Language Preferences",
      ],
    },
    {
      icon: <Bell className="h-6 w-6 text-orange-600" />,
      title: "Notification Settings",
      fields: [
        "Email Notifications",
        "Push Notifications",
        "Collaboration Alerts",
        "System Updates",
      ],
    },
  ];

  const securityOptions = [
    {
      icon: <Lock className="h-6 w-6 text-red-600" />,
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      status: "Recommended",
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-600" />,
      title: "Password Requirements",
      description: "Use a strong, unique password for your account",
      status: "Essential",
    },
    {
      icon: <CreditCard className="h-6 w-6 text-green-600" />,
      title: "Payment Methods",
      description: "Securely store payment information for subscriptions",
      status: "Optional",
    },
  ];

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom py-6">
          <Link
            href="/docs"
            className={`inline-flex items-center ${planDocLinkClasses} mb-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Link>
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
              Account Setup
            </h1>
            <p className="text-lg text-black dark:text-black">
              Configure your ScholarForge AIaccount for optimal academic writing
              experience
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 dark:bg-blue-900/20 border-white-800">
          <h2 className={`text-xl font-semibold mb-3 ${planDocHeadingClasses}`}>
            Account Setup Progress
          </h2>
          <div className="space-y-4">
            {setupSteps.map((step) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${step.completed ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-white"}`}>
                  {step.completed ? (
                    <svg
                      className="h-6 w-6 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="ml-4">
                  <h3
                    className={`text-lg font-medium ${step.completed ? "text-green-800 dark:text-green-300" : "text-black text-black"}`}>
                    {step.title}
                  </h3>
                  <p
                    className={`text-sm ${step.completed ? "text-green-700 dark:text-green-400" : "text-black dark:text-black"}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Profile Configuration
            </h2>
            <div className="space-y-6">
              {profileSections.map((section, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 mr-3">{section.icon}</div>
                    <h3
                      className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                      {section.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {section.fields.map((field, fieldIndex) => (
                      <li key={fieldIndex} className="flex items-center">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-black dark:text-black">
                          {field}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Security & Privacy
            </h2>
            <div className="space-y-6">
              {securityOptions.map((option, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">{option.icon}</div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3
                          className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                          {option.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {option.status}
                        </span>
                      </div>
                      <p className="mt-2 text-black dark:text-black">
                        {option.description}
                      </p>
                      <div className="mt-4">
                        <button
                          className={`font-medium text-sm ${planDocLinkClasses}`}>
                          Configure Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-5 dark:bg-yellow-900/20 border-white-800">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Privacy Notice
              </h3>
              <p className="text-yellow-700 mb-3 dark:text-yellow-300">
                Your academic work and personal information are protected with
                enterprise-grade security.
              </p>
              <Link href="/docs/privacy" className={planDocLinkClasses}>
                Learn more about our privacy policy
              </Link>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Need Help?
          </h2>
          <p className="text-black mb-6 dark:text-black">
            If you're having trouble setting up your account, our support team
            is here to help.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/contact-support"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center">
              Contact Support
            </Link>
            <Link
              href="/docs/faq"
              className="px-4 py-2 border border-white text-black rounded-lg hover:bg-gray-50 font-medium text-center border-white dark:text-black dark:hover:bg-white">
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSetupPage;
