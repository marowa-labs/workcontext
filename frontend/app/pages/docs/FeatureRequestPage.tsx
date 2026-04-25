"use client";

import Link from "next/link";
import {
  MessageCircle,
  Lightbulb,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import feedbackService from "../../lib/utils/feedbackService";
import { useToast } from "../../hooks/use-toast";

// Define the feature request type
interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  votes: number;
  hasVoted?: boolean;
}

const FeatureRequestPage = () => {
  // Mock plan styling classes
  const planDocContentClasses = {
    container: "prose prose-gray max-w-none dark:prose-invert",
    heading: "text-2xl font-bold text-black text-black mb-4",
    subheading: "text-xl font-semibold text-black dark:text-black mb-3",
    paragraph: "text-black dark:text-black mb-4",
    listItem: "text-black dark:text-black mb-2",
  };

  const planDocHeadingClasses =
    "text-3xl font-bold text-black text-black mb-6";
  const planDocLinkClasses =
    "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline";
  const planCardClasses =
    "bg-white dark:bg-white rounded-lg shadow-md p-6 border border-white border-white";

  // State for form data
  const [formData, setFormData] = useState({
    featureTitle: "",
    featureDescription: "",
    useCase: "",
    category: "",
    priority: "",
  });

  const { toast } = useToast();
  // State for submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // State for feature requests
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([
    // Initial static data - will be replaced with dynamic data
    {
      id: "dark-mode",
      title: "Dark Mode",
      description: "Add a dark theme option for better nighttime writing",
      votes: 1245,
    },
    {
      id: "offline-mode",
      title: "Offline Mode",
      description: "Work on documents without an internet connection",
      votes: 892,
    },
    {
      id: "mobile-app",
      title: "Mobile App",
      description: "Native iOS and Android applications",
      votes: 2156,
    },
  ]);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    // Clear status message when user starts typing
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: "" });
    }
  };

  // Handle voting for a feature
  const handleVote = async (featureId: string) => {
    // Check if user has already voted for this feature
    const updatedFeatures = featureRequests.map((feature) => {
      if (feature.id === featureId) {
        // If user has already voted, don't allow another vote
        if (feature.hasVoted) {
          return feature;
        }
        // Mark as voted and increment vote count
        return {
          ...feature,
          votes: feature.votes + 1,
          hasVoted: true,
        };
      }
      return feature;
    });

    setFeatureRequests(updatedFeatures);

    try {
      // Mock voting for feature
      console.log(`Voting for feature ${featureId}`);
      const result = { success: true, message: "Vote submitted successfully" };

      if (!result.success) {
        // Revert the vote if the backend call failed
        const revertedFeatures = featureRequests.map((feature) => {
          if (feature.id === featureId) {
            return {
              ...feature,
              votes: feature.votes - 1,
              hasVoted: false,
            };
          }
          return feature;
        });
        setFeatureRequests(revertedFeatures);

        setError(result.message || "Failed to submit vote. Please try again.");
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      // Revert the vote if there was an error
      const revertedFeatures = featureRequests.map((feature) => {
        if (feature.id === featureId) {
          return {
            ...feature,
            votes: feature.votes - 1,
            hasVoted: false,
          };
        }
        return feature;
      });
      setFeatureRequests(revertedFeatures);

      setError("Failed to submit vote. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle commenting on a feature
  const handleComment = async (featureId: string) => {
    try {
      // Mock comment on feature
      console.log(`Commenting on feature ${featureId}`);
      const result = {
        success: true,
        message: "Comment recorded successfully",
      };

      if (result.success) {
        toast({
          title: "Interest Registered",
          description:
            "Thank you for your interest! Our team will consider your feedback.",
        });
      } else {
        setError(
          result.message ||
            "Failed to process comment interest. Please try again.",
        );
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      setError("Failed to process comment interest. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  // Simulate fetching feature requests from backend
  useEffect(() => {
    const fetchFeatureRequests = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll use the static data but simulate an API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // If we had a real API, it might look like:
        // const response = await apiClient.get('/api/feature-requests/popular');
        // setFeatureRequests(response.data);

        // For now, we'll just use the static data but with proper voting state
        setFeatureRequests((prev) =>
          prev.map((feature) => ({
            ...feature,
            hasVoted: false,
          })),
        );
      } catch (err) {
        setError("Failed to load feature requests. Please try again later.");
        setTimeout(() => setError(null), 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureRequests();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.featureTitle.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Please provide a feature title",
      });
      return;
    }

    if (!formData.featureDescription.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Please provide a detailed description of your feature",
      });
      return;
    }

    if (!formData.useCase.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Please describe a use case for this feature",
      });
      return;
    }

    if (!formData.category) {
      setSubmitStatus({
        type: "error",
        message: "Please select a category for your feature",
      });
      return;
    }

    if (!formData.priority) {
      setSubmitStatus({
        type: "error",
        message: "Please select a priority level for your feature",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Send data to the new API endpoint
      const response = await fetch("/api/feature-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featureTitle: formData.featureTitle,
          featureDescription: formData.featureDescription,
          useCase: formData.useCase,
          category: formData.category,
          priority: formData.priority,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success message
        setSubmitStatus({
          type: "success",
          message:
            "Thank you for your feature request! Our team will review it and consider it for future development.",
        });

        // Reset form
        setFormData({
          featureTitle: "",
          featureDescription: "",
          useCase: "",
          category: "",
          priority: "",
        });
      } else {
        throw new Error(result.error || "Failed to submit feature request");
      }
    } catch (error) {
      console.error("Error submitting feature request:", error);
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "There was an error submitting your feature request. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom py-6">
          {/* Breadcrumb */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  href="/docs"
                  className={`text-sm font-medium ${planDocLinkClasses}`}>
                  Documentation
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-black"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <Link
                    href="/docs/roadmap"
                    className={`text-sm font-medium ml-1 md:ml-2 ${planDocLinkClasses}`}>
                    Roadmap
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-black"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-black text-sm font-medium ml-1 md:ml-2 dark:text-black">
                    Feature Request
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1
            className={`text-3xl md:text-4xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Request a Feature
          </h1>
          <p className="text-lg text-black dark:text-black">
            Help us shape the future of ScholarForge AIby suggesting new
            features and improvements
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Hero Section */}
        <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mb-12 dark:from-blue-900/20 dark:to-indigo-900/20 border-white-800">
          <div className="text-center">
            <Lightbulb className="h-12 w-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
            <h1
              className={`text-3xl md:text-4xl font-bold mb-4 ${planDocHeadingClasses}`}>
              Request a Feature
            </h1>
            <p className="text-xl text-black max-w-3xl mx-auto dark:text-black">
              Help us shape the future of ScholarForge AIby suggesting new
              features and improvements
            </p>
          </div>
        </div>

        {/* Feature Request Form */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Submit Your Feature Request
          </h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="featureTitle"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Feature Title
              </label>
              <input
                type="text"
                id="featureTitle"
                value={formData.featureTitle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black"
                placeholder="Briefly describe your feature idea"
              />
            </div>

            <div>
              <label
                htmlFor="featureDescription"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Detailed Description
              </label>
              <textarea
                id="featureDescription"
                value={formData.featureDescription}
                onChange={handleChange}
                rows={5}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black"
                placeholder="Describe your feature in detail. What problem does it solve? How would you use it?"></textarea>
            </div>

            <div>
              <label
                htmlFor="useCase"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Use Case
              </label>
              <textarea
                id="useCase"
                value={formData.useCase}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black"
                placeholder="Describe a specific situation where this feature would be useful"></textarea>
            </div>

            <div>
              <label
                htmlFor="category"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black">
                <option value="">Select a category</option>
                <option value="writing">Writing & Editing</option>
                <option value="ai">AI Features</option>
                <option value="citations">Citations & Plagiarism</option>
                <option value="collaboration">Collaboration</option>
                <option value="organization">
                  Organization & Productivity
                </option>
                <option value="integration">Integrations</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Priority Level
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black">
                <option value="">How important is this feature to you?</option>
                <option value="nice-to-have">Nice to have</option>
                <option value="important">Important</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Status message */}
            {submitStatus.type && (
              <div
                className={`p-4 rounded-lg ${submitStatus.type === "success" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
                {submitStatus.message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                {isSubmitting ? "Submitting..." : "Submit Feature Request"}
              </button>
            </div>
          </form>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            How Feature Requests Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${planCardClasses} p-6 text-center`}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4 dark:bg-blue-900/30 dark:text-blue-300">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Submit
              </h3>
              <p className="text-black dark:text-black">
                Share your idea with our team and community
              </p>
            </div>
            <div className={`${planCardClasses} p-6 text-center`}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4 dark:bg-green-900/30 dark:text-green-300">
                <Users className="h-6 w-6" />
              </div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Vote
              </h3>
              <p className="text-black dark:text-black">
                Community members can vote on features they want
              </p>
            </div>
            <div className={`${planCardClasses} p-6 text-center`}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-4 dark:bg-purple-900/30 dark:text-purple-300">
                <Zap className="h-6 w-6" />
              </div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Build
              </h3>
              <p className="text-black dark:text-black">
                We prioritize and build the most requested features
              </p>
            </div>
          </div>
        </div>

        {/* Popular Feature Requests */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Popular Feature Requests
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-black dark:text-black">
                Loading feature requests...
              </span>
            </div>
          )}

          {!loading && (
            <div className="space-y-4">
              {featureRequests.map((feature) => (
                <div key={feature.id} className={`${planCardClasses} p-4`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold ${planDocHeadingClasses}`}>
                        {feature.title}
                      </h3>
                      <p className="text-black text-sm mt-1 dark:text-black">
                        {feature.description}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {feature.votes.toLocaleString()} votes
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center mt-3">
                    <button
                      onClick={() => handleVote(feature.id)}
                      className={`text-sm font-medium ${
                        feature.hasVoted
                          ? "text-black cursor-not-allowed dark:text-black"
                          : "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      }`}
                      disabled={feature.hasVoted}>
                      {feature.hasVoted ? "Voted" : "Vote for this feature"}
                    </button>
                    <span className="mx-2 text-black dark:text-black">
                      •
                    </span>
                    <button
                      onClick={() => handleComment(feature.id)}
                      className="text-sm font-medium text-black hover:text-black dark:text-black dark:hover:text-black">
                      Comment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Guidelines */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 dark:from-green-900/20 dark:to-emerald-900/20 border-white-800">
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1 mr-4 flex-shrink-0 dark:text-green-400" />
            <div>
              <h2
                className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
                Community Guidelines
              </h2>
              <ul className="space-y-2 text-black dark:text-black">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-200 flex items-center justify-center mt-0.5 mr-3 dark:bg-green-900/30">
                    <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                  </div>
                  <span>
                    Be specific and detailed in your feature descriptions
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-200 flex items-center justify-center mt-0.5 mr-3 dark:bg-green-900/30">
                    <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                  </div>
                  <span>
                    Search existing requests before submitting a new one
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-200 flex items-center justify-center mt-0.5 mr-3 dark:bg-green-900/30">
                    <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                  </div>
                  <span>
                    Be respectful and constructive in comments and discussions
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-200 flex items-center justify-center mt-0.5 mr-3 dark:bg-green-900/30">
                    <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                  </div>
                  <span>
                    Vote for features you genuinely want to see implemented
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Roadmap */}
        <div className="text-center mt-12">
          <Link
            href="/docs/roadmap"
            className="inline-flex items-center px-6 py-3 border border-white text-black rounded-lg hover:bg-gray-50 font-medium border-white dark:text-black dark:hover:bg-white">
            <ArrowRight className="mr-2 h-5 w-5 transform rotate-180" />
            Back to Roadmap
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeatureRequestPage;
