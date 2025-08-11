// src/app/layout.tsx
"use client";

import "./globals.css";
import { Toaster } from "sonner";
import NavBar from "@/components/NavBar";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname?.startsWith("/onboarding");

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {!hideNav && <NavBar />}
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
