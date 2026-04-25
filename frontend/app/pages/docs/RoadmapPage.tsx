"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Calendar,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const RoadmapPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const [votedFeatures, setVotedFeatures] = useState<string[]>([]);

  const handleVote = (featureId: string) => {
    if (votedFeatures.includes(featureId)) {
      setVotedFeatures(votedFeatures.filter((id) => id !== featureId));
    } else {
      setVotedFeatures([...votedFeatures, featureId]);
    }
  };

  const roadmapFeatures = [
    {
      id: "advanced-analytics",
      title: "Advanced Analytics Dashboard",
      description:
        "Track your writing progress, productivity trends, and improvement over time",
      status: "in-progress",
      progress: 75,
      expectedLaunch: "Q1 2025",
      votes: 456,
      category: "Productivity",
      features: [
        "Writing velocity tracking",
        "Productivity insights",
        "Quality metrics",
        "Goal setting",
      ],
    },
    {
      id: "templates-marketplace",
      title: "Templates Marketplace",
      description:
        "Browse thousands of templates for research papers, essays, and more",
      status: "planned",
      progress: 10,
      expectedLaunch: "Q1 2025",
      votes: 1234,
      category: "Content",
      features: [
        "Template library",
        "Free and premium options",
        "Community submissions",
        "Custom template creation",
      ],
    },
    {
      id: "study-groups",
      title: "Study Groups",
      description:
        "Create study groups, share notes, and collaborate with classmates",
      status: "planned",
      progress: 5,
      expectedLaunch: "Q2 2025",
      votes: 678,
      category: "Collaboration",
      features: [
        "Group scheduling",
        "Shared note libraries",
        "Group chat",
        "Task assignments",
      ],
    },
    {
      id: "mobile-apps",
      title: "Mobile Apps",
      description: "Native iOS and Android apps for writing on the go",
      status: "consideration",
      progress: 0,
      expectedLaunch: "Q2 2025",
      votes: 2156,
      category: "Platform",
      features: [
        "Native iOS app",
        "Native Android app",
        "Offline editing",
        "Push notifications",
      ],
    },
    {
      id: "advanced-ai",
      title: "Advanced AI Features",
      description: "More sophisticated AI writing and research tools",
      status: "consideration",
      progress: 0,
      expectedLaunch: "Q2 2025",
      votes: 1843,
      category: "AI Features",
      features: [
        "AI outline generator",
        "Research question generator",
        "Hypothesis formulation",
        "Methodology suggestions",
      ],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            In Progress
          </span>
        );
      case "planned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            Planned
          </span>
        );
      case "consideration":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black dark:bg-white dark:text-black">
            Under Consideration
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black dark:bg-white dark:text-black">
            {status}
          </span>
        );
    }
  };

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/docs"
          className={`inline-flex items-center ${planDocLinkClasses}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>
      <div className="text-center">
        <h1
          className={`text-3xl md:text-4xl font-bold mb-4 ${planDocHeadingClasses}`}>
          Product Roadmap
        </h1>
        <p className="text-xl text-black max-w-3xl dark:text-black">
          See what we're working on, what's coming next, and help us prioritize
          upcoming features by voting on what matters most to you.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className={`${planCardClasses} rounded-xl p-6 text-center`}>
          <div className="text-3xl font-bold text-black mb-1 text-black">
            2,341
          </div>
          <div className="text-black dark:text-black">
            Community Members
          </div>
        </div>
        <div className={`${planCardClasses} rounded-xl p-6 text-center`}>
          <div className="text-3xl font-bold text-black mb-1 text-black">
            12
          </div>
          <div className="text-black dark:text-black">
            Features Building
          </div>
        </div>
        <div className={`${planCardClasses} rounded-xl p-6 text-center`}>
          <div className="text-3xl font-bold text-black mb-1 text-black">
            45
          </div>
          <div className="text-black dark:text-black">
            Feature Requests
          </div>
        </div>
        <div className={`${planCardClasses} rounded-xl p-6 text-center`}>
          <div className="text-3xl font-bold text-black mb-1 text-black">
            89%
          </div>
          <div className="text-black dark:text-black">
            Satisfaction Rate
          </div>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="mb-8">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Upcoming Features
        </h2>

        <div className="space-y-6">
          {roadmapFeatures.map((feature) => (
            <div
              key={feature.id}
              className={`${planCardClasses} rounded-xl p-6`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      className={`text-xl font-semibold ${planDocHeadingClasses}`}>
                      {feature.title}
                    </h3>
                    {getStatusBadge(feature.status)}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {feature.category}
                    </span>
                  </div>
                  <p className="text-black dark:text-black">
                    {feature.description}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center text-sm text-black dark:text-black">
                    <Users className="h-4 w-4 mr-1" />
                    {feature.votes} votes
                  </div>
                  <button
                    onClick={() => handleVote(feature.id)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                      votedFeatures.includes(feature.id)
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-white dark:text-black dark:hover:bg-white"
                    }`}>
                    <Star
                      className={`h-4 w-4 mr-2 ${votedFeatures.includes(feature.id) ? "fill-current" : ""}`}
                    />
                    {votedFeatures.includes(feature.id) ? "Voted" : "Vote"}
                  </button>
                </div>
              </div>

              {feature.status === "in-progress" && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-black mb-1 dark:text-black">
                    <span>Progress</span>
                    <span>{feature.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-white">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${feature.progress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center text-sm text-black dark:text-black">
                  <Calendar className="h-4 w-4 mr-1" />
                  Expected: {feature.expectedLaunch}
                </div>

                <div className="flex flex-wrap gap-2">
                  {feature.features.slice(0, 3).map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-black dark:bg-white dark:text-black">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      {item}
                    </span>
                  ))}
                  {feature.features.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-black dark:bg-white dark:text-black">
                      +{feature.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request Feature */}
      <div className="bg-white dark:bg-white border-b border-white border-white rounded-xl p-8 mb-12 dark:bg-blue-900/20 border-white-800">
        <div className="text-center max-w-2xl mx-auto">
          <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Have an idea?
          </h2>
          <p className="text-black mb-6 dark:text-black">
            Don't see what you're looking for? Tell us about the features you'd
            like to see in ScholarForge AI.
          </p>
          <Link
            href="/docs/feature-request"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
            Request a Feature
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Beta Program */}
      <div className={`${planCardClasses} rounded-xl p-8`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-2 ${planDocHeadingClasses}`}>
              Beta Program
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Get early access to new features and help shape the future of
              ScholarForge AI. Beta testers get priority access and direct input
              on feature development.
            </p>
            <Link
              href="/docs/beta-program"
              className={`hover:text-blue-700 font-medium ${planDocLinkClasses}`}>
              Learn more about the Beta Program
            </Link>
          </div>
          <div>
            <Link
              href="/docs/beta-program"
              className="inline-flex items-center px-4 py-2 border border-white rounded-lg text-black hover:bg-gray-50 font-medium border-white dark:text-black dark:hover:bg-white">
              Join Beta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;
