"use client";

import React from "react";
import { UserDashboard } from "@/store/pages/UserDashboard";

export default function DashboardRoutePage() {
  return <UserDashboard initialTab="profile" />;
}
