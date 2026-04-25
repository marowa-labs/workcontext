"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Rocket,
  Zap,
  Star,
  Crown,
  TrendingUp,
  Gift,
  Award,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const UpgradeStylingPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const upgradeBenefits = [
    {
      icon: <Star className="h-8 w-8 text-blue-600" />,
      title: "Premium Components",
      description: "Access to exclusive UI components and styling options",
    },
    {
      icon: <Zap className="h-8 w-8 text-green-600" />,
      title: "Performance Boost",
      description: "Enhanced performance with optimized styling assets",
    },
    {
      icon: <Crown className="h-8 w-8 text-purple-600" />,
      title: "Priority Support",
      description: "Get dedicated assistance with styling implementation",
    },
    {
      icon: <Award className="h-8 w-8 text-orange-600" />,
      title: "Exclusive Themes",
      description: "Premium themes and customization options",
    },
  ];

  const planFeatures = [
    {
      plan: "Free",
      features: [
        "Basic styling options",
        "Standard color themes",
        "Limited component variants",
        "Community support",
      ],
      icon: "🆓",
      isCurrent: false,
    },
    {
      plan: "Pro",
      features: [
        "Advanced styling options",
        "Extended color palettes",
        "Premium components",
        "Priority support",
      ],
      icon: "⭐",
      isCurrent: true,
    },
    {
      plan: "Enterprise",
      features: [
        "Custom styling solutions",
        "White-label options",
        "Dedicated styling consultant",
        "SLA guaranteed",
      ],
      icon: "🏆",
      isCurrent: false,
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
            Upgrade Styling
          </h1>
          <p className="text-lg text-black dark:text-black">
            Enhance your application with premium styling features
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Premium Styling Experience
              </h2>
              <p className="opacity-90">
                Unlock advanced styling capabilities with our paid plans
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <Rocket className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Star className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Crown className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Upgrade Benefits
            </h2>
            <div className="space-y-6">
              {upgradeBenefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {benefit.title}
                      </h3>
                      <p className="mt-1 text-black dark:text-black">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Plan Comparison
            </h2>
            <div className="space-y-4">
              {planFeatures.map((plan, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-5 ${plan.isCurrent ? "border-blue-500 border-2" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{plan.icon}</span>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {plan.plan}
                      </h3>
                    </div>
                    {plan.isCurrent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Current
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-black dark:text-black">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-5 text-white">
              <div className="flex items-center">
                <Gift className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Limited Time Offer
                  </h3>
                  <p className="opacity-90">
                    Upgrade now and get 20% off your first year!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Implementation Guide
          </h2>
          <div className="prose max-w-none dark:prose-invert">
            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              1. Select Your Plan
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Choose the plan that best fits your styling needs and budget.
            </p>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              2. Update Your Configuration
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`// Example configuration for Pro plan
const config = {
  plan: 'pro',
  features: {
    advancedStyling: true,
    premiumThemes: true,
    prioritySupport: true,
    customComponents: false
  }
};`}</code>
            </pre>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              3. Access Premium Components
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Once upgraded, you'll gain access to premium components and
              styling options:
            </p>
            <ul className="list-disc pl-5 mb-4 text-black dark:text-black">
              <li>Advanced color palette generators</li>
              <li>Premium UI component library</li>
              <li>Custom theme builder</li>
              <li>Priority support tickets</li>
            </ul>

            <div className="mt-6">
              <Link
                href="/docs/billing"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                View Billing Options
                <TrendingUp className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeStylingPage;
