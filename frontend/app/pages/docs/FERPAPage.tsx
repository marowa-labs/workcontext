"use client";

import Link from "next/link";
import {
  Shield,
  User,
  Lock,
  FileText,
  CheckCircle,
  School,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const FERPAPage = () => {
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
                    FERPA Compliance
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1
            className={`text-3xl md:text-4xl font-bold mb-2 ${planDocHeadingClasses}`}>
            FERPA Compliance
          </h1>
          <p className="text-lg text-black dark:text-black">
            How we comply with the Family Educational Rights and Privacy Act
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Hero Section */}
        <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mb-12 dark:from-blue-900/20 dark:to-indigo-900/20 border-white-800">
          <div className="text-center">
            <School className="h-12 w-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
            <h1
              className={`text-3xl md:text-4xl font-bold mb-4 ${planDocHeadingClasses}`}>
              FERPA Compliance
            </h1>
            <p className="text-xl text-black max-w-3xl mx-auto dark:text-black">
              How we comply with the Family Educational Rights and Privacy Act
            </p>
          </div>
        </div>

        {/* FERPA Overview */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Family Educational Rights and Privacy Act (FERPA)
          </h2>
          <p className="text-black mb-4 dark:text-black">
            The Family Educational Rights and Privacy Act (FERPA) is a federal
            law that protects the privacy of student education records. The law
            applies to all schools that receive funds under an applicable
            program of the U.S. Department of Education.
          </p>
          <p className="text-black dark:text-black">
            ScholarForge AIis committed to full compliance with FERPA and
            protecting the privacy rights of all students and educational users.
            This page explains how we comply with FERPA requirements.
          </p>
        </div>

        {/* Key Principles */}
        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            FERPA Key Principles We Follow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3 dark:bg-blue-900/30">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Student Privacy Rights
                </h3>
              </div>
              <p className="text-black dark:text-black">
                We respect students' rights to inspect and review their
                education records and to request amendment of records that they
                believe are inaccurate or misleading.
              </p>
            </div>

            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3 dark:bg-green-900/30">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Consent for Disclosure
                </h3>
              </div>
              <p className="text-black dark:text-black">
                We obtain written consent from students (or parents of students
                under 18) before disclosing personally identifiable information
                from education records, except where FERPA authorizes disclosure
                without consent.
              </p>
            </div>

            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg mr-3 dark:bg-purple-900/30">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Directory Information
                </h3>
              </div>
              <p className="text-black dark:text-black">
                We carefully define and protect directory information, and
                provide students with the opportunity to opt out of directory
                information disclosure.
              </p>
            </div>

            <div className={`${planCardClasses} p-6`}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3 dark:bg-yellow-900/30">
                  <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Data Security
                </h3>
              </div>
              <p className="text-black dark:text-black">
                We implement appropriate administrative, technical, and physical
                safeguards to protect the security, integrity, and
                confidentiality of student education records.
              </p>
            </div>
          </div>
        </div>

        {/* Individual Rights */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Your Rights Under FERPA
          </h2>
          <p className="text-black mb-6 dark:text-black">
            As a student or parent of a student, you have specific rights under
            FERPA. We respect and facilitate these rights:
          </p>

          <div className="space-y-6">
            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to Inspect and Review Records
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to inspect and review your education records
                within 45 days of the day we receive a request for access.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                Request Record Access
              </button>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to Request Amendment
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to request that we amend your education
                records that you believe are inaccurate, misleading, or
                otherwise in violation of your privacy rights.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                Request Record Amendment
              </button>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to Consent to Disclosures
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to consent to disclosures of personally
                identifiable information contained in your education records,
                except to the extent that FERPA authorizes disclosure without
                consent.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                Manage Disclosure Preferences
              </button>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Right to File a Complaint
              </h3>
              <p className="text-black text-sm mb-3 dark:text-black">
                You have the right to file a complaint with the U.S. Department
                of Education concerning alleged failures by us to comply with
                the requirements of FERPA.
              </p>
              <a
                href="https://studentprivacy.ed.gov/complaint-process"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300">
                File a Complaint with US DOE
              </a>
            </div>
          </div>
        </div>

        {/* Educational Institution Compliance */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            For Educational Institutions
          </h2>
          <p className="text-black mb-6 dark:text-black">
            Educational institutions using ScholarForge AIare responsible for
            ensuring their use of our services complies with FERPA. We provide
            tools and documentation to help institutions meet their obligations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Data Agreements
              </h3>
              <p className="text-black text-sm dark:text-black">
                We provide standard data processing agreements and business
                associate agreements for educational institutions.
              </p>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Student Record Management
              </h3>
              <p className="text-black text-sm dark:text-black">
                Our platform includes tools for managing student records in
                compliance with FERPA requirements.
              </p>
            </div>

            <div className={`${planCardClasses} p-5`}>
              <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                Training Resources
              </h3>
              <p className="text-black text-sm dark:text-black">
                We offer training materials and best practices for FERPA
                compliance for institutional administrators.
              </p>
            </div>
          </div>
        </div>

        {/* Directory Information */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Directory Information
          </h2>
          <p className="text-black mb-4 dark:text-black">
            Directory information is information contained in an education
            record that would not generally be considered harmful or an invasion
            of privacy if released. At ScholarForge AI, we consider the
            following as directory information:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
              <span className="text-black dark:text-black">
                Student's name, address, telephone number, date and place of
                birth
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
              <span className="text-black dark:text-black">
                Major field of study, participation in officially recognized
                activities and sports
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
              <span className="text-black dark:text-black">
                Weight and height of members of athletic teams
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
              <span className="text-black dark:text-black">
                Dates of attendance, degrees and awards received
              </span>
            </li>
          </ul>
          <p className="text-black dark:text-black">
            Students have the right to opt out of directory information
            disclosure by notifying us in writing.
          </p>
        </div>

        {/* Exceptions to Consent */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Exceptions to Consent
          </h2>
          <p className="text-black mb-4 dark:text-black">
            FERPA permits disclosure of personally identifiable information from
            education records without consent in certain circumstances:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
              <span className="text-black dark:text-black">
                To school officials with legitimate educational interests
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
              <span className="text-black dark:text-black">
                To authorized representatives of the U.S. Comptroller General,
                the Attorney General, the Secretary of Education, or the
                Administrator of the Institute of Education Sciences
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
              <span className="text-black dark:text-black">
                In connection with financial aid for which the student has
                applied or which the student has received
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
              <span className="text-black dark:text-black">
                To state and local authorities within a juvenile justice system
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0 dark:text-green-400" />
              <span className="text-black dark:text-black">
                To organizations conducting studies for or on behalf of the
                school
              </span>
            </li>
          </ul>
        </div>

        {/* Data Protection Officer */}
        <div className={`${planCardClasses} p-8 mb-12`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Student Privacy Officer
          </h2>
          <p className="text-black mb-4 dark:text-black">
            We have appointed a Student Privacy Officer who is responsible for
            overseeing our FERPA compliance and ensuring the protection of
            student education records.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 dark:bg-blue-900/20 border-white-800">
            <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
              Contact Our Student Privacy Officer
            </h3>
            <p className="text-black mb-3 dark:text-black">
              If you have any questions about our FERPA compliance or wish to
              exercise your rights under FERPA, please contact our Student
              Privacy Officer:
            </p>
            <div className="flex items-center">
              <a
                href="mailto:spo@scholarforgeai.com"
                className="text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-300">
                spo@scholarforgeai.com
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
            If you believe that we have not complied with your rights under
            FERPA, you have the right to file a complaint with the Family Policy
            Compliance Office at the U.S. Department of Education.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 border-white-800">
            <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
              Family Policy Compliance Office
            </h3>
            <p className="text-black mb-2 dark:text-black">
              U.S. Department of Education
              <br />
              400 Maryland Avenue, SW
              <br />
              Washington, DC 20202-8520
            </p>
            <a
              href="https://studentprivacy.ed.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-300">
              Visit StudentPrivacy.gov
            </a>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mt-12 dark:from-blue-900/20 dark:to-indigo-900/20 border-white-800">
          <div className="text-center max-w-2xl mx-auto">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
            <h2 className={`text-2xl font-bold mb-2 ${planDocHeadingClasses}`}>
              FERPA Questions or Requests?
            </h2>
            <p className="text-black mb-6 dark:text-black">
              If you have any questions about our FERPA compliance or wish to
              exercise your rights, please contact our Student Privacy Officer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:spo@scholarforgeai.com"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center">
                Contact Student Privacy Officer
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

export default FERPAPage;
