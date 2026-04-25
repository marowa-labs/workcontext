"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { getAuthToken } from "../lib/utils/auth";

interface AuthContextType {
  getAccessToken: () => Promise<string | null>;
  isAuthenticated: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const getAccessToken = async (): Promise<string | null> => {
    return await getAuthToken();
  };

  const isAuthenticated = async (): Promise<boolean> => {
    try {
      const token = await getAuthToken();
      return token !== null;
    } catch (error) {
      console.error("Error checking authentication status:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ getAccessToken, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
