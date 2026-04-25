"use client";

import Link from "next/link";
import {
  Shield,
  Lock,
  Key,
  Eye,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const SecurityPage = () => {
  // Mock plan styling classes
  const planDocContentClasses = {
    container: "prose prose-gray max-w-none dark:prose-invert",
    heading: "text-2xl font-bold text-black text-black mb-4",
    subheading: "text-xl font-semibold text-black dark:text-black mb-3",
    paragraph: "text-black dark:text-black mb-4",
    listItem: "text-black dark:text-black mb-2",
  };

  const planDocHeadingClasses = "text-3xl font-bold text-black text-black mb-6";
  const planDocLinkClasses =
    "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline";
  const planCardClasses =
    "bg-white dark:bg-white rounded-lg shadow-md p-6 border border-white border-white";

  return (
    <div className={`min-h-screen ${planDocContentClasses.container}`}>
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/docs"
              className={`text-sm font-medium ${planDocLinkClasses}`}>
              Documentation
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-black"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-black text-sm font-medium ml-1 md:ml-2">
                Security
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mb-12 dark:bg-blue-900/20 border-white-800">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1
            className={`text-3xl md:text-4xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Security Practices
          </h1>
          <p className="text-xl text-black max-w-3xl mx-auto dark:text-black">
            Learn about how we protect your academic work and personal
            information
          </p>
        </div>
      </div>

      {/* Security Overview */}
      <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-12`}>
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Our Commitment to Security
        </h2>
        <p className="text-black mb-6 dark:text-black">
          At ScholarForge AI, we understand that your academic work is valuable
          and sensitive. We implement comprehensive security measures to protect
          your data, documents, and personal information.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg dark:bg-blue-900/30">
            <Lock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
              Data Encryption
            </h3>
            <p className="text-black text-sm dark:text-black">
              All data is encrypted in transit and at rest
            </p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
              Regular Audits
            </h3>
            <p className="text-black text-sm dark:text-black">
              Continuous security monitoring and assessments
            </p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg dark:bg-purple-900/30">
            <Key className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
              Access Controls
            </h3>
            <p className="text-black text-sm dark:text-black">
              Strict authentication and authorization protocols
            </p>
          </div>
        </div>
      </div>

      {/* Security Measures */}
      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Security Measures
        </h2>
        <div className="space-y-6">
          <div className={`${planCardClasses} rounded-xl shadow-sm p-6`}>
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg mr-4 dark:bg-blue-900/30">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Encryption
                </h3>
                <p className="text-black mb-3 dark:text-black">
                  We use industry-standard encryption to protect your data both
                  in transit and at rest:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    TLS 1.3 for data in transit
                  </li>
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    AES-256 encryption for data at rest
                  </li>
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    End-to-end encryption for document content
                  </li>
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Client-side encryption for sensitive data
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`${planCardClasses} rounded-xl shadow-sm p-6`}>
            <div className="flex items-start">
              <div className="p-2 bg-green-100 rounded-lg mr-4 dark:bg-green-900/30">
                <Key className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Authentication & Access
                </h3>
                <p className="text-black mb-3 dark:text-black">
                  We implement robust authentication and access control
                  measures:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Multi-factor authentication (MFA) support
                  </li>
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Role-based access controls
                  </li>
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Session management and timeout controls
                  </li>
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Regular access reviews and audits
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`${planCardClasses} rounded-xl shadow-sm p-6`}>
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-lg mr-4 dark:bg-purple-900/30">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Monitoring & Detection
                </h3>
                <p className="text-black mb-3 dark:text-black">
                  We continuously monitor for security threats and anomalies:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                    24/7 security monitoring
                  </li>
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                    Intrusion detection systems
                  </li>
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                    Automated threat detection
                  </li>
                  <li className="flex items-center text-black dark:text-black">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                    Regular vulnerability assessments
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-12`}>
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Compliance & Certifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3
              className={`text-lg font-semibold mb-4 ${planDocHeadingClasses}`}>
              Regulatory Compliance
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  <strong>GDPR Compliant</strong> - We meet the requirements of
                  the General Data Protection Regulation
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  <strong>FERPA Aligned</strong> - We follow practices aligned
                  with the Family Educational Rights and Privacy Act
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  <strong>ISO 27001</strong> - Our security management follows
                  ISO 27001 standards
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h3
              className={`text-lg font-semibold mb-4 ${planDocHeadingClasses}`}>
              Security Practices
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  <strong>Regular Penetration Testing</strong> - Conducted by
                  independent security firms
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  <strong>Employee Training</strong> - All staff receive regular
                  security awareness training
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-black dark:text-black">
                  <strong>Incident Response</strong> - Comprehensive incident
                  response procedures
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Best Practices for Users */}
      <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-12`}>
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Best Practices for Users
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-white rounded-lg p-5 border-white">
            <h3
              className={`font-semibold mb-3 flex items-center ${planDocHeadingClasses}`}>
              <Lock className="h-5 w-5 text-blue-600 mr-2" />
              Strong Passwords
            </h3>
            <ul className="space-y-2 text-black text-sm dark:text-black">
              <li>• Use unique passwords for each account</li>
              <li>• Include uppercase, lowercase, numbers, and symbols</li>
              <li>• Consider using a password manager</li>
              <li>• Change passwords regularly</li>
            </ul>
          </div>
          <div className="border border-white rounded-lg p-5 border-white">
            <h3
              className={`font-semibold mb-3 flex items-center ${planDocHeadingClasses}`}>
              <Key className="h-5 w-5 text-green-600 mr-2" />
              Multi-Factor Authentication
            </h3>
            <ul className="space-y-2 text-black text-sm dark:text-black">
              <li>• Enable MFA on your account</li>
              <li>• Use authenticator apps when possible</li>
              <li>• Keep backup codes in a secure location</li>
              <li>• Review MFA settings regularly</li>
            </ul>
          </div>
          <div className="border border-white rounded-lg p-5 border-white">
            <h3
              className={`font-semibold mb-3 flex items-center ${planDocHeadingClasses}`}>
              <Eye className="h-5 w-5 text-purple-600 mr-2" />
              Device Security
            </h3>
            <ul className="space-y-2 text-black text-sm dark:text-black">
              <li>• Keep your devices updated with security patches</li>
              <li>• Use antivirus software</li>
              <li>• Avoid public Wi-Fi for sensitive tasks</li>
              <li>• Lock devices when not in use</li>
            </ul>
          </div>
          <div className="border border-white rounded-lg p-5 border-white">
            <h3
              className={`font-semibold mb-3 flex items-center ${planDocHeadingClasses}`}>
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              Phishing Awareness
            </h3>
            <ul className="space-y-2 text-black text-sm dark:text-black">
              <li>• Be cautious of unsolicited emails</li>
              <li>• Verify sender authenticity</li>
              <li>• Never share passwords or codes</li>
              <li>• Report suspicious messages</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Incident Response */}
      <div className={`${planCardClasses} rounded-xl shadow-sm p-8 mb-12`}>
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Security Incident Response
        </h2>
        <p className="text-black mb-4 dark:text-black">
          In the unlikely event of a security incident, we have a comprehensive
          response plan:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3 dark:bg-blue-900/30">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className={`font-semibold mb-1 ${planDocHeadingClasses}`}>
              Detection
            </h3>
            <p className="text-black text-sm dark:text-black">
              Immediate identification of potential threats
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3 dark:bg-green-900/30">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <h3 className={`font-semibold mb-1 ${planDocHeadingClasses}`}>
              Containment
            </h3>
            <p className="text-black text-sm dark:text-black">
              Rapid isolation to prevent further impact
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-3 dark:bg-yellow-900/30">
              <span className="text-yellow-600 font-bold">3</span>
            </div>
            <h3 className={`font-semibold mb-1 ${planDocHeadingClasses}`}>
              Investigation
            </h3>
            <p className="text-black text-sm dark:text-black">
              Thorough analysis of the incident
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-3 dark:bg-purple-900/30">
              <span className="text-purple-600 font-bold">4</span>
            </div>
            <h3 className={`font-semibold mb-1 ${planDocHeadingClasses}`}>
              Communication
            </h3>
            <p className="text-black text-sm dark:text-black">
              Transparent updates to affected users
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 dark:bg-blue-900/20 border-white-800">
        <div className="text-center max-w-2xl mx-auto">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Report a Security Concern
          </h2>
          <p className="text-black mb-6 dark:text-black">
            If you believe you've found a security vulnerability or have
            concerns about your account security, please contact our security
            team immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:security@scholarforgeai.com"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center">
              Report Security Issue
            </a>
            <Link
              href="/docs"
              className={`px-6 py-3 border border-white rounded-lg font-medium text-center ${planDocLinkClasses} hover:underline`}>
              Back to Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
