// src/app/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingComplete } from "@/lib/storage";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const done = getOnboardingComplete();
    router.replace(done ? "/planner" : "/onboarding");
  }, [router]);
  return null; // nothing visible
}
