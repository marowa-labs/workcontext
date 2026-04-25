"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Contrast,
  Sun,
  Moon,
  Eye,
  Palette,
  Accessibility,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const UiUxStyleContrastPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const contrastPrinciples = [
    {
      icon: <Contrast className="h-8 w-8 text-blue-600" />,
      title: "Color Contrast",
      description: "Ensure sufficient contrast between text and background",
    },
    {
      icon: <Accessibility className="h-8 w-8 text-green-600" />,
      title: "Accessibility Standards",
      description: "Meet WCAG 2.1 AA compliance requirements",
    },
    {
      icon: <Eye className="h-8 w-8 text-purple-600" />,
      title: "Visual Hierarchy",
      description: "Create clear distinction between UI elements",
    },
    {
      icon: <Palette className="h-8 w-8 text-orange-600" />,
      title: "Thematic Consistency",
      description: "Maintain consistent styling across themes",
    },
  ];

  const contrastExamples = [
    {
      title: "Good Contrast",
      description: "Text with sufficient contrast against background",
      example: "bg-white text-black",
      textColor: "text-black",
      bgColor: "bg-white",
    },
    {
      title: "Poor Contrast",
      description: "Text with insufficient contrast against background",
      example: "bg-gray-300 text-black",
      textColor: "text-black",
      bgColor: "bg-gray-300",
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
            UI/UX Style Contrast
          </h1>
          <p className="text-lg text-black dark:text-black">
            Ensuring optimal readability and accessibility in your UI design
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Contrast & Accessibility
              </h2>
              <p className="opacity-90">
                Design interfaces that are readable and accessible to all users
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <Contrast className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Accessibility className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Eye className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Contrast Principles
            </h2>
            <div className="space-y-6">
              {contrastPrinciples.map((principle, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">
                      {principle.icon}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {principle.title}
                      </h3>
                      <p className="mt-1 text-black dark:text-black">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Contrast Examples
            </h2>
            <div className="space-y-4">
              {contrastExamples.map((example, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                    {example.title}
                  </h3>
                  <p className="text-black mb-3 dark:text-black">
                    {example.description}
                  </p>
                  <div
                    className={`${example.bgColor} ${example.textColor} p-4 rounded-lg font-medium`}>
                    Example Text
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 dark:bg-blue-900/20 border-white-800">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Dark Mode Considerations
              </h3>
              <p className="text-blue-800 mb-4 dark:text-blue-200">
                Ensure adequate contrast in both light and dark themes for all
                users.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <Sun className="h-5 w-5 text-yellow-600 mr-2 dark:text-yellow-400" />
                  <span className="text-sm">Light Theme</span>
                </div>
                <div className="flex items-center">
                  <Moon className="h-5 w-5 text-black mr-2 dark:text-black" />
                  <span className="text-sm">Dark Theme</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Implementation Guidelines
          </h2>
          <div className="prose max-w-none dark:prose-invert">
            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              1. Test Color Combinations
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Use automated tools to verify contrast ratios meet accessibility
              standards:
            </p>
            <ul className="list-disc pl-5 mb-4 text-black dark:text-black">
              <li>Minimum 4.5:1 ratio for normal text</li>
              <li>Minimum 3:1 ratio for large text</li>
              <li>Consider user vision impairments</li>
            </ul>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              2. Dynamic Theme Adjustments
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`// Example theme adjustment based on contrast needs
const getContrastSafeColors = (theme) => {
  if (theme === 'dark') {
    return {
      text: 'text-black',
      background: 'bg-white',
      contrastRatio: '>= 4.5:1'
    };
  } else {
    return {
      text: 'text-black',
      background: 'bg-white',
      contrastRatio: '>= 4.5:1'
    };
  }
};`}</code>
            </pre>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              3. User Preference Integration
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Respect user-defined contrast preferences:
            </p>
            <ul className="list-disc pl-5 mb-4 text-black dark:text-black">
              <li>Provide high contrast mode toggle</li>
              <li>Respect system-level contrast preferences</li>
              <li>Allow custom color scheme adjustments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UiUxStyleContrastPage;
