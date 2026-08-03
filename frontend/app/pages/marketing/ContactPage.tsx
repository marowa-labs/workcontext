"use client";

import { useState } from "react";
import {
  Mail,
  Building,
  Newspaper,
  Send,
  MapPin,
  Globe,
  Twitter,
  Linkedin,
  Github,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Headphones,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";

// Contact Hero Section
function ContactHero() {
  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 mb-6">
            <Headphones className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              Support Center
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How Can We Help You?
          </h1>

          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            Have a question or need assistance? Our support team is ready to
            help. Choose the best way to reach us below.
          </p>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Response within 24 hours
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Expert support team
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Quick Contact Options
function QuickContactOptions() {
  const contactTypes = [
    {
      icon: Mail,
      title: "General Support",
      description:
        "Questions about features, getting started, or how things work",
      contact: "hello@workcontext.me",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Building,
      title: "Partnerships",
      description:
        "Institutional partnerships, enterprise plans, and custom solutions",
      contact: "partnerships@workcontext.me",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Newspaper,
      title: "Research & Academic",
      description:
        "Research inquiries, academic collaborations, and scholarly questions",
      contact: "research@workcontext.me",
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Get in Touch
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Pick the channel that best fits your needs for a faster response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {contactTypes.map((type, index) => (
            <Card
              key={index}
              className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group bg-white"
            >
              <CardContent className="p-6 text-center">
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <type.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {type.title}
                </h3>

                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {type.description}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    (window.location.href = `mailto:${type.contact}`)
                  }
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {type.contact}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Form
function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <Send className="h-8 w-8 text-green-600" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-3">Message Sent!</h3>

        <p className="text-gray-600 mb-8 leading-relaxed">
          Thanks for reaching out. We&apos;ll get back to you within 24 hours.
        </p>

        <Button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({ name: "", email: "", subject: "", message: "" });
          }}
          variant="outline"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Send Us a Message
        </h2>
        <p className="text-gray-600">
          Fill out the form below and we&apos;ll get back to you as soon as
          possible.
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Full Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email Address *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Subject *
              </label>
              <Select
                name="subject"
                required
                onValueChange={(value) =>
                  setFormData({ ...formData, subject: value })
                }
                value={formData.subject}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Question</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing Question</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="partnership">
                    Partnership Inquiry
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Message *
              </label>
              <Textarea
                id="message"
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="w-full resize-none"
                placeholder="Tell us how we can help you..."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  Send Message
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Contact Info Cards
function ContactInfoCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <Card className="border border-gray-200 shadow-sm text-center bg-white">
        <CardContent className="p-6">
          <Mail className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
          <p className="text-sm text-gray-500">hello@workcontext.me</p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm text-center bg-white">
        <CardContent className="p-6">
          <MapPin className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
          <p className="text-sm text-gray-500">San Francisco, CA</p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm text-center bg-white">
        <CardContent className="p-6">
          <Globe className="h-8 w-8 text-purple-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">
            Available Worldwide
          </h3>
          <p className="text-sm text-gray-500">24/7 online support</p>
        </CardContent>
      </Card>
    </div>
  );
}

// FAQ Section
function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const router = useRouter();

  const faqs = [
    {
      question: "How quickly do you respond?",
      answer:
        "We respond to all inquiries within 24 hours during business days. For urgent technical issues, our response time is usually within 4-6 hours.",
    },
    {
      question: "Do you offer phone support?",
      answer:
        "We can schedule a call for complex issues. Reach us via email and we'll arrange a time that works for you.",
    },
    {
      question: "How do I report a bug?",
      answer:
        "Please use the contact form above and select 'Technical Support'. Include as much detail as possible about the issue you're experiencing.",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Frequently Asked Questions
      </h2>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <Card key={index} className="border border-gray-200 bg-white">
            <CardContent className="p-0">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <h4 className="font-medium text-gray-900 pr-4">
                  {faq.question}
                </h4>
                {openFAQ === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-6">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/help")}
        >
          Visit Help Center
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Social Links
function SocialLinks() {
  return (
    <div className="flex items-center justify-center gap-4">
      <a
        href="https://twitter.com"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Twitter className="h-5 w-5 text-gray-600" />
      </a>
      <a
        href="https://linkedin.com"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Linkedin className="h-5 w-5 text-gray-600" />
      </a>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Github className="h-5 w-5 text-gray-600" />
      </a>
    </div>
  );
}

// Main Page
export default function ContactPage() {
  return (
    <Layout>
      <ContactHero />
      <QuickContactOptions />

      <section className="py-16 bg-white">
        <div className="container-custom">
          <ContactForm />
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <ContactInfoCards />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <FAQSection />
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom text-center">
          <p className="text-sm text-gray-500 mb-4">Follow us for updates</p>
          <SocialLinks />
        </div>
      </section>
    </Layout>
  );
}
