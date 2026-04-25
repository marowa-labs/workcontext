"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Search,
  MessageCircle,
  Mail,
  BookOpen,
  Users,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const FAQPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const [openCategory, setOpenCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCategory = (category: any) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  const faqCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <BookOpen className="h-5 w-5 text-blue-600" />,
      faqs: [
        {
          question: "How do I create an account?",
          answer:
            "You can create an account by clicking the 'Sign Up' button on our homepage. You'll need to provide your email address, create a password, and verify your email. After verification, you can complete your profile and start using ScholarForge AI.",
        },
        {
          question: "Is there a free trial available?",
          answer:
            "Yes! All new users get access to our Free plan which includes basic features like up to 3 projects, 100 AI writing suggestions per month, and basic plagiarism checking. You can upgrade to a paid plan at any time.",
        },
        {
          question: "What are the system requirements?",
          answer:
            "ScholarForge AIworks on any modern web browser including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of your preferred browser. Our mobile apps are available for iOS and Android devices.",
        },
      ],
    },
    {
      id: "account-management",
      title: "Account Management",
      icon: <Users className="h-5 w-5 text-green-600" />,
      faqs: [
        {
          question: "How do I change my password?",
          answer:
            "You can change your password by going to Settings > Account > Security. Click on 'Change Password' and follow the prompts. For security reasons, you'll need to enter your current password before setting a new one.",
        },
        {
          question: "How do I delete my account?",
          answer:
            "To delete your account, go to Settings > Account > Privacy & Security and select 'Delete Account'. Please note that this action is permanent and cannot be undone. All your data will be permanently removed from our systems.",
        },
        {
          question: "Can I change my email address?",
          answer:
            "Yes, you can update your email address in your account settings. Go to Settings > Account > Profile Information. After changing your email, you'll need to verify the new address before it becomes active.",
        },
      ],
    },
    {
      id: "billing",
      title: "Billing & Payments",
      icon: <CreditCard className="h-5 w-5 text-purple-600" />,
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major credit cards including Visa, Mastercard, American Express, and Discover. We also support PayPal and bank transfers for annual plans. All payments are processed securely through our payment partners.",
        },
        {
          question: "Can I get a refund?",
          answer:
            "We offer a 30-day money-back guarantee for new subscribers. After 30 days, we provide pro-rated refunds for unused portions of annual subscriptions. Monthly subscriptions are not eligible for refunds once the period has begun.",
        },
        {
          question: "How do I cancel my subscription?",
          answer:
            "You can cancel your subscription at any time from your billing settings. Your access will continue until the end of your current billing period. To cancel, go to Settings > Billing > Subscription Management and click 'Cancel Subscription'.",
        },
      ],
    },
    {
      id: "features",
      title: "Features & Functionality",
      icon: <BookOpen className="h-5 w-5 text-orange-600" />,
      faqs: [
        {
          question: "How does the AI writing assistant work?",
          answer:
            "Our AI writing assistant uses advanced natural language processing to help improve your academic writing. It can suggest improvements for clarity, coherence, and academic tone. The AI never generates content on its own but rather helps enhance your existing writing.",
        },
        {
          question: "Is my work private when using AI features?",
          answer:
            "Yes, your work is completely private. We use industry-standard encryption to protect your data. Our AI models are designed to assist with writing enhancement, not to store or learn from your content. All processing happens securely and your data is not used to train our models.",
        },
        {
          question: "How accurate is the plagiarism checker?",
          answer:
            "Our plagiarism checker compares your work against billions of web pages, academic papers, and publications. It provides detailed reports with source identification and similarity percentages. While highly accurate, we recommend reviewing all results carefully as no system is 100% perfect.",
        },
      ],
    },
    {
      id: "collaboration",
      title: "Collaboration",
      icon: <Users className="h-5 w-5 text-teal-600" />,
      faqs: [
        {
          question: "How many people can collaborate on a document?",
          answer:
            "There's no limit to the number of collaborators you can invite to a document. Each collaborator can have different permission levels (view, comment, or edit) which you can set when inviting them.",
        },
        {
          question: "Can I collaborate with people who don't have an account?",
          answer:
            "Yes, you can invite collaborators via email even if they don't have a ScholarForge AIaccount. They'll receive an invitation to join and can participate in the collaboration without creating an account, though they'll have limited features.",
        },
        {
          question: "How does real-time editing work?",
          answer:
            "Our real-time editing feature allows multiple users to work on the same document simultaneously. Changes appear instantly for all collaborators. We use operational transformation technology to ensure all changes are properly synchronized.",
        },
      ],
    },
  ];

  const filteredCategories = faqCategories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.faqs.some(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

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
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-black dark:text-black">
            Find answers to common questions about ScholarForge AI
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Can't Find What You're Looking For?
              </h2>
              <p className="opacity-90">
                Our support team is here to help with any questions not covered
                in our FAQ
              </p>
            </div>
            <div className="flex space-x-2">
              <Link
                href="/docs/contact-support"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-medium">
                Contact Support
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black" />
            <input
              type="text"
              placeholder="Search FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-white border-white text-black"
            />
          </div>
        </div>

        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className={`${planCardClasses} rounded-lg`}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-5 text-left">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">{category.icon}</div>
                  <h2
                    className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                    {category.title}
                  </h2>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-black transform transition-transform ${
                    openCategory === category.id ? "rotate-180" : ""
                  } dark:text-black`}
                />
              </button>

              {openCategory === category.id && (
                <div className="px-5 pb-5">
                  <div className="border-t border-white pt-5 space-y-6 border-white">
                    {category.faqs.map((faq, index) => (
                      <div key={index}>
                        <h3
                          className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                          {faq.question}
                        </h3>
                        <p className="text-black dark:text-black">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 rounded-xl p-6 dark:bg-white dark:border border-white">
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Still Need Help?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${planCardClasses} p-5`}>
              <div className="flex items-center mb-3">
                <MessageCircle className="h-6 w-6 text-blue-600 mr-3 dark:text-blue-400" />
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Schedule a Meeting
                </h3>
              </div>
              <p className="text-black mb-4 dark:text-black">
                Book a 30-minute session with our support team.
              </p>
              <a
                href="https://calendly.com/audacityimpact/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-block">
                Schedule Now
              </a>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <div className="flex items-center mb-3">
                <Mail className="h-6 w-6 text-green-600 mr-3 dark:text-green-400" />
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Email Support
                </h3>
              </div>
              <p className="text-black mb-4 dark:text-black">
                Send us a detailed message and we'll respond within 24 hours.
              </p>
              <Link
                href="/docs/contact-support"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium inline-block">
                Send Email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
