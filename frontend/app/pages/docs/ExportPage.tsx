"use client";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  File,
  FileSpreadsheet,
  FileImage,
  Download,
  Share2,
  Printer,
  Cloud,
  HardDrive,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const ExportPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const exportFormats = [
    {
      name: "Microsoft Word",
      extension: ".docx",
      description: "Fully editable Word document with formatting preserved",
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      category: "Document",
    },
    {
      name: "PDF",
      extension: ".pdf",
      description: "Print-ready PDF with professional layout",
      icon: <File className="h-8 w-8 text-red-600" />,
      category: "Document",
    },
    {
      name: "Plain Text",
      extension: ".txt",
      description: "Simple text format for compatibility",
      icon: <FileText className="h-8 w-8 text-black" />,
      category: "Document",
    },
    {
      name: "Rich Text",
      extension: ".rtf",
      description: "Formatted text with basic styling",
      icon: <FileText className="h-8 w-8 text-green-600" />,
      category: "Document",
    },
    {
      name: "Excel Spreadsheet",
      extension: ".xlsx",
      description: "Tabular data export for research findings",
      icon: <FileSpreadsheet className="h-8 w-8 text-green-600" />,
      category: "Data",
    },
    {
      name: "CSV",
      extension: ".csv",
      description: "Comma-separated values for data analysis",
      icon: <FileSpreadsheet className="h-8 w-8 text-orange-600" />,
      category: "Data",
    },
    {
      name: "Images",
      extension: ".png",
      description: "Export charts, graphs, and visuals",
      icon: <FileImage className="h-8 w-8 text-purple-600" />,
      category: "Media",
    },
  ];

  const exportMethods = [
    {
      title: "Download to Device",
      description: "Save files directly to your computer or mobile device",
      icon: <HardDrive className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "Cloud Storage",
      description: "Export directly to Google Drive, Dropbox, or OneDrive",
      icon: <Cloud className="h-6 w-6 text-green-600" />,
    },
    {
      title: "Email Sharing",
      description: "Send documents directly via email",
      icon: <Share2 className="h-6 w-6 text-purple-600" />,
    },
    {
      title: "Print",
      description: "Generate print-ready versions of your documents",
      icon: <Printer className="h-6 w-6 text-red-600" />,
    },
  ];

  const formattingOptions = [
    {
      name: "Academic Style",
      description:
        "Optimized for academic submissions with proper margins and fonts",
    },
    {
      name: "Publication Ready",
      description: "Formatted for journal submissions or publishing",
    },
    {
      name: "Presentation",
      description: "Optimized for slides or visual presentations",
    },
    {
      name: "Custom",
      description: "Apply your own formatting preferences",
    },
  ];

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom py-6">
          <Link
            href="/docs"
            className={`inline-flex items-center ${planDocLinkClasses} mb-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Link>
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
              Export Options
            </h1>
            <p className="text-lg text-black dark:text-black">
              Export your work in multiple formats for sharing, printing, or
              submission
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Flexible Export Options
              </h2>
              <p className="opacity-90">
                Export your academic work in the format that best suits your
                needs
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <Download className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Share2 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Supported Formats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exportFormats.map((format, index) => (
              <div
                key={index}
                className={`${planCardClasses} p-5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors dark:hover:bg-indigo-900/20`}>
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 mr-3">{format.icon}</div>
                  <div>
                    <h3
                      className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                      {format.name}
                    </h3>
                    <span className="text-sm text-black dark:text-black">
                      {format.extension}
                    </span>
                  </div>
                </div>
                <p className="text-black text-sm dark:text-black">
                  {format.description}
                </p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-3 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {format.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Export Methods
            </h2>
            <div className="space-y-4">
              {exportMethods.map((method, index) => (
                <div key={index} className={`${planCardClasses} p-4`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">{method.icon}</div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {method.title}
                      </h3>
                      <p className="mt-1 text-black dark:text-black">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Formatting Options
            </h2>
            <div className="space-y-4">
              {formattingOptions.map((option, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                    {option.name}
                  </h3>
                  <p className="text-black dark:text-black">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-5 dark:bg-indigo-900/20 border-white-800">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Batch Export
              </h3>
              <p className="text-indigo-800 dark:text-indigo-200">
                Export multiple documents at once with consistent formatting and
                naming conventions.
              </p>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Export Best Practices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Before Exporting
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full mr-3 mt-2 dark:bg-indigo-400"></div>
                  <span className="text-black dark:text-black">
                    Review document for final edits
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full mr-3 mt-2 dark:bg-indigo-400"></div>
                  <span className="text-black dark:text-black">
                    Check citations and bibliography
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full mr-3 mt-2 dark:bg-indigo-400"></div>
                  <span className="text-black dark:text-black">
                    Verify formatting meets requirements
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                After Exporting
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full mr-3 mt-2 dark:bg-indigo-400"></div>
                  <span className="text-black dark:text-black">
                    Preview exported file for quality
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full mr-3 mt-2 dark:bg-indigo-400"></div>
                  <span className="text-black dark:text-black">
                    Save copies in multiple locations
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full mr-3 mt-2 dark:bg-indigo-400"></div>
                  <span className="text-black dark:text-black">
                    Share with collaborators for review
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
