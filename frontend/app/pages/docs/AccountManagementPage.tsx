"use client";

import Link from "next/link";
import {
  ArrowLeft,
  User,
  CreditCard,
  Bell,
  Shield,
  Trash2,
  Key,
  Globe,
} from "lucide-react";

const AccountManagementPage = () => {
  // Mock plan styling classes
  const planDocContentClasses = {
    container: "prose prose-gray max-w-none dark:prose-invert",
    heading: "text-2xl font-bold text-black text-black mb-4",
    subheading: "text-xl font-semibold text-black dark:text-black mb-3",
    paragraph: "text-black dark:text-black mb-4",
    listItem: "text-black dark:text-black mb-2",
  };

  const planDocHeadingClasses = "text-3xl font-bold text-black text-black mb-6";
  const planDocLinkClasses =
    "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline";
  const planCardClasses =
    "bg-white dark:bg-white rounded-lg shadow-md p-6 border border-white border-white";

  const accountSections = [
    {
      title: "Account Information",
      description: "Manage your personal account details",
      icon: <User className="h-6 w-6 text-blue-600" />,
      settings: [
        "Email Address",
        "Password",
        "Phone Number",
        "Academic Information",
        "Profile Settings",
      ],
    },
    {
      title: "Security Settings",
      description: "Protect your account and data",
      icon: <Shield className="h-6 w-6 text-green-600" />,
      settings: [
        "Two-Factor Authentication",
        "Login History",
        "Active Sessions",
        "Security Alerts",
      ],
    },
    {
      title: "Notification Preferences",
      description: "Control how and when you receive notifications",
      icon: <Bell className="h-6 w-6 text-purple-600" />,
      settings: [
        "Email Notifications",
        "Push Notifications",
        "Collaboration Alerts",
        "System Updates",
      ],
    },
    {
      title: "Billing & Subscription",
      description: "Manage your payment methods and subscription",
      icon: <CreditCard className="h-6 w-6 text-orange-600" />,
      settings: [
        "Payment Methods",
        "Subscription Plan",
        "Billing History",
        "Invoices",
      ],
    },
  ];

  const securityFeatures = [
    {
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      status: "Recommended",
      icon: <Shield className="h-5 w-5 text-green-600" />,
    },
    {
      title: "Password Requirements",
      description: "Use a strong, unique password for your account",
      status: "Essential",
      icon: <Key className="h-5 w-5 text-blue-600" />,
    },
    {
      title: "Session Management",
      description: "Review and manage active sessions",
      status: "Available",
      icon: <Globe className="h-5 w-5 text-purple-600" />,
    },
  ];

  const handleDeleteAccount = () => {
    window.location.href = "settings/account";
  };

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
              Account Management
            </h1>
            <p className="text-lg text-black dark:text-black">
              Control all aspects of your ScholarForge AIaccount settings
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Secure Account Management
              </h2>
              <p className="opacity-90">
                Everything you need to keep your account secure and personalized
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <User className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Account Sections
            </h2>
            <div className="space-y-6">
              {accountSections.map((section, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 mr-3">{section.icon}</div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {section.title}
                      </h3>
                      <p className="text-sm text-black dark:text-black">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {section.settings.map((setting, settingIndex) => (
                      <li key={settingIndex} className="flex items-center">
                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-black dark:text-black">
                          {setting}
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
              Security Features
            </h2>
            <div className="space-y-4">
              {securityFeatures.map((feature, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3
                          className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                          {feature.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {feature.status}
                        </span>
                      </div>
                      <p className="mt-2 text-black dark:text-black">
                        {feature.description}
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

            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-5 dark:bg-red-900/20 border-white-800">
              <div className="flex items-center mb-3">
                <Trash2 className="h-6 w-6 text-red-600 mr-3" />
                <h3
                  className={`text-lg font-semibold text-red-900 dark:text-red-100 ${planDocHeadingClasses}`}>
                  Account Deletion
                </h3>
              </div>
              <p className="text-red-800 mb-4 dark:text-red-200">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Account Management Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Security Best Practices
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2"></div>
                  <span className="text-black dark:text-black">
                    Enable two-factor authentication
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2"></div>
                  <span className="text-black dark:text-black">
                    Use a strong, unique password
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2"></div>
                  <span className="text-black dark:text-black">
                    Regularly review account activity
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2"></div>
                  <span className="text-black dark:text-black">
                    Sign out from all devices when needed
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Privacy Controls
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2"></div>
                  <span className="text-black dark:text-black">
                    Review and update privacy settings
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2"></div>
                  <span className="text-black dark:text-black">
                    Manage data sharing preferences
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2"></div>
                  <span className="text-black dark:text-black">
                    Export your data anytime
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2"></div>
                  <span className="text-black dark:text-black">
                    <Link href="/docs/privacy" className={planDocLinkClasses}>
                      Understand our privacy policy
                    </Link>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManagementPage;
