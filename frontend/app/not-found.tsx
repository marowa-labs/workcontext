"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search, HelpCircle, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon Set */}
        <div className="relative h-40 w-full mb-8 flex items-center justify-center">
          <div className="absolute animate-pulse bg-red-50 rounded-full h-32 w-32 -z-10"></div>
          <div className="relative">
            <Search className="h-24 w-24 text-red-600 mb-4" />
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-gray-100 animate-bounce">
              <span className="text-2xl font-bold text-red-600">?</span>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-6xl font-black text-gray-900 mb-2 tracking-tight">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Lost in the ScholarForge?
        </h2>
        <p className="text-gray-600 text-lg mb-10 leading-relaxed">
          The page you're looking for seems to have vanished into the archives.
          Don't worry, even the best researchers lose their place sometimes.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <Link
            href="/dashboard"
            className="flex items-center justify-center px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200">
            <Home className="h-5 w-5 mr-2" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all border border-gray-200">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-gray-100 flex justify-center space-x-8">
          <Link
            href="/help"
            className="flex items-center text-sm text-gray-500 hover:text-red-600 font-medium transition-colors">
            <HelpCircle className="h-4 w-4 mr-1.5" />
            Help Center
          </Link>
          <Link
            href="/docs"
            className="flex items-center text-sm text-gray-500 hover:text-red-600 font-medium transition-colors">
            <BookOpen className="h-4 w-4 mr-1.5" />
            Documentation
          </Link>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden opacity-5">
        <div className="absolute top-10 left-10 text-9xl font-bold text-gray-300 transform -rotate-12">
          404
        </div>
        <div className="absolute bottom-20 right-20 text-9xl font-bold text-gray-300 transform rotate-12">
          HELP
        </div>
        <div className="absolute top-1/2 left-1/4 h-64 w-64 border-2 border-red-600 rounded-3xl transform rotate-45"></div>
        <div className="absolute bottom-1/4 right-1/3 h-96 w-96 border-4 border-gray-200 rounded-full"></div>
      </div>
    </div>
  );
}
