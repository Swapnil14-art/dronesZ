import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Dashboard",
  description: "User account management, addresses, and order history.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

