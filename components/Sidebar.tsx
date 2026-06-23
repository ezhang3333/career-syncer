"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/career-data", label: "Career Data" },
  { href: "/resumes", label: "Resumes" },
  { href: "/linkedin", label: "LinkedIn" },
  { href: "/applications", label: "Applications" },
  { href: "/networking", label: "Networking" },
  { href: "/portfolio", label: "Portfolio" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r border-white/10 bg-black/20 px-4 py-6">
      <Link href="/career-data" className="mb-8 px-2 text-lg font-semibold tracking-tight">
        Career Syncer
      </Link>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
