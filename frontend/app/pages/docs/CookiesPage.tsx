"use client";

import Link from "next/link";
import { Cookie, Settings } from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const CookiesPage = () => {
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
                    Cookie Policy
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1
            className={`text-3xl md:text-4xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Cookie Policy
          </h1>
          <p className="text-lg text-black dark:text-black">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Hero Section */}
        <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mb-12 dark:from-blue-900/20 dark:to-indigo-900/20 border-white-800">
          <div className="text-center">
            <Cookie className="h-12 w-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
            <h1
              className={`text-3xl md:text-4xl font-bold mb-4 ${planDocHeadingClasses}`}>
              Cookie Policy
            </h1>
            <p className="text-xl text-black max-w-3xl mx-auto dark:text-black">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Cookie Policy Content */}
        <div className="prose prose-lg max-w-none">
          <div className={`${planCardClasses} p-8 mb-8`}>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              1. What Are Cookies?
            </h2>
            <p className="text-black mb-4 dark:text-black">
              Cookies are small text files that are stored on your computer or
              mobile device when you visit a website. They are widely used to
              make websites work more efficiently and to provide information to
              the owners of the site.
            </p>
            <p className="text-black dark:text-black">
              Cookies help us recognize your device and preferences, improve
              your experience on our platform, and understand how our Service is
              being used.
            </p>
          </div>

          <div className={`${planCardClasses} p-8 mb-8`}>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              2. How We Use Cookies
            </h2>
            <p className="text-black mb-4 dark:text-black">
              We use cookies for various purposes to enhance your experience on
              ScholarForge AI:
            </p>

            <div className="space-y-6">
              <div className={`${planCardClasses} p-5`}>
                <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Essential Cookies
                </h3>
                <p className="text-black text-sm mb-3 dark:text-black">
                  These cookies are necessary for the website to function and
                  cannot be switched off in our systems. They are usually only
                  set in response to actions made by you which amount to a
                  request for services, such as setting your privacy
                  preferences, logging in or filling in forms.
                </p>
                <div className="flex items-center text-xs text-black dark:text-black">
                  <Settings className="h-4 w-4 mr-1" />
                  Always Active
                </div>
              </div>

              <div className={`${planCardClasses} p-5`}>
                <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Performance Cookies
                </h3>
                <p className="text-black text-sm mb-3 dark:text-black">
                  These cookies allow us to count visits and traffic sources so
                  we can measure and improve the performance of our site. They
                  help us to know which pages are the most and least popular and
                  see how visitors move around the site.
                </p>
                <div className="flex items-center text-xs text-black dark:text-black">
                  <Settings className="h-4 w-4 mr-1" />
                  Session & Persistent
                </div>
              </div>

              <div className={`${planCardClasses} p-5`}>
                <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Functionality Cookies
                </h3>
                <p className="text-black text-sm mb-3 dark:text-black">
                  These cookies enable the website to provide enhanced
                  functionality and personalization. They may be set by us or by
                  third party providers whose services we have added to our
                  pages.
                </p>
                <div className="flex items-center text-xs text-black dark:text-black">
                  <Settings className="h-4 w-4 mr-1" />
                  Persistent
                </div>
              </div>

              <div className={`${planCardClasses} p-5`}>
                <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Targeting Cookies
                </h3>
                <p className="text-black text-sm mb-3 dark:text-black">
                  These cookies may be set through our site by our advertising
                  partners. They may be used by those companies to build a
                  profile of your interests and show you relevant adverts on
                  other sites. They do not store personal information directly,
                  but are based on uniquely identifying your browser and
                  internet device.
                </p>
                <div className="flex items-center text-xs text-black dark:text-black">
                  <Settings className="h-4 w-4 mr-1" />
                  Persistent
                </div>
              </div>
            </div>
          </div>

          <div className={`${planCardClasses} p-8 mb-8`}>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              3. Types of Cookies We Use
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider dark:text-black">
                      Cookie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider dark:text-black">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider dark:text-black">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-white dark:divide-gray-700">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-black">
                      sessionid
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      Maintains user session
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      Session
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-white">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-black">
                      csrftoken
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      Prevents CSRF attacks
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      1 year
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-black">
                      preferences
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      Stores user preferences
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      1 year
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-white">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-black">
                      analytics
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      Usage analytics
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      2 years
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-black">
                      consent
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      Stores cookie consent
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-black">
                      1 year
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className={`${planCardClasses} p-8 mb-8`}>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              4. Third-Party Cookies
            </h2>
            <p className="text-black mb-4 dark:text-black">
              We may also use third-party cookies for analytics and advertising
              purposes:
            </p>

            <div className="space-y-4">
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Analytics Services
                </h3>
                <p className="text-black text-sm mb-2 dark:text-black">
                  We use Google Analytics to help us understand how our Service
                  is being used. These cookies collect information in the
                  aggregate to give us insight into how our Service is being
                  used.
                </p>
                <a
                  href="https://policies.google.com/technologies/cookies"
                  className="text-blue-600 hover:text-blue-800 text-sm dark:text-blue-400 dark:hover:text-blue-300">
                  Google Analytics Cookie Policy
                </a>
              </div>

              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Advertising Services
                </h3>
                <p className="text-black text-sm mb-2 dark:text-black">
                  We may use advertising partners who may set cookies to help us
                  display relevant advertisements to you.
                </p>
                <a
                  href="https://www.google.com/policies/technologies/ads/"
                  className="text-blue-600 hover:text-blue-800 text-sm dark:text-blue-400 dark:hover:text-blue-300">
                  Google Advertising Cookie Policy
                </a>
              </div>
            </div>
          </div>

          <div className={`${planCardClasses} p-8 mb-8`}>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              5. Managing Cookies
            </h2>
            <p className="text-black mb-4 dark:text-black">
              You can control and/or delete cookies as you wish. You can delete
              all cookies that are already on your computer and you can set most
              browsers to prevent them from being placed. If you do this,
              however, you may have to manually adjust some preferences every
              time you visit a site and some services and functionalities may
              not work.
            </p>

            <div className="space-y-4">
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Browser Settings
                </h3>
                <p className="text-black text-sm mb-3 dark:text-black">
                  Most web browsers automatically accept cookies, but you can
                  modify your browser settings to decline cookies if you prefer.
                  If you choose to decline cookies, you may not be able to fully
                  experience the interactive features of the ScholarForge
                  AIservices or websites you visit.
                </p>
                <ul className="space-y-2 text-black text-sm dark:text-black">
                  <li>
                    •{" "}
                    <a
                      href="https://support.google.com/chrome/answer/95647"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Chrome Cookie Settings
                    </a>
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Firefox Cookie Settings
                    </a>
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Safari Cookie Settings
                    </a>
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://support.microsoft.com/en-us/help/4468242/microsoft-edge-browsing-data-and-privacy"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Edge Cookie Settings
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Cookie Consent
                </h3>
                <p className="text-black text-sm dark:text-black">
                  When you first visit our website, you will be presented with a
                  cookie consent banner where you can choose which types of
                  cookies to accept. You can change your preferences at any time
                  through our Cookie Settings panel.
                </p>
              </div>
            </div>
          </div>

          <div className={`${planCardClasses} p-8`}>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              6. Changes to This Cookie Policy
            </h2>
            <p className="text-black dark:text-black">
              We may update our Cookie Policy from time to time. We will notify
              you of any changes by posting the new Cookie Policy on this page
              and updating the "Last updated" date. You are advised to review
              this Cookie Policy periodically for any changes.
            </p>
          </div>
        </div>

        {/* Cookie Settings */}
        <div className="bg-white dark:bg-white border-b border-white border-white rounded-2xl p-8 mt-12 dark:from-blue-900/20 dark:to-indigo-900/20 border-white-800">
          <div className="text-center max-w-2xl mx-auto">
            <Settings className="h-12 w-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
            <h2 className={`text-2xl font-bold mb-2 ${planDocHeadingClasses}`}>
              Cookie Settings
            </h2>
            <p className="text-black mb-6 dark:text-black">
              Manage your cookie preferences and consent settings
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Manage Cookie Preferences
              </button>
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

export default CookiesPage;
