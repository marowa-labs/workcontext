"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import BillingService, { Subscription } from "../lib/utils/billingService";
import { supabase } from "../lib/supabase/client";

interface BillingContextType {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  isFreeUser: boolean;
  isStudentUser: boolean;
  isResearcherUser: boolean;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = async () => {
    try {
      setLoading(true);
      const sub = await BillingService.getCurrentSubscription();
      setSubscription(sub);
      setError(null);
    } catch (err) {
      setError("Failed to fetch subscription");
      console.error("Error fetching subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadSubscription = async () => {
      try {
        // Add a small delay to ensure authentication state has settled
        // This is particularly important after OAuth flows or redirects
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if user is authenticated before trying to fetch subscription
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        // Only update state if component is still mounted
        if (!isMounted) return;

        // If there's no session or session error, don't try to fetch subscription
        if (sessionError || !sessionData?.session) {
          console.log("No active session, skipping subscription fetch");
          if (isMounted) {
            setLoading(false);
            setSubscription(null);
            setError(null);
          }
          return;
        }

        // Only update state if component is still mounted
        if (isMounted) {
          setLoading(true);
        }

        const sub = await BillingService.getCurrentSubscription();

        // Only update state if component is still mounted
        if (isMounted) {
          setSubscription(sub);
          setError(null);
        }
      } catch (err) {
        // Only update state if component is still mounted
        if (isMounted) {
          setError("Failed to fetch subscription");
          console.error("Error fetching subscription:", err);
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSubscription();

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  const isFreeUser = subscription?.plan?.id === "free";
  const isStudentUser = subscription?.plan?.id === "student";
  const isResearcherUser = subscription?.plan?.id === "researcher";

  return (
    <BillingContext.Provider
      value={{
        subscription,
        loading,
        error,
        refreshSubscription,
        isFreeUser,
        isStudentUser,
        isResearcherUser,
      }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
};
