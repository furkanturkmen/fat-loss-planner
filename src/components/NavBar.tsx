"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/lib/useAppData";

export default function NavBar() {
  const pathname = usePathname();
  const profile = useProfile(); // null initially, then live

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      pathname === href
        ? "bg-blue-600 text-white"
        : "text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
    }`;

  const avatar = profile?.avatar || "";
  const initials =
    (profile?.name || "")
      .split(" ")
      .map(n => n[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?";

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between">
      <div className="flex gap-2">
        <Link href="/" className={linkClass("/")}>Onboarding</Link>
        <Link href="/planner" className={linkClass("/planner")}>Planner</Link>
        <Link href="/recipes" className={linkClass("/recipes")}>Recipes</Link>
        <Link href="/profile" className={linkClass("/profile")}>Profile</Link>
      </div>

      <Link href="/profile" className="shrink-0">
        {avatar ? (
          <img src={avatar} alt="Avatar" className="w-10 h-10 rounded-full border object-cover" />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center rounded-full border bg-blue-600 text-white font-bold">
            {initials}
          </div>
        )}
      </Link>
    </nav>
  );
}
