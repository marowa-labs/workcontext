"use client";

import Link from "next/link";
import { Shield, User, Lock, FileText, CheckCircle } from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const GDPRPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom py-6">
          {/* Breadcrumb */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
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
                  <span className="text-black text-sm font-medium ml-1 md:ml-2 dark:text-black">
                    GDPR Compliance
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1
            className={`text-3xl md:text-4xl font-bold mb-2 ${planDocHeadingClasses}`}>
            GDPR Compliance
          </h1>
          <p className="text-lg text-black dark:text-black">
            How we comply with the General Data Protection Regulation
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Hero Section */}
        <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mb-12 dark:from-blue-900/20 dark:to-indigo-900/20 border-white-800">
          <div className="text-center">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
            <h1
              className={`text-3xl md:text-4xl font-bold mb-4 ${planDocHeadingClasses}`}>
              GDPR Compliance
            </h1>
            <p className="text-xl text-black max-w-3xl mx-auto dark:text-black">
              How we comply with the General Data Protection Regulation
            </p>
          </div>
        </div>

        {/* GDPR Overview */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            General Data Protection Regulation (GDPR)
          </h2>
          <p className="text-black mb-4 dark:text-black">
            The General Data Protection Regulation (GDPR) is a regulation in EU
            law on data protection and privacy in the European Union and the
            European Economic Area. It also addresses the transfer of personal
            data outside the EU and EEA areas.
          </p>
          <p className="text-black dark:text-black">
            ScholarForge AIis committed to full compliance with the GDPR and
            protecting the privacy rights of all users, regardless of their
            location. This page explains how we comply with GDPR requirements.
          </p>
        </div>

        {/* Key Principles */}
        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            GDPR Key Principles We Follow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3 dark:bg-blue-900/30">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Lawfulness, Fairness, and Transparency
                </h3>
              </div>
              <p className="text-black dark:text-black">
                We process personal data lawfully, fairly, and in a transparent
                manner in relation to the data subject. All data collection and
                processing activities are clearly disclosed in our Privacy
                Policy.
              </p>
            </div>

            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3 dark:bg-green-900/30">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Purpose Limitation
                </h3>
              </div>
              <p className="text-black dark:text-black">
                We collect personal data for specified, explicit, and legitimate
                purposes and do not further process the data in a manner that is
                incompatible with those purposes.
              </p>
            </div>

            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg mr-3 dark:bg-purple-900/30">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Data Minimization
                </h3>
              </div>
              <p className="text-black dark:text-black">
                We collect personal data that is adequate, relevant, and limited
                to what is necessary in relation to the purposes for which they
                are processed.
              </p>
            </div>

            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3 dark:bg-yellow-900/30">
                  <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Accuracy and Storage Limitation
                </h3>
              </div>
              <p className="text-black dark:text-black">
                We ensure personal data is accurate and, where necessary, kept
                up to date. We also ensure that personal data is kept in a form
                which permits identification of data subjects for no longer than
                is necessary for the purposes for which the personal data is
                processed.
              </p>
            </div>
          </div>
        </div>

        {/* Individual Rights */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Your Rights Under GDPR
          </h2>
          <p className="text-black mb-6 dark:text-black">
            As a data subject, you have specific rights under the GDPR. We
            respect and facilitate these rights:
          </p>

          <div className="space-y-6">
            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to Information
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to be informed about the collection and use
                of your personal data. This is typically done through our
                Privacy Policy and cookie consent mechanisms.
              </p>
              <Link
                href="/docs/privacy"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                View our Privacy Policy
              </Link>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right of Access
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to obtain confirmation as to whether or not
                personal data concerning you is being processed, and, where that
                is the case, access the personal data and supplementary
                information.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                Request Personal Data Access
              </button>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to Rectification
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to obtain from us the rectification of
                inaccurate personal data concerning you. You also have the right
                to have incomplete personal data completed.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                Request Data Correction
              </button>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to Erasure
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to obtain from us the erasure of personal
                data concerning you, under certain conditions. This is also
                known as the "right to be forgotten."
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                Request Data Deletion
              </button>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to Restrict Processing
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to obtain from us the restriction of
                processing under certain conditions.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                Request Processing Restriction
              </button>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to Data Portability
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to receive the personal data concerning you,
                which you have provided to us, in a structured, commonly used
                and machine-readable format and have the right to transmit that
                data to another controller.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                Export Your Data
              </button>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to Object
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to object, on grounds relating to your
                particular situation, at any time to processing of personal data
                concerning you.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                Object to Data Processing
              </button>
            </div>
          </div>
        </div>

        {/* Data Processing Activities */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Our Data Processing Activities
          </h2>

          <div className="space-y-6">
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Lawful Basis for Processing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`${planCardClasses} p-4`}>
                  <h4 className={`font-medium mb-2 ${planDocHeadingClasses}`}>
                    Contract Performance
                  </h4>
                  <p className="text-black text-sm dark:text-black">
                    Processing necessary for the performance of a contract with
                    you (e.g., providing our services).
                  </p>
                </div>
                <div className={`${planCardClasses} p-4`}>
                  <h4 className={`font-medium mb-2 ${planDocHeadingClasses}`}>
                    Legitimate Interests
                  </h4>
                  <p className="text-black text-sm dark:text-black">
                    Processing necessary for our legitimate interests, provided
                    these interests are not overridden by your rights and
                    interests.
                  </p>
                </div>
                <div className={`${planCardClasses} p-4`}>
                  <h4 className={`font-medium mb-2 ${planDocHeadingClasses}`}>
                    Legal Obligation
                  </h4>
                  <p className="text-black text-sm dark:text-black">
                    Processing necessary for compliance with a legal obligation
                    to which we are subject.
                  </p>
                </div>
                <div className={`${planCardClasses} p-4`}>
                  <h4 className={`font-medium mb-2 ${planDocHeadingClasses}`}>
                    Consent
                  </h4>
                  <p className="text-black text-sm dark:text-black">
                    Processing based on your explicit consent for specific
                    purposes (e.g., marketing communications).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Data Transfers
              </h3>
              <p className="text-black mb-3 dark:text-black">
                When we transfer your personal data outside of the European
                Economic Area (EEA), we ensure appropriate safeguards are in
                place:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Standard contractual clauses approved by the European
                    Commission
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Compliance with adequacy decisions by the European
                    Commission
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Binding corporate rules where applicable
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Protection Officer */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Data Protection Officer
          </h2>
          <p className="text-black mb-4 dark:text-black">
            We have appointed a Data Protection Officer (DPO) who is responsible
            for overseeing our data protection strategy and ensuring compliance
            with GDPR requirements.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 dark:bg-blue-900/20 border-white-800">
            <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
              Contact Our Data Protection Officer
            </h3>
            <p className="text-black mb-3 dark:text-black">
              If you have any questions about our GDPR compliance or wish to
              exercise your rights under the GDPR, please contact our Data
              Protection Officer:
            </p>
            <div className="flex items-center">
              <a
                href="mailto:dpo@scholarforgeai.com"
                className="text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-300">
                dpo@scholarforgeai.com
              </a>
            </div>
          </div>
        </div>

        {/* Complaints */}
        <div className={`${planCardClasses} p-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Complaints
          </h2>
          <p className="text-black mb-4 dark:text-black">
            If you believe that we have not complied with your rights under the
            GDPR or the data protection laws of your country, you have the right
            to lodge a complaint with a supervisory authority.
          </p>
          <p className="text-black dark:text-black">
            For users in the European Union, you can lodge a complaint with the
            data protection authority in your country of residence, place of
            work, or where the alleged infringement took place.
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mt-12 dark:from-blue-900/20 dark:to-indigo-900/20 border-white-800">
          <div className="text-center max-w-2xl mx-auto">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
            <h2 className={`text-2xl font-bold mb-2 ${planDocHeadingClasses}`}>
              GDPR Questions or Requests?
            </h2>
            <p className="text-black mb-6 dark:text-black">
              If you have any questions about our GDPR compliance or wish to
              exercise your rights, please contact our Data Protection Officer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:dpo@scholarforgeai.com"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center">
                Contact DPO
              </a>
              <Link
                href="/docs"
                className="px-6 py-3 border border-white text-black rounded-lg hover:bg-gray-50 font-medium text-center border-white dark:text-black dark:hover:bg-white">
                Back to Documentation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPRPage;
