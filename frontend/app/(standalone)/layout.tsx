"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { BillingProvider } from "../contexts/BillingContext";
import { Toaster } from "../components/ui/toaster";

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <BillingProvider>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </BillingProvider>
    </AuthProvider>
  );
}
