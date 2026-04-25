"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  PenTool,
  Brain,
  Lightbulb,
  FileText,
  CheckCircle,
  Crown,
  BookOpen,
  Shield,
} from "lucide-react";

const AIWritingAssistantGuide: React.FC = () => {
  // Mock plan styling classes
  const planDocContentClasses = {
    container: "prose prose-gray max-w-none dark:prose-invert",
    heading: "text-2xl font-bold text-black text-black mb-4",
    subheading: "text-xl font-semibold text-black dark:text-black mb-3",
    paragraph: "text-black dark:text-black mb-4",
    listItem: "text-black dark:text-black mb-2",
  };

  const features = [
    {
      icon: <Sparkles className="h-8 w-8 text-blue-600" />,
      title: "Content Generation",
      description: "Generate high-quality academic content with AI assistance",
    },
    {
      icon: <Zap className="h-8 w-8 text-green-600" />,
      title: "Real-time Suggestions",
      description: "Get instant writing suggestions as you type",
    },
    {
      icon: <PenTool className="h-8 w-8 text-purple-600" />,
      title: "Style Enhancement",
      description: "Improve clarity, coherence, and academic tone",
    },
    {
      icon: <Brain className="h-8 w-8 text-orange-600" />,
      title: "Research Integration",
      description: "Incorporate relevant research directly into your writing",
    },
  ];

  const writingModes = [
    {
      title: "Draft Mode",
      description: "Generate initial content and ideas",
      level: "Beginner",
      icon: <Lightbulb className="h-6 w-6 text-yellow-600" />,
    },
    {
      title: "Refinement Mode",
      description: "Enhance existing content for clarity and flow",
      level: "Intermediate",
      icon: <FileText className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "Academic Mode",
      description: "Ensure proper academic tone and structure",
      level: "Advanced",
      icon: <Crown className="h-6 w-6 text-purple-600" />,
    },
  ];

  const planFeatures = [
    {
      plan: "Free",
      icon: <BookOpen className="h-5 w-5 text-black" />,
      features: [
        "Basic text editor",
        "10 AI improvements per month",
        "Simple floating AI button",
        "Grammar & style check",
        "Limited customization",
      ],
      limitations: [
        "No side panel",
        "Limited AI requests",
        "No advanced features",
      ],
    },
    {
      plan: "Student Pro",
      icon: <Sparkles className="h-5 w-5 text-blue-600" />,
      features: [
        "Split-pane layout",
        "Right-side AI Assistant panel",
        "AI Suggestions in context",
        "Tone selector (Formal/Academic/Concise)",
        "Progress ribbon with clarity metrics",
        "1000 AI requests per month",
      ],
      limitations: ["Limited to Student features", "No premium AI models"],
    },
    {
      plan: "Researcher",
      icon: <Crown className="h-5 w-5 text-purple-600" />,
      features: [
        "Multi-tab editor (Writing/References/Originality/AI Chat)",
        "Inline citation generator",
        "AI 'Explain this section' & 'Summarize my paragraph'",
        "Comparison mode: Before vs. After AI Edit",
        "Premium AI models",
        "Unlimited AI requests",
        "Advanced writing analytics",
      ],
      limitations: [],
    },
  ];

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom py-6">
          <Link
            href="/docs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-black text-black mb-2">
              AI Writing Assistant
            </h1>
            <p className="text-lg text-black dark:text-black">
              Harness the power of AI to enhance your academic writing process
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Transform Your Writing
              </h2>
              <p className="opacity-90">
                Our AI Writing Assistant helps you write better, faster, and
                more confidently
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <PenTool className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-bold text-black text-black mb-6">
              Key Features
            </h2>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-black text-black">
                      {feature.title}
                    </h3>
                    <p className="text-black dark:text-black">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black text-black mb-6">
              Writing Modes
            </h2>
            <div className="space-y-4">
              {writingModes.map((mode, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-white rounded-lg border border-white border-white p-4">
                  <div className="flex items-center">
                    {mode.icon}
                    <div className="ml-3">
                      <h3 className="font-semibold text-black text-black">
                        {mode.title}
                      </h3>
                      <p className="text-sm text-black dark:text-black">
                        {mode.level}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-black dark:text-black">
                    {mode.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black text-black mb-6">
            Plan-Specific Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planFeatures.map((plan, index) => (
              <div
                key={index}
                className="bg-white dark:bg-white rounded-lg border border-white border-white p-6">
                <div className="flex items-center mb-4">
                  {plan.icon}
                  <h3 className="ml-2 text-xl font-bold text-black text-black">
                    {plan.plan} Plan
                  </h3>
                </div>
                <div className="mb-4">
                  <h4 className="font-semibold text-black text-black mb-2">
                    Included Features:
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0 mr-2" />
                        <span className="text-black dark:text-black">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-black text-black mb-2">
                      Limitations:
                    </h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="flex items-start">
                          <Shield className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0 mr-2" />
                          <span className="text-black dark:text-black">
                            {limitation}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-white rounded-lg border border-white border-white p-6 mb-8">
          <h2 className="text-2xl font-bold text-black text-black mb-4">
            Getting Started
          </h2>
          <div className="prose prose-lg text-black dark:text-black max-w-none">
            <h3>Accessing the AI Writing Assistant</h3>
            <ol>
              <li>Open any document in the editor</li>
              <li>
                For Free users: Look for the floating AI button in the
                bottom-right corner
              </li>
              <li>
                For Student Pro and Researcher users: The AI Assistant panel
                appears on the left side
              </li>
              <li>Select text you want to improve</li>
              <li>
                Click the AI button or use the panel tools to get suggestions
              </li>
            </ol>

            <h3>Using AI Features</h3>
            <ul>
              <li>
                <strong>Improve Writing:</strong> Enhances clarity, tone, and
                flow
              </li>
              <li>
                <strong>Grammar Check:</strong> Identifies and fixes grammatical
                errors
              </li>
              <li>
                <strong>Simplify Text:</strong> Makes complex sentences easier
                to understand
              </li>
              <li>
                <strong>Expand Text:</strong> Adds more detail and depth to your
                content
              </li>
              <li>
                <strong>Summarize:</strong> Creates concise summaries of longer
                passages
              </li>
            </ul>

            <h3>Best Practices</h3>
            <ul>
              <li>Always review AI suggestions before applying them</li>
              <li>
                Use the tone selector to match your academic field's conventions
              </li>
              <li>
                Take advantage of the clarity metrics to track improvement
              </li>
              <li>Combine multiple AI tools for the best results</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/docs"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <BookOpen className="h-5 w-5 mr-2" />
            View All Documentation
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AIWritingAssistantGuide;
