"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Phone,
  Clock,
  HelpCircle,
  User,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { usePlanStyling } from "../../hooks/usePlanStyling";
import ContactService from "../../lib/utils/contactService";

const ContactSupportPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      subject: "",
      message: "",
    };

    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
        isValid = false;
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
      isValid = false;
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
      isValid = false;
    } else if (formData.message.length < 10) {
      newErrors.message = "Message should be at least 10 characters long";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Send form data to backend support service using the proper service
      const result = await ContactService.submitContactForm(
        formData.name,
        formData.email,
        formData.subject,
        formData.message,
      );

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message:
            "Thank you for your message! We'll get back to you within 24 hours.",
        });
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "There was an error sending your message. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportOptions = [
    {
      title: "Schedule a Meeting",
      description: "Book a 30-minute session with our support team",
      icon: <MessageCircle className="h-6 w-6 text-blue-600" />,
      availability: "Available Mon-Fri 9AM-5PM EST",
      action: "Schedule Now",
    },
    {
      title: "Email Support",
      description: "Send us a detailed message",
      icon: <Mail className="h-6 w-6 text-green-600" />,
      availability: "24/7 - Response within 24 hours",
      action: "Send Email",
    },
    {
      title: "Phone Support",
      description: "Speak directly with a support representative",
      icon: <Phone className="h-6 w-6 text-purple-600" />,
      availability: "Mon-Fri 9AM-8PM EST",
      action: "Call Now",
      isPhone: true,
      phoneNumbers: ["+919063586568", "+918790813536"],
    },
    {
      title: "Community Support",
      description: "Connect with other users and get help from the community",
      icon: <MessageCircle className="h-6 w-6 text-indigo-600" />,
      availability: "24/7 - Community members ready to help",
      action: "Join Community",
    },
  ];

  const commonTopics = [
    {
      title: "Account Issues",
      description: "Login problems, password resets, account access",
      icon: <User className="h-5 w-5 text-blue-600" />,
    },
    {
      title: "Billing Questions",
      description: "Subscription changes, payment issues, refunds",
      icon: <FileText className="h-5 w-5 text-green-600" />,
    },
    {
      title: "Technical Support",
      description: "App issues, bugs, feature requests",
      icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
    },
    {
      title: "Academic Features",
      description: "AI writing, citations, plagiarism checking",
      icon: <HelpCircle className="h-5 w-5 text-purple-600" />,
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
            Contact Support
          </h1>
          <p className="text-lg text-black dark:text-black">
            Get help from our dedicated support team
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">We're Here to Help</h2>
              <p className="opacity-90">
                Our support team is ready to assist you with any questions or
                issues
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Mail className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Support Options
            </h2>
            <div className="space-y-4">
              {supportOptions.map((option, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 mr-3">{option.icon}</div>
                    <h3
                      className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                      {option.title}
                    </h3>
                  </div>
                  <p className="text-black mb-3 dark:text-black">
                    {option.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      <Clock className="h-3 w-3 mr-1" />
                      {option.availability}
                    </span>
                    {option.title === "Community Support" ? (
                      <a
                        href="https://discord.gg/2MMSdX3Uee"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
                        {option.action}
                      </a>
                    ) : option.title === "Schedule a Meeting" ? (
                      <a
                        href="https://calendly.com/audacityimpact/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                        {option.action}
                      </a>
                    ) : option.isPhone ? (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          // Try primary number first
                          window.location.href = `tel:${option.phoneNumbers[0]}`;
                          // Set a timeout to try secondary number if primary fails
                          setTimeout(() => {
                            window.location.href = `tel:${option.phoneNumbers[1]}`;
                          }, 3000);
                        }}>
                        {option.action}
                      </button>
                    ) : (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                        {option.action}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 dark:bg-blue-900/20 border-white-800">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Emergency Support
              </h3>
              <p className="text-blue-800 mb-3 dark:text-blue-200">
                For critical issues affecting your academic work, contact us
                immediately:
              </p>
              <p className="text-blue-800 font-medium dark:text-blue-200 mb-3">
                Emergency: support@scholarforgeai.com
              </p>
              <button
                className="text-blue-800 font-medium dark:text-blue-200 underline cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  // Try primary number first
                  window.location.href = "tel:+919063586568";
                  // Set a timeout to try secondary number if primary fails
                  setTimeout(() => {
                    window.location.href = "tel:+918790813536";
                  }, 3000);
                }}>
                Call Emergency Support (+91 90635 86568 or +91 87908 13536)
              </button>
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Send Us a Message
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white text-black ${
                    errors.name
                      ? "border-red-500 border-white-500"
                      : "border-white focus:border-blue-500 border-white"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                    {errors.name}
                  </p>
                )}
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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white text-black ${
                    errors.email
                      ? "border-red-500 border-white-500"
                      : "border-white focus:border-blue-500 border-white"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white text-black ${
                    errors.subject
                      ? "border-red-500 border-white-500"
                      : "border-white focus:border-blue-500 border-white"
                  }`}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                    {errors.subject}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className={`block text-sm font-medium mb-1 ${planDocHeadingClasses}`}>
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white text-black ${
                    errors.message
                      ? "border-red-500 border-white-500"
                      : "border-white focus:border-blue-500 border-white"
                  }`}></textarea>
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                    {errors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>

        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Common Support Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {commonTopics.map((topic, index) => (
              <div key={index} className={`${planCardClasses} p-5`}>
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 mr-3">{topic.icon}</div>
                  <h3
                    className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                    {topic.title}
                  </h3>
                </div>
                <p className="text-black dark:text-black">
                  {topic.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Before Contacting Support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Check Our Resources
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                  <span className="text-black dark:text-black">
                    <Link
                      href="/docs/faq"
                      className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                      Browse our FAQ
                    </Link>{" "}
                    for quick answers
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                  <span className="text-black dark:text-black">
                    <Link
                      href="/docs/troubleshooting"
                      className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                      Try troubleshooting steps
                    </Link>
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                  <span className="text-black dark:text-black">
                    Check our
                    <Link
                      href="/docs"
                      className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                      {" "}
                      documentation
                    </Link>
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Prepare Information
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                  <span className="text-black dark:text-black">
                    Your account email address
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                  <span className="text-black dark:text-black">
                    Details about the issue
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-3 mt-2 dark:bg-gray-500"></div>
                  <span className="text-black dark:text-black">
                    Screenshots if applicable
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupportPage;
