"use client";

import {
  Heart,
  Users,
  Globe,
  Award,
  Target,
  Shield,
  Handshake,
  ArrowRight,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";

// Hero Section
function AboutHero() {
  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=800&fit=crop')",
          zIndex: 0,
        }}></div>

      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-gray-200xl">🎓</div>
        <div className="absolute top-40 right-20 text-4xl">📚</div>
        <div className="absolute bottom-40 left-1/4 text-5xl">✨</div>
        <div className="absolute bottom-20 right-10 text-3xl">🚀</div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Academic Excellence.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Defensible Writing.
            </span>{" "}
            Empowered by AI.
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto">
            We believe every academic deserves tools that ensure their work is
            original, properly cited, and defensible. That's why we built
            ScholarForge AI- to provide the five core functionalities needed for
            academic success: The Explainable Originality Map, Citation
            Confidence Auditor, Submission-Safe Writing Mode, Defensibility Log,
            and One-Click Publication Suite.
          </p>
        </div>
      </div>
    </section>
  );
}

// Our Story Section
function OurStory() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            Our Story
          </h2>

          <div className="prose prose-lg mx-auto text-gray-200 leading-relaxed space-y-6">
            <p>
              It started with a critical need in academic writing. Our founders
              recognized that students and researchers lacked comprehensive
              tools to ensure their work was academically sound and defensible.
              They needed solutions for plagiarism detection, citation
              validation, AI-written content identification, authorship
              verification, and publication formatting - all in one integrated
              platform.
            </p>

            <p>
              They imagined a world where academic integrity could be maintained
              without sacrificing productivity. A place where researchers could
              focus on their ideas while having confidence in the defensibility
              of their work. Where quality academic support wasn't a luxury, but
              a standard.
            </p>

            <p>
              That vision became ScholarForge AI. We've spent years perfecting
              five core functionalities: The Explainable Originality Map for
              comprehensive plagiarism detection, Citation Confidence Auditor
              for validating references, Submission-Safe Writing Mode with AI
              detection and humanizing suggestions, Defensibility Log for
              authorship certificates, and One-Click Publication Suite for
              automated formatting. Every feature we build is tested by real
              students facing real deadlines.
            </p>

            <p>
              Today, we're proud to serve over 10,000 students across 15+
              countries, from undergraduate freshmen to PhD researchers. But
              this is just the beginning of our journey to transform academic
              writing for everyone.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Mission Section
function OurMission() {
  return (
    <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/20"></div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <Target className="h-16 w-16 text-blue-400 mx-auto mb-6" />

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Our Mission
          </h2>

          <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed font-medium">
            To democratize academic defensibility by making world-class writing
            integrity tools accessible to every student, regardless of their
            background or budget.
          </p>

          <p className="text-lg text-gray-200 leading-relaxed max-w-3xl mx-auto">
            We believe that great ideas deserve defensible expression. By
            providing comprehensive tools for originality mapping, citation
            validation, AI detection, authorship verification, and publication
            formatting, we empower students to focus on what matters most:
            thinking critically, exploring new frontiers, and contributing
            meaningful knowledge to the world with confidence in their work's
            integrity.
          </p>
        </div>
      </div>
    </section>
  );
}

// Impact Stats Section
function ImpactStats() {
  const stats = [
    {
      icon: Users,
      number: "10,000+",
      label: "Students Served",
      description: "Across all academic levels",
    },
    {
      icon: BookOpen,
      number: "20+",
      label: "Universities",
      description: "Partner institutions",
    },
    {
      icon: Globe,
      number: "15+",
      label: "Countries",
      description: "Global reach",
    },
    {
      icon: TrendingUp,
      number: "50M+",
      label: "Words Processed",
      description: "Through our core features",
    },
  ];
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Impact by Numbers
          </h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Every day, we help students around the world achieve their academic
            goals and express their ideas with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="text-center border border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-6">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {stat.number}
                </h3>
                <p className="text-lg font-semibold text-gray-200 mb-2">
                  {stat.label}
                </p>
                <p className="text-gray-200 text-sm">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Values Section
function OurValues() {
  const values = [
    {
      icon: Heart,
      title: "Academic Integrity First",
      description:
        "Quality academic integrity tools shouldn't be a privilege. We design for affordability and ensure our platform provides comprehensive originality and defensibility tools for students with diverse needs and backgrounds.",
    },
    {
      icon: Shield,
      title: "Transparent Defensibility",
      description:
        "Our tools provide clear, explainable insights into originality, citations, and authorship. We're committed to transparency that helps students understand and defend their work.",
    },
    {
      icon: Handshake,
      title: "Defensible Collaboration",
      description:
        "We believe in collaborative research that maintains clear authorship and integrity. Our platform enables teamwork while preserving the defensibility of individual contributions.",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Values Guide Everything We Do
          </h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            These principles shape every feature we build, every decision we
            make, and every interaction we have with our community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <Card
              key={index}
              className="border border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-6">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-200 leading-relaxed">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Team Section (Optional - keeping simple)
function MeetTheTeam() {
  const teamMembers = [
    {
      name: "Dr. Zviko Musembwa",
      role: "Co-Founder & CEO",
      bio: "Former Stanford researcher with a passion for democratizing education technology.",
      imageUrl:
        "https://physicaleducationandwellness.mit.edu/wp-content/uploads/Untitled-1.png?w=400&h=400&fit=crop&crop=face",
    },
    {
      name: "Dr. Elvis Davis",
      role: "Co-Founder & CTO",
      bio: "MIT computer science graduate who believes technology should empower human creativity.",
      imageUrl:
        "https://image2url.com/images/1765103864786-401e7862-6e8d-430f-bb22-f7ae623a379c.jpeg?w=400&h=400&fit=crop&crop=face",
    },
    {
      name: "Dr. Craig Marowa",
      role: "Head of AI Research",
      bio: "Leading expert in natural language processing with a focus on educational applications.",
      imageUrl:
        "https://image2url.com/images/1765104273035-d55b2896-44f3-4dc4-9407-8cb97e496b15.jpeg?w=400&h=400&fit=crop&crop=face",
    },
  ];
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Meet the Team
          </h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            We're a diverse group of educators, researchers, and technologists
            united by a common goal: helping students succeed.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">
            Founders
          </h3>
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            {/* Dr. Craig Marowa Image */}
            <div className="relative w-full md:w-1/2 h-64 rounded-lg">
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat rounded-lg"
                style={{
                  backgroundImage:
                    "url('https://image2url.com/images/1765104273035-d55b2896-44f3-4dc4-9407-8cb97e496b15.jpeg')",
                }}></div>
              {/* Overlay to ensure text is readable on top of background image */}
              <div className="absolute inset-0 bg-white bg-opacity-30 rounded-lg"></div>
              {/* Text content positioned over the background image */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
                <h4 className="text-xl font-bold text-white mb-2">
                  Dr. Craig Marowa
                </h4>
                <p className="text-md text-white max-w-md mx-auto">
                  Head of AI Research
                </p>
              </div>
            </div>

            {/* Dr. Elvis Davis Image */}
            <div className="relative w-full md:w-1/2 h-64 rounded-lg">
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat rounded-lg"
                style={{
                  backgroundImage:
                    "url('https://image2url.com/images/1765103864786-401e7862-6e8d-430f-bb22-f7ae623a379c.jpeg')",
                }}></div>
              {/* Overlay to ensure text is readable on top of background image */}
              <div className="absolute inset-0 bg-white bg-opacity-30 rounded-lg"></div>
              {/* Text content positioned over the background image */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
                <h4 className="text-xl font-bold text-white mb-2">
                  Dr. Elvis Davis
                </h4>
                <p className="text-md text-white max-w-md mx-auto">
                  Co-Founder & CTO
                </p>
              </div>
            </div>
          </div>

          {/* Original Founders Description */}
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-200 max-w-2xl mx-auto px-4">
              Dr. Craig Marowa and Dr. Zviko Musembwa founded ScholarForge AIto
              democratize access to quality academic tools for students of all
              academic levels.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="border border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
              <CardContent className="p-8 text-center">
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-6 object-cover"
                />
                <h3 className="text-xl font-semibold text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-blue-400 font-medium mb-4">{member.role}</p>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {member.bio}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Closing CTA
function ClosingCTA() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section className="section-padding bg-[#121212]">
      <div className="container-custom">
        <Card className="border border-white shadow-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
          <CardContent className="p-12 text-center">
            <Award className="h-16 w-16 text-yellow-400 mx-auto mb-6" />

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              We're Just Getting Started
            </h2>

            <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Every day, we're working to make academic writing more accessible,
              collaborative, and effective. Join us on this journey to transform
              education technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-semibold px-8 py-6 btn-glow"
                onClick={handleGetStarted}>
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white px-8 py-6"
                onClick={() =>
                  window.open(
                    "https://calendly.com/audacityimpact/30min",
                    "_blank",
                  )
                }>
                Schedule a Demo
              </Button>
            </div>

            <p className="text-gray-200 text-sm mt-6">
              Join our community of learners, researchers, and innovators
            </p>
            <div className="mt-4">
              <a
                href="https://discord.gg/2MMSdX3Uee"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-white/50 text-white rounded-lg hover:bg-white/50 transition-colors border border-white">
                <Users className="h-4 w-4 mr-2" />
                Join Our Discord Community
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <Layout>
      <AboutHero />
      <OurStory />
      <OurMission />
      <ImpactStats />
      <OurValues />
      <MeetTheTeam />
      <ClosingCTA />
    </Layout>
  );
}
