"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Users,
  Zap,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

const MobileLandingPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [votingFeatures, setVotingFeatures] = useState([
    { id: "offline-editing", name: "Offline Editing", votes: 245 },
    {
      id: "real-time-collaboration",
      name: "Real-time Collaboration",
      votes: 189,
    },
  ]);
  const [votedFeatures, setVotedFeatures] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Mock joining waitlist
      console.log(`Joining waitlist for mobile app with email: ${email}`);
      const result = {
        success: true,
        message: "Successfully added to waitlist",
      };

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message:
            "Thank you! You have been added to the waitlist. We will notify you when our mobile app launches.",
        });
        setEmail(""); // Clear the email input
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error joining waitlist:", error);
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "There was an error joining the waitlist. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (featureId: string, featureName: string) => {
    // Prevent duplicate voting
    if (votedFeatures.includes(featureId)) {
      return;
    }

    try {
      // Mock voting for feature
      console.log(`Voting for feature ${featureId}`);
      const result = {
        success: true,
        votes: 250,
        message: "Vote submitted successfully",
      };

      if (result.success) {
        // Update local state to reflect the vote
        setVotedFeatures([...votedFeatures, featureId]);
        setVotingFeatures(
          votingFeatures.map((feature) =>
            feature.id === featureId
              ? { ...feature, votes: result.votes }
              : feature,
          ),
        );

        // Show success message
        setSubmitStatus({
          type: "success",
          message: `Thank you for voting for ${featureName}!`,
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSubmitStatus({ type: null, message: "" });
        }, 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error voting for feature:", error);
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "There was an error submitting your vote. Please try again later.",
      });

      // Clear error message after 3 seconds
      setTimeout(() => {
        setSubmitStatus({ type: null, message: "" });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-white border-b border-white border-white sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/images/ScholarForge AI-logo.png"
                alt="ScholarForge AILogo"
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-gray-200 text-gray-200">
                ScholarForge AI
              </span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-200 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white">
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link
                href="/"
                className="text-gray-200 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Home
              </Link>
              <Link
                href="/features"
                className="text-gray-200 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-gray-200 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Pricing
              </Link>
              <Link
                href="/contact"
                className="text-gray-200 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Contact
              </Link>
              <Link
                href="/login"
                className="text-gray-200 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Sign up
              </Link>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-white border-white">
              <div className="flex flex-col space-y-4">
                <Link
                  href="/mobile"
                  className="text-gray-200 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                  onClick={() => setIsMenuOpen(false)}>
                  Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6 dark:bg-blue-900/30 dark:text-blue-200">
              <Smartphone className="h-4 w-4 mr-2" />
              Coming Soon
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-gray-200 text-gray-200 mb-6">
              ScholarForge AIMobile App
            </h1>

            <p className="text-xl text-gray-200 mb-10 dark:text-gray-200 max-w-2xl mx-auto">
              The full power of ScholarForge AI, now in your pocket. Ensure
              academic defensibility on the go with our five core
              functionalities: The Explainable Originality Map, Citation
              Confidence Auditor, Submission-Safe Writing Mode, Defensibility
              Log, and One-Click Publication Suite.
            </p>

            <div className="flex justify-center mb-12">
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-white border border-white rounded-2xl p-6 max-w-xs mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-200">ScholarForge AI</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 mb-4">
                    <div className="text-white font-bold text-lg">
                      Research Paper
                    </div>
                    <div className="text-blue-200 text-sm mt-1">
                      Draft in progress...
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-white text-sm">
                      <div className="font-medium">Citations</div>
                      <div className="text-blue-200">12/25</div>
                    </div>
                    <div className="text-white text-sm">
                      <div className="font-medium">Collaborators</div>
                      <div className="text-blue-200">3 online</div>
                    </div>
                    <div className="text-white text-sm">
                      <div className="font-medium">Plagiarism</div>
                      <div className="text-green-400">✓ Passed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-white dark:bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {/* Key Message */}
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-200 text-gray-200 mb-4">
                Optimized for Larger Screens
              </h2>
              <p className="text-lg text-gray-200 dark:text-gray-200 max-w-2xl mx-auto">
                ScholarForge AIis designed to provide the best experience on
                laptops and desktop computers. Our five core functionalities for
                academic defensibility require the precision and space that
                larger screens offer.
              </p>
            </div>

            {/* Explanation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 mb-12 border border-blue-100 border-white-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4 dark:bg-blue-900/30 dark:text-blue-300">
                  <Laptop className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-200 text-gray-200 mb-2">
                    Why Desktop Works Best
                  </h3>
                  <p className="text-gray-200 dark:text-gray-200">
                    Our platform's five core functionalities—including The
                    Explainable Originality Map, Citation Confidence Auditor,
                    Submission-Safe Writing Mode, Defensibility Log, and
                    One-Click Publication Suite—are built for the productivity
                    advantages of larger screens. The precision required for
                    academic defensibility demands the space and accuracy that
                    desktop environments provide.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Services Coming Soon */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 mb-12 border border-purple-100 border-white-800">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4 dark:bg-purple-900/30 dark:text-purple-300">
                  <Smartphone className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-200 text-gray-200 mb-2">
                  Mobile Services Coming Soon
                </h3>
                <p className="text-gray-200 dark:text-gray-200 max-w-2xl mx-auto">
                  We're actively developing native iOS and Android apps to bring
                  the full ScholarForge AIexperience to your mobile devices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-white rounded-xl p-6 shadow-sm border border-white border-white">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 dark:bg-blue-900/30 dark:text-blue-300">
                      <Zap className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-gray-200 text-gray-200">
                      Offline Mode
                    </h4>
                  </div>
                  <p className="text-gray-200 dark:text-gray-200 text-sm">
                    Work on your documents with all five core functionalities
                    available offline and sync automatically when you're back
                    online.
                  </p>
                </div>

                <div className="bg-white dark:bg-white rounded-xl p-6 shadow-sm border border-white border-white">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3 dark:bg-green-900/30 dark:text-green-300">
                      <Users className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-gray-200 text-gray-200">
                      Mobile Collaboration
                    </h4>
                  </div>
                  <p className="text-gray-200 dark:text-gray-200 text-sm">
                    Real-time editing and commenting with your collaborators
                    while maintaining defensibility standards, right from your
                    phone or tablet.
                  </p>
                </div>
              </div>

              {/* Waitlist Section */}
              <div className="bg-white dark:bg-white rounded-xl p-6 border border-white border-white">
                <h4 className="text-lg font-bold text-gray-200 text-gray-200 mb-4">
                  Be the First to Know
                </h4>

                {/* Status Message */}
                {submitStatus.type && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-sm ${
                      submitStatus.type === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                    }`}>
                    {submitStatus.message}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-gray-200"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    className={`px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Waitlist
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-sm text-gray-200 dark:text-gray-200 mt-3">
                  Join 2,156 others on the waitlist for early access
                </p>
              </div>
            </div>

            {/* Feature Voting */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-indigo-100 border-white-800">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-200 text-gray-200 mb-2">
                  Help Us Prioritize Features
                </h3>
                <p className="text-gray-200 dark:text-gray-200">
                  Vote for the mobile features you'd like to see first
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {votingFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="bg-white dark:bg-white rounded-xl p-5 border border-white border-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-4 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {feature.id === "offline-editing" ? (
                            <Zap className="h-5 w-5" />
                          ) : (
                            <Users className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-200 text-gray-200">
                            {feature.name}
                          </h4>
                          <p className="text-gray-200 dark:text-gray-200 text-sm">
                            {feature.votes} votes
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleVote(feature.id, feature.name)}
                        disabled={votedFeatures.includes(feature.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm ${
                          votedFeatures.includes(feature.id)
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 cursor-not-allowed"
                            : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-800"
                        }`}>
                        {votedFeatures.includes(feature.id) ? "Voted" : "Vote"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-6">
                <Link
                  href="/docs/feature-request"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium dark:text-indigo-400 dark:hover:text-indigo-300">
                  View all feature requests
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-12 bg-gray-50 dark:bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-200 text-gray-200 mb-4">
                About ScholarForge AI
              </h2>
              <p className="text-lg text-gray-200 dark:text-gray-200 max-w-2xl mx-auto">
                Your entire academic workflow, unified in one powerful platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 dark:bg-blue-900/30 dark:text-blue-300">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-200 text-gray-200 mb-2">
                  Submission-Safe Writing Mode
                </h3>
                <p className="text-gray-200 dark:text-gray-200">
                  Get intelligent suggestions to improve your writing while
                  ensuring AI-written content detection and humanizing
                  capabilities.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4 dark:bg-green-900/30 dark:text-green-300">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-200 text-gray-200 mb-2">
                  Citation Confidence Auditor
                </h3>
                <p className="text-gray-200 dark:text-gray-200">
                  Automatically validate and format citations with confidence in
                  their accuracy and proper attribution.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4 dark:bg-purple-900/30 dark:text-purple-300">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-200 text-gray-200 mb-2">
                  The Explainable Originality Map
                </h3>
                <p className="text-gray-200 dark:text-gray-200">
                  Scan your work against billions of sources to ensure
                  originality and academic defensibility with explainable
                  results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-gray-200 py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 mb-6">
                <img
                  src="/images/ScholarForge AI-logo.png"
                  alt="ScholarForge AILogo"
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold text-white">
                  ScholarForge AI
                </span>
              </Link>

              <p className="text-gray-200 mb-6 max-w-xl mx-auto">
                Your entire academic workflow, unified. Write smarter, cite
                faster, and check originality in one beautiful workspace built
                for students and researchers.
              </p>

              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <Link
                  href="/docs/features"
                  className="hover:text-white transition-colors">
                  Features
                </Link>
                <Link
                  href="/docs/contact-support"
                  className="hover:text-white transition-colors">
                  Contact
                </Link>
                <Link
                  href="/docs"
                  className="hover:text-white transition-colors">
                  Documentation
                </Link>
              </div>

              <div className="pt-6 border-t border-white text-sm">
                <p>
                  &copy; {new Date().getFullYear()} ScholarForge AI. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MobileLandingPage;
