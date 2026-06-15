"use client";

import { Suspense } from "react";
import SignupPage from "../../pages/auth/SignupPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading...</span>
        </div>
      }
    >
      <SignupPage />
    </Suspense>
  );
}
