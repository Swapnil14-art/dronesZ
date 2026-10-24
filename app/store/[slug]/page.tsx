"use client";

import React from "react";
import { useParams } from "next/navigation";
import { PublicStore } from "@/store/pages/PublicStore";

export default function StoreSlugPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = typeof rawSlug === "string" ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : "";
  const isParachute = slug === "parachute";
  const isAgriDrone = slug === "agricultural-spraying-drone" || slug === "agri-drone";

  const initialView = isParachute
    ? "parachute"
    : isAgriDrone
    ? "agri-drone"
    : "category";

  return (
    <PublicStore
      initialView={initialView}
      initialSlug={slug}
    />
  );
}
