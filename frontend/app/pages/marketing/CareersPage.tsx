"use client";

import {
  Users,
  Trophy,
  MapPin,
  Clock,
  DollarSign,
  Heart,
  Award,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";

// Intro Hero Section
function IntroHero() {
  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=1200&h=800&fit=crop')",
        }}></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Build the Future of{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Academic Innovation
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Join a passionate team dedicated to transforming how students and
            researchers write, collaborate, and discover knowledge.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 btn-glow px-8 py-6"
              onClick={() => {
                const element = document.getElementById("open-positions");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}>
              View Open Positions
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

// Company Culture
function CompanyCulture() {
  const cultureItems = [
    {
      icon: Heart,
      title: "Mission-Driven",
      description:
        "We're passionate about empowering academics to achieve their best work.",
    },
    {
      icon: Users,
      title: "Collaborative",
      description:
        "We believe the best ideas emerge from diverse perspectives working together.",
    },
    {
      icon: Zap,
      title: "Innovative",
      description:
        "We encourage experimentation and learning from both successes and failures.",
    },
    {
      icon: Trophy,
      title: "Impactful",
      description:
        "We measure our success by the positive impact we have on academic communities.",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Culture
          </h2>
          <p className="text-lg text-gray-200">
            We foster an environment where innovation thrives and individuals
            grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cultureItems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg text-center border border-white">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6">
                <item.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-200">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Benefits
function Benefits() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Compensation",
      description:
        "Salary and equity packages that align with our growth and your contributions.",
    },
    {
      icon: Award,
      title: "Professional Development",
      description:
        "Continuous learning opportunities and conference attendance support.",
    },
    {
      icon: Clock,
      title: "Flexible Work",
      description:
        "Remote work options and flexible schedules to support work-life balance.",
    },
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health insurance and wellness programs.",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why You'll Love Working Here
          </h2>
          <p className="text-lg text-gray-200">
            We invest in our team's success and well-being.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-white">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white mb-6">
                <benefit.icon className="h-6 w-6 text-blue-400" />
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

// Open Positions
function OpenPositions() {
  const positions = [
    {
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description:
        "Build and maintain our web application with React, TypeScript, and modern frontend technologies.",
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "San Francisco, CA",
      type: "Full-time",
      description:
        "Lead product strategy and roadmap for our academic collaboration platform.",
    },
    {
      title: "AI Research Scientist",
      department: "Research",
      location: "Remote",
      type: "Full-time",
      description:
        "Develop cutting-edge AI models to assist academic writing and research workflows.",
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "New York, NY",
      type: "Full-time",
      description:
        "Help our academic users achieve success with our platform through onboarding and ongoing support.",
    },
  ];

  return (
    <section id="open-positions" className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Open Positions
          </h2>
          <p className="text-lg text-gray-200">
            Join us in building tools that empower the next generation of
            researchers and scholars.
          </p>
        </div>

        <div className="space-y-6">
          {positions.map((position, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-white">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-bold text-white">
                  {position.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm">
                    {position.department}
                  </span>
                  <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm">
                    {position.type}
                  </span>
                  <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {position.location}
                  </span>
                </div>
              </div>
              <p className="text-gray-200 mb-6">{position.description}</p>
              <Button
                variant="outline"
                className="border border-white text-white hover:bg-white">
                Apply Now
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Closing CTA
function ClosingCTA() {
  return (
    <section className="section-padding bg-[#121212] relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-indigo-900/30"></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-lg text-gray-200 mb-8">
            Join our team and help shape the future of academic innovation.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold px-8 py-6 btn-glow border border-white"
            onClick={() => {
              const element = document.getElementById("open-positions");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }}>
            View All Positions
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function CareersPage() {
  return (
    <Layout>
      <IntroHero />
      <CompanyCulture />
      <Benefits />
      <OpenPositions />
      <ClosingCTA />
    </Layout>
  );
}
