"use client";

import React from "react";
import { AdminLogin } from "@/store/pages/AdminLogin";
import { ProtectedAdminDashboard } from "@/store/pages/ProtectedAdminDashboard";
import { useAuth } from "@/store/context/AuthContext";

export default function AdminRoutePage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <ProtectedAdminDashboard />;
  }

  return <AdminLogin />;
}
