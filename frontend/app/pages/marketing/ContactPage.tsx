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
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=800&fit=crop')",
          zIndex: 0,
        }}></div>

      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-gray-200xl">💬</div>
        <div className="absolute top-40 right-20 text-4xl">📧</div>
        <div className="absolute bottom-40 left-1/4 text-5xl">🤝</div>
        <div className="absolute bottom-20 right-10 text-3xl">🌍</div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            We're Here to Help with Academic Defensibility —{" "}
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Anytime, Anywhere
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto">
            Have a question about our core functionalities? Need support with
            The Explainable Originality Map, Citation Confidence Auditor,
            Submission-Safe Writing Mode, Defensibility Log, or One-Click
            Publication Suite? Our team is ready to assist you. Choose the best
            way to reach us below.
          </p>
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
      title: "Core Functionality Support",
      description:
        "Questions about our five core functionalities for academic defensibility",
      action: "Send us an email",
      contact: "hello@scholarforgeai.com",
      color: "from-blue-600 to-blue-800",
    },
    {
      icon: Building,
      title: "Institutional Partnerships",
      description:
        "Academic defensibility solutions for universities and institutions",
      action: "Contact our team",
      contact: "partnerships@scholarforgeai.com",
      color: "from-purple-600 to-purple-800",
    },
    {
      icon: Newspaper,
      title: "Academic Research",
      description:
        "Research inquiries, academic partnerships, and scholarly collaboration",
      action: "Research contact",
      contact: "research@scholarforgeai.com",
      color: "from-green-600 to-green-800",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Quick Contact Options
          </h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Choose the option that best matches your academic defensibility
            needs for faster, more targeted assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contactTypes.map((type, index) => (
            <Card
              key={index}
              className="border border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-white">
              <CardContent className="p-8 text-center">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${type.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <type.icon className="h-8 w-8 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-3">
                  {type.title}
                </h3>

                <p className="text-gray-200 mb-6 leading-relaxed">
                  {type.description}
                </p>

                <Button
                  variant="outline"
                  className="w-full bg-white border-white text-white hover:bg-white"
                  onClick={() =>
                    (window.location.href = `mailto:${type.contact}`)
                  }>
                  {type.action}
                  <Mail className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-sm text-gray-200 mt-3">{type.contact}</p>
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
      <Card className="max-w-2xl mx-auto border border-white shadow-2xl bg-white">
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-600 mb-6">
            <Send className="h-10 w-10 text-white" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-4">
            Message Sent Successfully!
          </h3>

          <p className="text-gray-200 mb-6 leading-relaxed">
            Thank you for reaching out. We've received your message and will get
            back to you within 24 hours. In the meantime, feel free to explore
            our Help Center for quick answers.
          </p>

          <Button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                name: "",
                email: "",
                subject: "",
                message: "",
              });
            }}
            variant="outline"
            className="bg-white border-white text-white hover:bg-white">
            Send Another Message
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto border border-white shadow-2xl bg-white">
      <CardHeader className="text-center pb-8">
        <h3 className="text-2xl font-bold text-white mb-2">
          Academic Defensibility Support
        </h3>
        <p className="text-gray-200">
          Fill out the form below and we'll get back to you within 24 hours.
        </p>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-md p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-200 mb-2">
                Full Name *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border-white text-white"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-200 mb-2">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border-white text-white"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-200 mb-2">
              Subject *
            </label>
            <Select
              name="subject"
              required
              onValueChange={(value) =>
                setFormData({ ...formData, subject: value })
              }
              value={formData.subject}>
              <SelectTrigger className="w-full bg-white border-white text-white">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent className="bg-white border-white">
                <SelectItem value="general" className="text-white">
                  Core Functionality Question
                </SelectItem>
                <SelectItem value="technical" className="text-white">
                  Technical Support
                </SelectItem>
                <SelectItem value="billing" className="text-white">
                  Billing Question
                </SelectItem>
                <SelectItem value="feature" className="text-white">
                  Feature Request
                </SelectItem>
                <SelectItem value="partnership" className="text-white">
                  Partnership Inquiry
                </SelectItem>
                <SelectItem value="defensibility" className="text-white">
                  Academic Defensibility
                </SelectItem>
                <SelectItem value="other" className="text-white">
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-200 mb-2">
              Message *
            </label>
            <Textarea
              id="message"
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className="w-full resize-none bg-white border-white text-white"
              placeholder="Tell us how we can help you..."
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 btn-glow"
            disabled={isSubmitting}>
            {isSubmitting ? (
              <>Sending Message...</>
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
  );
}

// Alternative Contact Info
function AlternativeContactInfo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <Card className="border border-white shadow-lg text-center bg-white">
        <CardContent className="p-6">
          <Mail className="h-8 w-8 text-blue-400 mx-auto mb-4" />
          <h3 className="font-semibold text-white mb-2">Email</h3>
          <p className="text-sm text-gray-200">hello@scholarforgeai.com</p>
        </CardContent>
      </Card>

      <Card className="border border-white shadow-lg text-center bg-white">
        <CardContent className="p-6">
          <MapPin className="h-8 w-8 text-green-400 mx-auto mb-4" />
          <h3 className="font-semibold text-white mb-2">Address</h3>
          <p className="text-sm text-gray-200">
            San Francisco, CA
            <br />
            United States
          </p>
        </CardContent>
      </Card>

      <Card className="border border-white shadow-lg text-center bg-white">
        <CardContent className="p-6">
          <Globe className="h-8 w-8 text-purple-400 mx-auto mb-4" />
          <h3 className="font-semibold text-white mb-2">Global</h3>
          <p className="text-sm text-gray-200">
            Serving students
            <br />
            worldwide 24/7
          </p>
        </CardContent>
      </Card>

      <Card className="border border-white shadow-lg text-center bg-white">
        <CardContent className="p-6">
          <div className="flex justify-center space-x-3 mb-4">
            <Twitter className="h-6 w-6 text-blue-400" />
            <Linkedin className="h-6 w-6 text-blue-500" />
            <Github className="h-6 w-6 text-gray-200" />
          </div>
          <h3 className="font-semibold text-white mb-2">Social</h3>
          <p className="text-sm text-gray-200">Follow us for updates</p>
        </CardContent>
      </Card>
    </div>
  );
}

// FAQ Teaser
function FAQTeaser() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/help");
  };

  const faqs = [
    {
      question: "How quickly do you respond to messages?",
      answer:
        "We typically respond to all inquiries within 24 hours during business days. For urgent technical issues, our response time is usually within 4-6 hours.",
    },
    {
      question: "Do you offer phone support?",
      answer:
        "Phone support is available for Researcher plan subscribers. All other users can reach us via email, and we're happy to schedule a call if needed.",
    },
    {
      question: "Can you help with institutional partnerships?",
      answer:
        "Absolutely! We work with universities and institutions worldwide. Contact our partnerships team at partnerships@scholarforgeai.com for custom solutions.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-2xl font-bold text-white mb-8 text-center">
        Quick Answers
      </h3>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={index} className="border border-white bg-white">
            <CardContent className="p-0">
              <button
                className="w-full p-6 text-left flex items-center justify-between hover:bg-white transition-colors"
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}>
                <h4 className="font-semibold text-white pr-4">
                  {faq.question}
                </h4>
                {openFAQ === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-200" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-200" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-200 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button
          variant="outline"
          className="gap-2 bg-white border-white text-white hover:bg-white"
          onClick={handleGetStarted}>
          Visit Help Center
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Global Presence Map (Simple representation)
function GlobalPresence() {
  return (
    <Card className="border border-gray-200 shadow-lg overflow-hidden bg-white">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <Globe className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Serving Students Globally
          </h3>
          <p className="text-gray-200">
            Join thousands of students across 15+ countries who trust
            ScholarForge AI
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-200">
          {[
            "🇺🇸 United States",
            "🇬🇧 United Kingdom",
            "🇨🇦 Canada",
            "🇦🇺 Australia",
            "🇩🇪 Germany",
            "🇫🇷 France",
            "🇪🇸 Spain",
            "🇮🇹 Italy",
            "🇯🇵 Japan",
            "🇰🇷 South Korea",
            "🇮🇳 India",
            "🇧🇷 Brazil",
            "🇲🇽 Mexico",
            "🇿🇦 South Africa",
            "🇳🇱 Netherlands",
          ].map((country, index) => (
            <span key={index} className="px-3 py-1 bg-white rounded-full">
              {country}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Closing CTA
function ClosingCTA() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <Card className="border border-gray-500 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
      <CardContent className="p-12 text-center">
        <MessageCircle className="h-16 w-16 text-blue-400 mx-auto mb-6" />

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Don't Let Questions Hold You Back
        </h2>

        <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
          Whether you're just curious about our five core functionalities for
          academic defensibility or ready to transform your academic workflow,
          we're here to help you succeed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold px-8 py-6 btn-glow">
            <Headphones className="mr-2 h-5 w-5" />
            Get Support
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleGetStarted}
            className="border-gray-500 text-white hover:bg-gray-900 px-8 py-6">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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

      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Other Ways to Reach Us
          </h2>
          <AlternativeContactInfo />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <FAQTeaser />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <GlobalPresence />
        </div>
      </section>

      <section className="py-16 bg-[#121212]">
        <div className="container-custom">
          <ClosingCTA />
        </div>
      </section>
    </Layout>
  );
}
