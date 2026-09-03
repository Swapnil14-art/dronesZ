"use client";

import React from "react";
import { AuthProvider } from "@/store/context/AuthContext";
import { UserAuthProvider } from "@/store/context/UserAuthContext";

export function StoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserAuthProvider>
        {children}
      </UserAuthProvider>
    </AuthProvider>
  );
}
