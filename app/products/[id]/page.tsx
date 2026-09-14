import React from "react";
import { PublicStore } from "@/store/pages/PublicStore";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return <PublicStore />;
}
