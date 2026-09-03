"use client";

import React from "react";
import { UserDashboard } from "@/store/pages/UserDashboard";

export default function OrdersRoutePage() {
  return <UserDashboard initialTab="orders" />;
}
