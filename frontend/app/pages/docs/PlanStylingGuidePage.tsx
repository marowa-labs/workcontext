"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Palette,
  Eye,
  Code,
  Layers,
  Settings,
  Monitor,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const PlanStylingGuidePage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const stylingConcepts = [
    {
      icon: <Palette className="h-8 w-8 text-blue-600" />,
      title: "Color Themes",
      description: "Customize the color palette for your application",
    },
    {
      icon: <Layers className="h-8 w-8 text-green-600" />,
      title: "Component Layers",
      description: "Structure your UI with layered components",
    },
    {
      icon: <Eye className="h-8 w-8 text-purple-600" />,
      title: "Visual Hierarchy",
      description: "Establish clear visual priorities in your designs",
    },
    {
      icon: <Monitor className="h-8 w-8 text-orange-600" />,
      title: "Responsive Design",
      description: "Ensure your UI works across all device sizes",
    },
  ];

  const implementationSteps = [
    {
      step: "1",
      title: "Define Your Theme",
      description: "Set up your color palette and typography scales",
    },
    {
      step: "2",
      title: "Create Component Variants",
      description: "Build reusable component variations for different contexts",
    },
    {
      step: "3",
      title: "Implement Theme Context",
      description: "Set up context providers for theme management",
    },
    {
      step: "4",
      title: "Apply Styling Classes",
      description: "Use dynamic class names based on user preferences",
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
          <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Plan Styling Guide
          </h1>
          <p className="text-lg text-black dark:text-black">
            Customize the appearance of your application based on user plans
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Dynamic Styling Framework
              </h2>
              <p className="opacity-90">
                Implement plan-based styling that adapts to user preferences
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <Palette className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Settings className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Code className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Styling Concepts
            </h2>
            <div className="space-y-6">
              {stylingConcepts.map((concept, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">
                      {concept.icon}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {concept.title}
                      </h3>
                      <p className="mt-1 text-black dark:text-black">
                        {concept.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Implementation Steps
            </h2>
            <div className="space-y-4">
              {implementationSteps.map((step, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-800 font-bold dark:bg-blue-900/30 dark:text-blue-300">
                        {step.step}
                      </div>
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold mb-1 ${planDocHeadingClasses}`}>
                        {step.title}
                      </h3>
                      <p className="text-black dark:text-black">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 dark:bg-blue-900/20 border-white-800">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Theme Context Hook
              </h3>
              <p className="text-blue-800 mb-4 dark:text-blue-200">
                Use the usePlanStyling hook to access dynamic styling classes
                throughout your application.
              </p>
              <Link
                href="/docs/md/ui-ux-style-contrast"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                View Style Contrast Guide
                <Eye className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Code Examples
          </h2>
          <div className="prose max-w-none dark:prose-invert">
            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              Using the usePlanStyling Hook
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`import { usePlanStyling } from "../hooks/usePlanStyling";

const MyComponent = () => {
  const {
    planCardClasses,
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
  } = usePlanStyling();

  return (
    <div className={planDocContentClasses}>
      <h1 className={planDocHeadingClasses}>
        Dynamic Styling Example
      </h1>
      <div className={planCardClasses}>
        <p className="text-black dark:text-black">
          This component adapts its styling based on user preferences.
        </p>
        <a href="#" className={planDocLinkClasses}>
          Styled Link
        </a>
      </div>
    </div>
  );
};`}</code>
            </pre>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              Customizing Theme Settings
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`// Example theme configuration
const themeConfig = {
  light: {
    card: "bg-white border border-white rounded-lg",
    content: "bg-gray-50 text-black",
    heading: "text-black",
    link: "text-blue-600 hover:text-blue-800"
  },
  dark: {
    card: "bg-white border border-white rounded-lg",
    content: "bg-[#0A0A0A] text-white",
    heading: "text-white",
    link: "text-blue-400 hover:text-blue-300"
  }
};`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanStylingGuidePage;
