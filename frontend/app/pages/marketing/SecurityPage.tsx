"use client";

import React from "react";
import { Shield, Lock, Key, Eye, Server, Zap, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";

// Intro Hero Section
function IntroHero() {
  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=800&fit=crop')",
        }}></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Academic Defensibility{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Security
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Last updated: November 22, 2025
          </p>

          <p className="text-gray-200 max-w-2xl mx-auto">
            We take the security of your academic work seriously. Learn about
            the measures we implement to protect your research and ensure
            defensibility.
          </p>
        </div>
      </div>
    </section>
  );
}

// Security Practices
function SecurityPractices() {
  const practices = [
    {
      icon: Lock,
      title: "Research Data Protection",
      description:
        "All your research data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
      details: [
        "End-to-end encryption for sensitive research communications",
        "Regular key rotation and management",
        "Industry-standard cryptographic protocols",
      ],
    },
    {
      icon: Key,
      title: "Defensible Access Control",
      description:
        "Multi-factor authentication and role-based access controls protect your research and ensure authorship integrity.",
      details: [
        "Two-factor authentication (2FA) available for all accounts",
        "Single sign-on (SSO) integration for enterprise users",
        "Role-based permissions for team collaboration with authorship tracking",
        "Session management and automatic logout",
      ],
    },
    {
      icon: Eye,
      title: "Defensibility Monitoring",
      description:
        "Continuous monitoring to identify and respond to threats that could compromise your research integrity.",
      details: [
        "24/7 security monitoring and alerting",
        "Intrusion detection and prevention systems",
        "Anomaly detection for suspicious activities",
        "Regular penetration testing and vulnerability assessments",
      ],
    },
    {
      icon: Server,
      title: "Research Infrastructure Security",
      description:
        "Our infrastructure follows security best practices and is regularly audited to ensure research integrity.",
      details: [
        "Cloud infrastructure with built-in security features",
        "Regular security patches and updates",
        "Network segmentation and firewall protection",
        "Disaster recovery and backup systems for research data",
      ],
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Defensibility Security Measures
          </h2>
          <p className="text-lg text-gray-200">
            We implement comprehensive security practices to protect your
            research data and ensure academic defensibility.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {practices.map((practice, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-white">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6">
                <practice.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {practice.title}
              </h3>
              <p className="text-gray-200 mb-4">{practice.description}</p>
              <ul className="space-y-2">
                {practice.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">{detail}</span>
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

// Compliance & Certifications
function ComplianceCertifications() {
  const certifications = [
    {
      title: "GDPR Compliance",
      description:
        "We meet the requirements of the General Data Protection Regulation.",
    },
    {
      title: "SOC 2 Type II",
      description:
        "Our security practices are audited and certified under SOC 2 standards.",
    },
    {
      title: "ISO 27001",
      description:
        "We follow internationally recognized information security management standards.",
    },
    {
      title: "HIPAA Compliant",
      description:
        "Our platform can be configured to meet HIPAA requirements for healthcare data.",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Academic Defensibility Compliance
          </h2>
          <p className="text-lg text-gray-200">
            We maintain the highest standards of security and compliance for
            academic research.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {certifications.map((cert, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg text-center border border-white">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {cert.title}
              </h3>
              <p className="text-gray-200">{cert.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Incident Response
function IncidentResponse() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Academic Research Security Response
            </h2>
            <p className="text-lg text-gray-200">
              Our approach to handling security incidents that could affect
              research integrity.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900/50 mb-4">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Detection</h3>
                <p className="text-gray-200">
                  We continuously monitor our systems for potential security
                  incidents using automated tools and manual reviews.
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900/50 mb-4">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Response</h3>
                <p className="text-gray-200">
                  Our security team responds to incidents within 2 hours and
                  works to contain and remediate threats immediately.
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900/50 mb-4">
                  <Eye className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Communication
                </h3>
                <p className="text-gray-200">
                  We notify affected users and authorities as required by law
                  within 72 hours of confirming a data breach.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Reporting Security Issues
function ReportingSecurityIssues() {
  return (
    <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Report a Security Issue
          </h2>
          <p className="text-lg text-gray-200 mb-8">
            Help us improve our academic research security by responsibly
            disclosing vulnerabilities.
          </p>

          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-white">
            <p className="text-gray-200 mb-6">
              If you believe you've found a security vulnerability in our
              service, please contact our security team:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border-none">
                security@scholarforgeai.com
              </Button>
              <Button
                variant="outline"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border-none"
                asChild>
                <Link href="/contact">Contact Form</Link>
              </Button>
            </div>
            <p className="text-gray-200 text-sm mt-6">
              We appreciate responsible disclosure and will acknowledge your
              contribution to our security.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SecurityPage() {
  return (
    <Layout>
      <IntroHero />
      <SecurityPractices />
      <ComplianceCertifications />
      <IncidentResponse />
      <ReportingSecurityIssues />
    </Layout>
  );
}
