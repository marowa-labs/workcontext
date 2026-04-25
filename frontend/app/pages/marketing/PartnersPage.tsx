"use client";

import React from "react";
import {
  Handshake,
  Users,
  Globe,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useToast } from "../../hooks/use-toast";

// Intro Hero Section
function IntroHero() {
  const handlePartnerInquiry = () => {
    // Scroll to the contact form
    const element = document.getElementById("partner-inquiry");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
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
            Academic Defensibility Partnership with{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              ScholarForge AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Collaborate with us to enhance academic defensibility for students,
            researchers, and institutions worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 btn-glow px-8 py-6"
              onClick={handlePartnerInquiry}>
              Become a Partner
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 border border-white text-white hover:bg-white"
              asChild>
              <Link href="/company/about">Learn About Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Partnership Types
function PartnershipTypes() {
  const partnershipTypes = [
    {
      icon: Handshake,
      title: "Defensibility Technology Partners",
      description:
        "Integrate your tools with our academic defensibility platform to enhance originality and citation verification.",
      benefits: [
        "API access to core defensibility tools",
        "Co-marketing opportunities",
        "Joint solution development for academic defensibility",
        "Technical support and training",
      ],
    },
    {
      icon: Users,
      title: "Academic Institutions",
      description:
        "Provide ScholarForge AI's defensibility tools to your students and faculty with special institutional pricing and support.",
      benefits: [
        "Volume discounts and licensing",
        "Dedicated account management",
        "Campus-wide deployment support",
        "Custom integration assistance for academic workflows",
      ],
    },
    {
      icon: Globe,
      title: "Research Partners",
      description:
        "Collaborate on advancing academic defensibility research and tools.",
      benefits: [
        "Access to defensibility research data",
        "Joint research publication opportunities",
        "Collaborative tool development",
        "Shared academic credibility",
      ],
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Partnership Opportunities
          </h2>
          <p className="text-lg text-gray-200">
            We offer various partnership models to suit different organizational
            needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {partnershipTypes.map((type, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-white">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6">
                <type.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {type.title}
              </h3>
              <p className="text-gray-200 mb-6">{type.description}</p>
              <ul className="space-y-3">
                {type.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Partner Benefits
function PartnerBenefits() {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Academic Impact",
      description:
        "Access new academic institutions and research communities through our partnership programs.",
    },
    {
      icon: Shield,
      title: "Defensibility Credibility",
      description:
        "Leverage our established reputation in academic defensibility.",
    },
    {
      icon: Zap,
      title: "Defensibility Innovation",
      description:
        "Stay at the forefront of academic defensibility technology with our cutting-edge tools.",
    },
    {
      icon: Users,
      title: "Academic Support",
      description:
        "Benefit from our dedicated partner success team and academic resources.",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Partner for Academic Defensibility?
          </h2>
          <p className="text-lg text-gray-200">
            Our partners benefit from our growth and success in the academic
            defensibility market.
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

// Success Stories
function SuccessStories() {
  const stories = [
    {
      name: "University Academic Press",
      logo: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=100&h=100&fit=crop",
      quote:
        "Partnering with ScholarForge AIhas transformed how we support our authors through the publication process.",
      impact: "35% increase in manuscript submissions",
    },
    {
      name: "Research Institute Network",
      logo: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=100&h=100&fit=crop",
      quote:
        "The integration with ScholarForge AIhas streamlined our collaborative research workflows significantly.",
      impact: "50% reduction in project completion time",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Academic Defensibility Success Stories
          </h2>
          <p className="text-lg text-gray-200">
            Hear from organizations that have enhanced academic defensibility
            with us.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {stories.map((story, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-white">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={story.logo}
                  alt={story.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold text-white">{story.name}</h3>
                </div>
              </div>
              <blockquote className="text-gray-200 italic mb-6">
                "{story.quote}"
              </blockquote>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-400">
                  {story.impact}
                </span>
                <ArrowRight className="h-5 w-5 text-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Partner Inquiry Form
function PartnerInquiryForm() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to an API
    toast({
      title: "Partnership Inquiry Submitted",
      description:
        "Thank you for your partnership inquiry! We'll contact you shortly.",
    });
  };

  return (
    <section
      id="partner-inquiry"
      className="section-padding bg-[#121212] relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-indigo-900/30"></div>
      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Start an Academic Defensibility Partnership
            </h2>
            <p className="text-lg text-gray-200">
              Tell us about your organization and defensibility partnership
              interests.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="organization"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    required
                    className="w-full px-4 py-3 bg-white border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                    placeholder="Your organization name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    required
                    className="w-full px-4 py-3 bg-white border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 bg-white border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-white border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                    placeholder="your.email@organization.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="partnershipType"
                  className="block text-sm font-medium text-gray-200 mb-2">
                  Partnership Type
                  <span className="text-gray-200 font-normal ml-1">
                    (Select all that apply)
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    "Defensibility Technology Partner",
                    "Academic Institution",
                    "Research Partner",
                    "Other",
                  ].map((type) => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`type-${type}`}
                        name="partnershipType"
                        value={type}
                        className="h-4 w-4 text-blue-600 border-white rounded focus:ring-blue-500 bg-white"
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="ml-2 text-gray-200">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-200 mb-2">
                  How can we partner?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-white border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  placeholder="Tell us about your organization and partnership interests..."></textarea>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 btn-glow px-8 py-6">
                  Submit Partnership Inquiry
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PartnersPage() {
  return (
    <Layout>
      <IntroHero />
      <PartnershipTypes />
      <PartnerBenefits />
      <SuccessStories />
      <PartnerInquiryForm />
    </Layout>
  );
}
