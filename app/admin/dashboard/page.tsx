"use client";

import React from "react";
import { ProtectedAdminDashboard } from "@/store/pages/ProtectedAdminDashboard";

export default function AdminDashboardRoutePage() {
  return <ProtectedAdminDashboard />;
}
