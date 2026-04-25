"use client";

import {
  Calendar,
  Users,
  Zap,
  FileText,
  BarChart3,
  Shield,
  Clock,
  Mail,
  Phone,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";

import { useState } from "react";
import { useToast } from "../../hooks/use-toast";

// Intro Hero Section
function IntroHero() {
  return (
    <>
      <section className="section-padding bg-[#121212] relative overflow-hidden">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop')",
          }}></div>
        <div className="container-custom relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
              Master Academic Defensibility with a{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Personalized Demo
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
              Experience how ScholarForge AI's core defensibility tools can
              transform your academic workflow. Schedule a 30-minute
              personalized demo with our academic defensibility experts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 btn-glow px-8 py-6"
                onClick={() =>
                  window.open(
                    "https://calendly.com/audacityimpact/30min",
                    "_blank",
                  )
                }>
                Schedule Your Demo
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold px-8 py-6"
                asChild>
                <Link href="/features">Explore Features</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Demo Benefits
function DemoBenefits() {
  const benefits = [
    {
      icon: Zap,
      title: "Personalized Experience",
      description:
        "See features relevant to your specific academic needs and workflow.",
    },
    {
      icon: Clock,
      title: "30 Minutes",
      description: "Concise, focused demo that fits into your busy schedule.",
    },
    {
      icon: Users,
      title: "Expert Guidance",
      description: "Learn best practices from our product specialists.",
    },
    {
      icon: CheckCircle,
      title: "No Commitment",
      description: "See the product in action with no pressure to purchase.",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Schedule a Demo?
          </h2>
          <p className="text-lg text-gray-200">
            A personalized demo is the best way to understand how ScholarForge
            AIcan benefit your specific academic workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg text-center border border-white">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6">
                <benefit.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-200">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Demo Features
function DemoFeatures() {
  const features = [
    {
      title: "The Explainable Originality Map",
      description:
        "See how our advanced plagiarism detection creates visual maps of content originality.",
      icon: Shield,
    },
    {
      title: "The Citation Confidence Auditor",
      description:
        "Experience how our citation verification ensures academic integrity.",
      icon: BarChart3,
    },
    {
      title: "Submission-Safe Writing Mode",
      description:
        "Learn how our AI detection tools ensure your work remains academically defensible.",
      icon: FileText,
    },
    {
      title: "The Defensibility Log",
      description:
        "Understand how our authorship certificates protect your academic work.",
      icon: Users,
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Core Defensibility Tools Demo
          </h2>
          <p className="text-lg text-gray-200">
            Our 30-minute demo covers the academic defensibility tools that
            matter most to researchers and academics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-white">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900/50 mb-6">
                <feature.icon className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-200">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Schedule Form
function ScheduleForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    role: "",
    date: "",
    time: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (
        !formData.name ||
        !formData.email ||
        !formData.institution ||
        !formData.date ||
        !formData.time
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          institution: formData.institution,
          role: formData.role,
          date: formData.date,
          time: formData.time,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Demo Scheduled!",
          description:
            "We've received your request and will contact you shortly.",
        });
        // Reset form
        setFormData({
          name: "",
          email: "",
          institution: "",
          role: "",
          date: "",
          time: "",
          message: "",
        });
      } else {
        toast({
          title: "Error",
          description:
            data.error || "Failed to schedule demo. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule demo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Schedule Your Personalized Demo
            </h2>
            <p className="text-lg text-gray-200">
              Fill out the form below and we'll contact you to schedule your
              30-minute demo.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-white"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-white"
                    placeholder="your.email@institution.edu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="institution"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Institution *
                  </label>
                  <input
                    type="text"
                    id="institution"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-white"
                    placeholder="Your university or institution"
                  />
                </div>
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-white">
                    <option value="" className="bg-white">
                      Select your role
                    </option>
                    <option value="student" className="bg-white">
                      Student
                    </option>
                    <option value="researcher" className="bg-white">
                      Researcher
                    </option>
                    <option value="professor" className="bg-white">
                      Professor
                    </option>
                    <option value="administrator" className="bg-white">
                      Administrator
                    </option>
                    <option value="other" className="bg-white">
                      Other
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Preferred Time *
                  </label>
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-white">
                    <option value="" className="bg-white">
                      Select a time
                    </option>
                    <option value="morning" className="bg-white">
                      Morning (9:00 AM - 12:00 PM)
                    </option>
                    <option value="afternoon" className="bg-white">
                      Afternoon (12:00 PM - 5:00 PM)
                    </option>
                    <option value="evening" className="bg-white">
                      Evening (5:00 PM - 8:00 PM)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-200 mb-2">
                  What would you like to focus on during the demo?
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-white"
                  placeholder="Let us know what features or workflows are most important to you..."></textarea>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 btn-glow px-8 py-6">
                  {isLoading ? "Scheduling..." : "Schedule Demo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// Contact Info
function ContactInfo() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "demo@scholarforgeai.com",
      action: "mailto:demo@scholarforgeai.com",
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "+91 90635 86568 or +91 87908 13536",
      action: "#",
      isPhone: true,
    },
    {
      icon: Calendar,
      title: "Book Directly",
      description: "Schedule via Calendly",
      action: "https://calendly.com/audacityimpact/30min",
    },
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Academic Defensibility Experts
          </h2>
          <p className="text-lg text-gray-200">
            Reach out to us through any of these channels and our academic
            defensibility experts will help you schedule a demo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contactMethods.map((method, index) =>
            method.isPhone ? (
              <button
                key={index}
                onClick={() => {
                  // Try primary number first
                  window.location.href = "tel:+919063586568";
                  // Set a timeout to try secondary number if primary fails
                  setTimeout(() => {
                    window.location.href = "tel:+918790813536";
                  }, 3000);
                }}
                className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 text-center hover:bg-white/50 transition-colors duration-300 cursor-pointer w-full border border-white">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900/50 mb-6">
                  <method.icon className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {method.title}
                </h3>
                <p className="text-gray-200">{method.description}</p>
              </button>
            ) : (
              <a
                key={index}
                href={method.action}
                className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 text-center hover:bg-white/50 transition-colors duration-300 border border-white"
                {...(method.action.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900/50 mb-6">
                  <method.icon className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {method.title}
                </h3>
                <p className="text-gray-200">{method.description}</p>
              </a>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export default function ScheduleDemoPage() {
  return (
    <Layout>
      <IntroHero />
      <DemoBenefits />
      <DemoFeatures />
      <ScheduleForm />
      <ContactInfo />
    </Layout>
  );
}
