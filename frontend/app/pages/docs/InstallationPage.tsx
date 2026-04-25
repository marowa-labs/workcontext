"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Shield,
  RefreshCw,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const InstallationPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const platforms = [
    {
      icon: <Monitor className="h-8 w-8 text-blue-600" />,
      title: "Desktop",
      description: "Windows, macOS, and Linux applications",
      link: "#desktop",
    },
    {
      icon: <Smartphone className="h-8 w-8 text-green-600" />,
      title: "Mobile",
      description: "iOS and Android apps",
      link: "#mobile",
    },
    {
      icon: <Tablet className="h-8 w-8 text-purple-600" />,
      title: "Tablet",
      description: "Optimized for iPad and Android tablets",
      link: "#tablet",
    },
    {
      icon: <Globe className="h-8 w-8 text-orange-600" />,
      title: "Web Browser",
      description: "Access from any modern browser",
      link: "#web",
    },
  ];

  const requirements = [
    {
      category: "Minimum Requirements",
      items: [
        "Modern web browser (Chrome, Firefox, Safari, Edge)",
        "Stable internet connection",
        "JavaScript enabled",
        "100MB available storage space",
      ],
    },
    {
      category: "Recommended Requirements",
      items: [
        "Latest browser version",
        "High-speed internet connection",
        "500MB available storage space",
        "Active subscription for premium features",
      ],
    },
  ];

  const steps = [
    {
      title: "Sign Up",
      description: "Create your ScholarForge AIaccount",
      icon: "1",
    },
    {
      title: "Download",
      description: "Get the app for your platform",
      icon: "2",
    },
    {
      title: "Install",
      description: "Follow the installation wizard",
      icon: "3",
    },
    {
      title: "Configure",
      description: "Set up your preferences",
      icon: "4",
    },
    {
      title: "Start Writing",
      description: "Begin your first project",
      icon: "5",
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
              Installation Guide
            </h1>
            <p className="text-lg text-black dark:text-black">
              Install ScholarForge AIon any device for seamless academic writing
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">System Requirements</h2>
              <p className="opacity-90">
                ScholarForge AIworks on all major platforms with minimal system
                requirements
              </p>
            </div>
            <div className="flex space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Monitor className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Tablet className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Globe className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Supported Platforms
            </h2>
            <div className="space-y-4">
              {platforms.map((platform, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">
                      {platform.icon}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {platform.title}
                      </h3>
                      <p className="text-black dark:text-black">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              System Requirements
            </h2>
            <div className="space-y-6">
              {requirements.map((req, index) => (
                <div key={index}>
                  <h3
                    className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                    {req.category}
                  </h3>
                  <ul className="space-y-2">
                    {req.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <Shield className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                        <span className="text-black dark:text-black">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Installation Steps
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white"></div>
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 relative">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 border-2 border-blue-200 text-blue-800 font-bold text-lg z-10 relative dark:bg-blue-900/30 border-white-700 dark:text-blue-300">
                      {step.icon}
                    </div>
                  </div>
                  <div className="ml-6 pb-8">
                    <h3
                      className={`text-xl font-semibold ${planDocHeadingClasses}`}>
                      {step.title}
                    </h3>
                    <p className="mt-2 text-black dark:text-black">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Troubleshooting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Common Issues
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <RefreshCw className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0 dark:text-blue-400" />
                  <span className="text-black dark:text-black">
                    App won't start after installation
                  </span>
                </li>
                <li className="flex items-start">
                  <RefreshCw className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0 dark:text-blue-400" />
                  <span className="text-black dark:text-black">
                    Installation fails or freezes
                  </span>
                </li>
                <li className="flex items-start">
                  <RefreshCw className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0 dark:text-blue-400" />
                  <span className="text-black dark:text-black">
                    Missing features after installation
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Solutions
              </h3>
              <ul className="space-y-2">
                <li className="text-black dark:text-black">
                  Restart your device and try again
                </li>
                <li className="text-black dark:text-black">
                  Check your internet connection
                </li>
                <li className="text-black dark:text-black">
                  <Link
                    href="/docs/contact-support"
                    className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                    Contact support for further assistance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallationPage;
