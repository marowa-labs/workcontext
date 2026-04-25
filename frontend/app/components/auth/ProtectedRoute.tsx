"use client";

import React, { useEffect, useState, useMemo, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../../lib/utils/useUser";
import { AuthInitContext } from "./AuthInitializer";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useUser();
  const { isInitialized } = useContext(AuthInitContext);
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  // Create a stable reference to user ID to prevent dependency issues
  const userId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    console.log("ProtectedRoute: Checking auth status", {
      userId,
      loading,
      pathname: location.pathname,
    });

    // If we've finished loading and auth is initialized, check auth status
    if (!loading && isInitialized) {
      if (!user) {
        console.log("ProtectedRoute: No user found, redirecting to login");
        // Preserve the current location so we can redirect back after login
        const redirectPath = location.pathname + location.search;
        // Add a small delay to prevent race conditions
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        }, 100);
      } else {
        console.log(
          "ProtectedRoute: User authenticated, setting checked to true",
        );
        setChecked(true);
      }
    }
  }, [loading, isInitialized, userId, router, user]);

  // Show loading state while checking auth status
  if (loading) {
    console.log("ProtectedRoute: Showing loading state", { loading });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If we've checked auth status and user is authenticated, render children
  // If not authenticated, useEffect will redirect to login
  if (checked && user) {
    console.log("ProtectedRoute: Rendering children", { userId });
    return <>{children}</>;
  }

  // If we've checked and there's no user, don't render anything while redirecting
  if (checked && !user) {
    return null;
  }

  // Default loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default ProtectedRoute;
