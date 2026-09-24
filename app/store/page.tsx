"use client";

import React from "react";
import { PublicStore } from "@/store/pages/PublicStore";

export default function StorePage() {
  return <PublicStore initialView="catalog" />;
}
