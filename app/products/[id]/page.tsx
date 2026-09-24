"use client";

import React from "react";
import { useParams } from "next/navigation";
import { PublicStore } from "@/store/pages/PublicStore";

export default function ProductDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";

  return (
    <PublicStore
      initialView="product"
      initialProductId={id}
    />
  );
}
