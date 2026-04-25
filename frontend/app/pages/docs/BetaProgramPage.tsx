import Link from "next/link";
import {
  Zap,
  Users,
  Star,
  Calendar,
  CheckCircle,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";
import { useState } from "react";

const BetaProgramPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    researchArea: "",
    experience: "",
    interest: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Send data to Discord webhook
      const webhookUrl =
        "https://discord.com/api/webhooks/1445511277634912348/Or24qlRzWnW_yJ5kKszuDIS0rf052ZfKSdxF9_0lbJGocvv8p-Rc2guRCvAbDWWg5QQl";

      const payload = {
        content: "New Beta Program Application",
        embeds: [
          {
            title: "Beta Program Application",
            fields: [
              {
                name: "Full Name",
                value: formData.name || "Not provided",
                inline: true,
              },
              {
                name: "Email",
                value: formData.email || "Not provided",
                inline: true,
              },
              {
                name: "Institution",
                value: formData.institution || "Not provided",
                inline: false,
              },
              {
                name: "Research Area",
                value: formData.researchArea || "Not provided",
                inline: false,
              },
              {
                name: "Experience Level",
                value: formData.experience || "Not provided",
                inline: false,
              },
              {
                name: "Features of Interest",
                value: formData.interest || "Not provided",
                inline: false,
              },
            ],
            timestamp: new Date().toISOString(),
            color: 3447003, // Blue color
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message:
            "Thank you for applying to the Beta Program! We will review your application and contact you soon.",
        });
        // Reset form
        setFormData({
          name: "",
          email: "",
          institution: "",
          researchArea: "",
          experience: "",
          interest: "",
        });
      } else {
        throw new Error("Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting beta application:", error);
      setSubmitStatus({
        type: "error",
        message:
          "There was an error submitting your application. Please try again later.",
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
                    Beta Program
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1
            className={`text-3xl md:text-4xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Beta Program
          </h1>
          <p className="text-lg text-black dark:text-black">
            Get early access to new features and help shape the future of
            ScholarForge AI
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-8 mb-12 dark:from-yellow-900/20 dark:to-orange-900/20 border-white-800">
          <div className="text-center">
            <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-4 dark:text-yellow-400" />
            <h1
              className={`text-3xl md:text-4xl font-bold mb-4 ${planDocHeadingClasses}`}>
              Beta Program
            </h1>
            <p className="text-xl text-black max-w-3xl mx-auto dark:text-black">
              Get early access to new features and help shape the future of
              ScholarForge AI
            </p>
          </div>
        </div>

        {/* Program Overview */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            What is the Beta Program?
          </h2>
          <p className="text-black mb-4 dark:text-black">
            The ScholarForge AIBeta Program gives selected users early access to
            upcoming features before they're released to the general public. As
            a beta tester, you'll be among the first to try new functionality
            and provide valuable feedback that helps us improve the product.
          </p>
          <p className="text-black dark:text-black">
            Beta testers play a crucial role in shaping ScholarForge AIby
            identifying issues, suggesting improvements, and helping us ensure
            new features meet the needs of our academic community.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Beta Program Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-4 dark:bg-blue-900/30">
                  <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Early Access
                </h3>
              </div>
              <p className="text-black dark:text-black">
                Get exclusive access to new features and improvements before
                they're publicly released.
              </p>
            </div>

            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-4 dark:bg-green-900/30">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Direct Influence
                </h3>
              </div>
              <p className="text-black dark:text-black">
                Your feedback directly influences the development and refinement
                of new features.
              </p>
            </div>

            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg mr-4 dark:bg-purple-900/30">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Community
                </h3>
              </div>
              <p className="text-black dark:text-black">
                Connect with other beta testers and ScholarForge AIdevelopers in
                our exclusive community.
              </p>
            </div>

            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg mr-4 dark:bg-yellow-900/30">
                  <CheckCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Recognition
                </h3>
              </div>
              <p className="text-black dark:text-black">
                Receive special recognition in our release notes and community
                acknowledgments.
              </p>
            </div>
          </div>
        </div>

        {/* Current Beta Features */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Current Beta Features
          </h2>
          <div className="space-y-6">
            <div className={`${planCardClasses} p-5`}>
              <div className="flex justify-between items-start mb-3">
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Templates Marketplace
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Beta
                </span>
              </div>
              <p className="text-black mb-3 dark:text-black">
                Browse thousands of templates for research papers, essays, and
                more from the ScholarForge AIcommunity.
              </p>
              <div className="flex items-center text-sm text-black dark:text-black">
                <Calendar className="h-4 w-4 mr-1" />
                Expected release: Q1 2025
              </div>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <div className="flex justify-between items-start mb-3">
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Advanced Analytics Dashboard
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Beta
                </span>
              </div>
              <p className="text-black mb-3 dark:text-black">
                Track your writing progress, productivity trends, and
                improvement over time.
              </p>
              <div className="flex items-center text-sm text-black dark:text-black">
                <Calendar className="h-4 w-4 mr-1" />
                Expected release: Q1 2025
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Beta Program Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3
                className={`text-lg font-semibold mb-4 ${planDocHeadingClasses}`}>
                Eligibility
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Active ScholarForge AIaccount
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Regular user of ScholarForge AIfeatures
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Willingness to provide feedback
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Academic or research focus
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-4 ${planDocHeadingClasses}`}>
                Responsibilities
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Test new features regularly
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Report bugs and issues
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Provide detailed feedback
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Participate in surveys and discussions
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mb-12 dark:from-blue-900/20 dark:to-indigo-900/20 border-white-800">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Join the Beta Program
          </h2>

          {/* Status Message */}
          {submitStatus.type && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                submitStatus.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 border-white-800"
                  : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 border-white-800"
              }`}>
              {submitStatus.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="institution"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Institution/Affiliation
              </label>
              <input
                type="text"
                id="institution"
                value={formData.institution}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black"
                placeholder="University, research institute, or organization"
              />
            </div>

            <div>
              <label
                htmlFor="researchArea"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Research Area/Field of Study
              </label>
              <input
                type="text"
                id="researchArea"
                value={formData.researchArea}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black"
                placeholder="e.g., Computer Science, Biology, History"
              />
            </div>

            <div>
              <label
                htmlFor="experience"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                How long have you been using ScholarForge AI?
              </label>
              <select
                id="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black">
                <option value="">Select your experience level</option>
                <option value="less-than-1">Less than 1 month</option>
                <option value="1-3">1-3 months</option>
                <option value="3-6">3-6 months</option>
                <option value="6-12">6-12 months</option>
                <option value="more-than-12">More than 12 months</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="interest"
                className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                Which features are you most interested in testing?
              </label>
              <textarea
                id="interest"
                value={formData.interest}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black"
                placeholder="Tell us which upcoming features you're most excited about"></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}>
                {isSubmitting ? "Submitting..." : "Apply to Beta Program"}
              </button>
            </div>
          </form>
        </div>

        {/* FAQ */}
        <div className={`${planCardClasses} p-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="border-b border-white pb-6 border-white">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                How are beta testers selected?
              </h3>
              <p className="text-black dark:text-black">
                We select beta testers based on their engagement with
                ScholarForge AI, their research field, and how well their needs
                align with upcoming features. We aim for a diverse group of
                users who can provide valuable feedback.
              </p>
            </div>
            <div className="border-b border-white pb-6 border-white">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Is there a fee to join the beta program?
              </h3>
              <p className="text-black dark:text-black">
                No, the beta program is completely free. In fact, beta testers
                often receive extended access to premium features during the
                testing period.
              </p>
            </div>
            <div className="border-b border-white pb-6 border-white">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                How long does the beta testing period last?
              </h3>
              <p className="text-black dark:text-black">
                Beta testing periods vary by feature but typically last 4-8
                weeks. We provide advance notice before features are released to
                the general public.
              </p>
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Can I leave the beta program if I change my mind?
              </h3>
              <p className="text-black dark:text-black">
                Yes, you can leave the beta program at any time. Simply contact
                our support team, and we'll remove you from the beta testing
                group.
              </p>
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

export default BetaProgramPage;
