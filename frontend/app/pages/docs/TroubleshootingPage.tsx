"use client";

import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Wifi,
  HardDrive,
  Zap,
  Smartphone,
  Monitor,
  HelpCircle,
  Mail,
} from "lucide-react";

const TroubleshootingPage = () => {
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

  const commonIssues = [
    {
      category: "Login & Account Issues",
      icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
      issues: [
        {
          title: "Can't log in to my account",
          description: "Troubleshoot login problems and account access issues",
          solutions: [
            "Check that you're using the correct email and password",
            "Try resetting your password using the 'Forgot Password' link",
            "Clear your browser cache and cookies",
            "Try logging in from an incognito/private browser window",
          ],
        },
        {
          title: "Not receiving verification emails",
          description: "Solutions for missing account verification emails",
          solutions: [
            "Check your spam/junk folder",
            "Add noreply@scholarforgeai.com to your contacts",
            "Request a new verification email from the login page",
            "Verify that you entered the correct email address",
          ],
        },
      ],
    },
    {
      category: "Performance Issues",
      icon: <Zap className="h-6 w-6 text-orange-600" />,
      issues: [
        {
          title: "App is running slowly",
          description: "Improve the performance of ScholarForge AI",
          solutions: [
            "Check your internet connection speed",
            "Close other applications to free up system resources",
            "Clear your browser cache",
            "Try using a different browser",
            "Restart your device",
          ],
        },
        {
          title: "Document loading is slow",
          description: "Fix slow document loading times",
          solutions: [
            "Check your internet connection",
            "Try refreshing the page",
            "Break large documents into smaller sections",
            "Close other documents you're not actively using",
            "Try accessing the document at a different time",
          ],
        },
      ],
    },
    {
      category: "Technical Issues",
      icon: <HardDrive className="h-6 w-6 text-blue-600" />,
      issues: [
        {
          title: "Features not working properly",
          description: "Troubleshoot malfunctioning features",
          solutions: [
            "Ensure you're using the latest version of your browser",
            "Disable browser extensions that might interfere",
            "Clear your browser cache and cookies",
            "Try using ScholarForge AIin incognito/private mode",
            "Check if the feature is available in your subscription plan",
          ],
        },
        {
          title: "Sync issues with collaboration",
          description: "Fix problems with real-time collaboration",
          solutions: [
            "Check that all collaborators have stable internet connections",
            "Refresh the document page",
            "Ensure all users are using compatible browsers",
            "Check that document permissions are set correctly",
            "Try closing and reopening the document",
          ],
        },
      ],
    },
  ];

  const deviceSpecific = [
    {
      device: "Mobile Devices",
      icon: <Smartphone className="h-6 w-6 text-green-600" />,
      issues: [
        {
          title: "App crashing on mobile",
          solutions: [
            "Restart your device",
            "Update the ScholarForge AIapp to the latest version",
            "Update your device's operating system",
            "Clear the app's cache in your device settings",
            "Reinstall the app if problems persist",
          ],
        },
        {
          title: "Touch interface not responding",
          solutions: [
            "Clean your screen to remove dirt or smudges",
            "Check for physical screen damage",
            "Restart the app",
            "Try using the web version in your mobile browser",
          ],
        },
      ],
    },
    {
      device: "Desktop Computers",
      icon: <Monitor className="h-6 w-6 text-purple-600" />,
      issues: [
        {
          title: "Installation problems",
          solutions: [
            "Ensure your system meets the minimum requirements",
            "Run the installer as an administrator",
            "Disable antivirus software temporarily during installation",
            "Download the installer again if the file seems corrupted",
          ],
        },
        {
          title: "Keyboard shortcuts not working",
          solutions: [
            "Check that you're using the correct keyboard shortcuts",
            "Ensure no other applications are intercepting the shortcuts",
            "Restart the application",
            "Check your keyboard language settings",
          ],
        },
      ],
    },
  ];

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      <div className="mb-8">
        <Link
          href="/docs"
          className={`inline-flex items-center mb-4 ${planDocLinkClasses}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
        <div className="text-center">
          <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Troubleshooting
          </h1>
          <p className="text-lg text-black dark:text-black">
            Solutions to common issues and problems you might encounter
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white mb-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1 mb-4 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">
              Having Technical Issues?
            </h2>
            <p className="opacity-90">
              Find solutions to common problems or get help from our support
              team
            </p>
          </div>
          <div className="flex space-x-2">
            <div className="bg-white/20 p-3 rounded-lg">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Wifi className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Common Issues & Solutions
        </h2>
        <div className="space-y-8">
          {commonIssues.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mr-3">{category.icon}</div>
                <h3
                  className={`text-xl font-semibold ${planDocHeadingClasses}`}>
                  {category.category}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {category.issues.map((issue, issueIndex) => (
                  <div
                    key={issueIndex}
                    className={`${planCardClasses} rounded-lg p-5`}>
                    <h4
                      className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                      {issue.title}
                    </h4>
                    <p className="text-black text-sm mb-4 dark:text-black">
                      {issue.description}
                    </p>
                    <div className="space-y-2">
                      {issue.solutions.map((solution, solutionIndex) => (
                        <div key={solutionIndex} className="flex items-start">
                          <div className="h-1.5 w-1.5 bg-orange-500 rounded-full mr-3 mt-2"></div>
                          <span className="text-black text-sm dark:text-black">
                            {solution}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Device-Specific Troubleshooting
        </h2>
        <div className="space-y-8">
          {deviceSpecific.map((device, deviceIndex) => (
            <div key={deviceIndex}>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mr-3">{device.icon}</div>
                <h3
                  className={`text-xl font-semibold ${planDocHeadingClasses}`}>
                  {device.device}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {device.issues.map((issue, issueIndex) => (
                  <div
                    key={issueIndex}
                    className={`${planCardClasses} rounded-lg p-5`}>
                    <h4
                      className={`font-semibold mb-4 ${planDocHeadingClasses}`}>
                      {issue.title}
                    </h4>
                    <div className="space-y-2">
                      {issue.solutions.map((solution, solutionIndex) => (
                        <div key={solutionIndex} className="flex items-start">
                          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mr-3 mt-2"></div>
                          <span className="text-black text-sm dark:text-black">
                            {solution}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${planCardClasses} rounded-xl p-6`}>
        <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
          General Troubleshooting Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3
              className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
              Before Contacting Support
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <RefreshCw className="h-5 w-5 text-black mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  Restart the application or browser
                </span>
              </li>
              <li className="flex items-start">
                <Wifi className="h-5 w-5 text-black mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  Check your internet connection
                </span>
              </li>
              <li className="flex items-start">
                <HardDrive className="h-5 w-5 text-black mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  Clear browser cache and cookies
                </span>
              </li>
              <li className="flex items-start">
                <Zap className="h-5 w-5 text-black mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  Update your browser or app to the latest version
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h3
              className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
              When to Contact Support
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <HelpCircle className="h-5 w-5 text-black mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  Issue persists after trying all troubleshooting steps
                </span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-black mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  You're experiencing data loss or corruption
                </span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-black mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  <Link
                    href="/docs/contact-support"
                    className={`hover:underline ${planDocLinkClasses}`}>
                    Contact support
                  </Link>{" "}
                  for complex technical issues
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingPage;
