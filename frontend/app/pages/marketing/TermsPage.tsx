"use client";

import Link from "next/link";
import { FileText, CheckCircle, AlertCircle, Shield, Scale, FileWarning, Gavel, RefreshCw, Mail } from "lucide-react";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/docs" className="text-sm font-medium text-primary hover:underline">
              Documentation
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-muted-foreground text-sm font-medium ml-1 md:ml-2">Terms of Service</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-12">
        <div className="text-center">
          <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Terms of Service</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-none">
        {/* Section 1 */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-8 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground mb-4">
            By accessing or using WorkContext ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
          </p>
          <p className="text-muted-foreground">
            These Terms apply to all visitors, users, and others who access or use the Service. By accessing or using the Service, you agree to be bound by these Terms.
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-8 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">2. Description of Service</h2>
          <p className="text-muted-foreground mb-4">
            WorkContext is a context-aware productivity workspace for individuals and teams that provides tools for:
          </p>
          <ul className="space-y-2 mb-4">
            {[
              "AI-powered writing assistance and chat",
              "Task management with priorities, assignees, and due dates",
              "Document editing with real-time collaboration",
              "Multi-format export (PDF, DOCX, LaTeX, RTF, TXT)",
              "Time tracking and progress monitoring",
              "Team workspaces with role-based access",
            ].map((item, i) => (
              <li key={i} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3 */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-8 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">3. Account Terms</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">3.1 Account Registration</h3>
              <p className="text-muted-foreground">
                You must register for an account to access certain features of the Service. You agree to provide accurate, current, and complete information during registration.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">3.2 Account Security</h3>
              <p className="text-muted-foreground">
                You are responsible for maintaining the security of your account and password. You are fully responsible for all activities that occur under your account.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">3.3 Account Restrictions</h3>
              <p className="text-muted-foreground">
                You may not use the Service for any illegal or unauthorized purpose. You may not, in the use of the Service, violate any laws in your jurisdiction.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-8 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">4. Intellectual Property</h2>
          <p className="text-muted-foreground mb-4">
            The Service and its original content, features, and functionality are and will remain the exclusive property of WorkContext and its licensors. The Service is protected by copyright, trademark, and other laws.
          </p>
          <p className="text-muted-foreground">
            Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of WorkContext.
          </p>
        </div>

        {/* Section 5 */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-8 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">5. Content Policy</h2>
          <p className="text-muted-foreground mb-4">
            We respect the intellectual property rights of others. If you believe that any content on our Service infringes upon your copyrights, please contact us with a detailed notice of the alleged infringement.
          </p>
          <p className="text-muted-foreground">
            We reserve the right to remove any content that violates these Terms or applicable law, without prior notice.
          </p>
        </div>

        {/* Section 6 */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-8 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">6. Termination</h2>
          <p className="text-muted-foreground mb-4">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach the Terms.
          </p>
          <p className="text-muted-foreground">
            Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
          </p>
        </div>

        {/* Section 7 */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-8 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">7. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            In no event shall WorkContext, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses.
          </p>
        </div>

        {/* Section 8 */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-8 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">8. Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms shall be governed and construed in accordance with the laws applicable in your jurisdiction, without regard to its conflict of law provisions.
          </p>
        </div>

        {/* Section 9 */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-8 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">9. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-card border border-border rounded-2xl p-8 mt-12">
          <div className="text-center max-w-2xl mx-auto">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Contact Us</h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions about these Terms of Service, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:legal@WorkContextai.com" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium text-center">
                Email Legal Team
              </a>
              <Link href="/docs" className="px-6 py-3 border border-border rounded-lg font-medium text-center text-foreground hover:bg-muted">
                Back to Documentation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
