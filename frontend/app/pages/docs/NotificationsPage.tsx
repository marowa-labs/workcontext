"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  Eye,
  Clock,
  User,
  MessageSquare,
  FileText,
  AlertCircle,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const NotificationsPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const notificationTypes = [
    {
      category: "Collaboration",
      notifications: [
        {
          title: "Comments & Mentions",
          description: "When someone comments on your document or mentions you",
          email: true,
          push: true,
          inApp: true,
        },
        {
          title: "Document Updates",
          description: "When collaborators make changes to shared documents",
          email: true,
          push: false,
          inApp: true,
        },
        {
          title: "Invitations",
          description: "When you're invited to collaborate on a project",
          email: true,
          push: true,
          inApp: true,
        },
      ],
    },
    {
      category: "Account",
      notifications: [
        {
          title: "Security Alerts",
          description: "Important security notifications about your account",
          email: true,
          push: true,
          inApp: true,
        },
        {
          title: "Subscription Updates",
          description: "Changes to your subscription or billing",
          email: true,
          push: false,
          inApp: true,
        },
        {
          title: "Profile Changes",
          description: "Updates to your profile or account information",
          email: false,
          push: false,
          inApp: true,
        },
      ],
    },
    {
      category: "Writing & Research",
      notifications: [
        {
          title: "AI Suggestions",
          description: "When AI has new suggestions for your writing",
          email: false,
          push: false,
          inApp: true,
        },
        {
          title: "Plagiarism Results",
          description: "When plagiarism checks are complete",
          email: true,
          push: false,
          inApp: true,
        },
        {
          title: "Citation Updates",
          description: "When citations need attention or updates",
          email: false,
          push: false,
          inApp: true,
        },
      ],
    },
  ];

  const channels = [
    {
      name: "Email",
      icon: <Mail className="h-5 w-5 text-blue-600" />,
      description: "Receive notifications via email",
    },
    {
      name: "Push Notifications",
      icon: <Smartphone className="h-5 w-5 text-green-600" />,
      description: "Get alerts on your mobile device",
    },
    {
      name: "In-App Notifications",
      icon: <Bell className="h-5 w-5 text-purple-600" />,
      description: "See notifications within the application",
    },
  ];

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white mb-8">
        <div className="container-custom py-6">
          <Link
            href="/docs"
            className={`inline-flex items-center ${planDocLinkClasses} mb-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Link>
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
              Notifications
            </h1>
            <p className="text-lg text-black dark:text-black">
              Customize how and when you receive notifications from ScholarForge
              AI
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1 mb-4 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">Stay Informed</h2>
            <p className="opacity-90">
              Control your notification preferences to stay updated without
              being overwhelmed
            </p>
          </div>
          <div className="flex space-x-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <Bell className="h-6 w-6" />
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Mail className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Notification Settings
          </h2>
          <div className="space-y-8">
            {notificationTypes.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3
                  className={`text-xl font-semibold mb-4 ${planDocHeadingClasses}`}>
                  {category.category}
                </h3>
                <div className="space-y-4">
                  {category.notifications.map((notification, index) => (
                    <div key={index} className={`${planCardClasses} p-5`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4
                            className={`font-semibold ${planDocHeadingClasses}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-black mt-1 dark:text-black">
                            {notification.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked={notification.email}
                            className="h-4 w-4 text-blue-600 rounded dark:bg-white border-white"
                          />
                          <span className="ml-2 text-sm text-black dark:text-black">
                            Email
                          </span>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked={notification.push}
                            className="h-4 w-4 text-blue-600 rounded dark:bg-white border-white"
                          />
                          <span className="ml-2 text-sm text-black dark:text-black">
                            Push
                          </span>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked={notification.inApp}
                            className="h-4 w-4 text-blue-600 rounded dark:bg-white border-white"
                          />
                          <span className="ml-2 text-sm text-black dark:text-black">
                            In-App
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Notification Channels
          </h2>
          <div className="space-y-4">
            {channels.map((channel, index) => (
              <div key={index} className={`${planCardClasses} p-5`}>
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 mr-3">{channel.icon}</div>
                  <h3
                    className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                    {channel.name}
                  </h3>
                </div>
                <p className="text-black text-sm dark:text-black">
                  {channel.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-5 dark:bg-purple-900/20 border-white-800">
            <h3
              className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
              Notification Frequency
            </h3>
            <p className="text-purple-800 text-sm mb-4 dark:text-purple-200">
              Choose how often you receive notifications: immediately, daily
              digest, or weekly summary.
            </p>
            <select className="w-full px-3 py-2 border border-white rounded-md text-sm dark:bg-white border-white text-black">
              <option>Immediate</option>
              <option>Daily Digest</option>
              <option>Weekly Summary</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`${planCardClasses} p-6`}>
        <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
          Managing Notifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3
              className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
              Best Practices
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Eye className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0 dark:text-purple-400" />
                <span className="text-black dark:text-black">
                  Customize notifications based on your workflow
                </span>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0 dark:text-purple-400" />
                <span className="text-black dark:text-black">
                  Use digest options to reduce email frequency
                </span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0 dark:text-purple-400" />
                <span className="text-black dark:text-black">
                  Keep critical notifications enabled for security
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h3
              className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
              Troubleshooting
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <User className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0 dark:text-purple-400" />
                <span className="text-black dark:text-black">
                  Check device notification settings
                </span>
              </li>
              <li className="flex items-start">
                <MessageSquare className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0 dark:text-purple-400" />
                <span className="text-black dark:text-black">
                  Verify email address in account settings
                </span>
              </li>
              <li className="flex items-start">
                <FileText className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0 dark:text-purple-400" />
                <span className="text-black dark:text-black">
                  <Link
                    href="/docs/contact-support"
                    className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                    Contact support
                  </Link>{" "}
                  for notification issues
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
