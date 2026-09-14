import React from "react";
import { PublicStore } from "@/store/pages/PublicStore";

export default async function StoreSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  return <PublicStore />;
}
