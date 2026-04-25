"use client";

import { useEffect } from "react";
import { useIsMobile } from "../hooks/use-mobile";
import { usePathname, useRouter } from "next/navigation";

const MobileRedirect = () => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not already on the mobile landing page
    if (isMobile && pathname !== "/mobile") {
      router.push("/mobile");
    }
  }, [isMobile, pathname, router]);

  // This component doesn't render anything
  return null;
};

export default MobileRedirect;
