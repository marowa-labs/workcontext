"use client";

import React, { useEffect, useState, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../../lib/utils/useUser";
import { AuthInitContext } from "./AuthInitializer";

interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { user, loading } = useUser();
  const { isInitialized } = useContext(AuthInitContext);
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    console.log("GuestRoute: Checking auth status", { user, loading });

    // If we've finished loading and auth is initialized, check auth status
    if (!loading && isInitialized) {
      if (user) {
        console.log("GuestRoute: User found, redirecting to dashboard");

        // Check if there's a redirect parameter in the URL
        const searchParams = new URLSearchParams(location.search);
        const redirectPath = searchParams.get("redirect");

        // Add a small delay to prevent race conditions
        setTimeout(() => {
          // If there's a redirect path, use it; otherwise go to dashboard
          if (redirectPath) {
            router.push(redirectPath);
          } else {
            router.push("/dashboard");
          }
        }, 100);
      }
      setChecked(true);
    }
  }, [user, loading, isInitialized, router]);

  // Show loading state while checking auth status
  if (loading) {
    console.log("GuestRoute: Showing loading state", { loading });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If we've checked auth status and user is authenticated, redirect to dashboard (useEffect will handle this)
  // If not authenticated, render children
  if (checked && !user) {
    return <>{children}</>;
  }

  // If we've checked and there is a user, don't render anything while redirecting
  if (checked && user) {
    return null;
  }

  // Default loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default GuestRoute;
