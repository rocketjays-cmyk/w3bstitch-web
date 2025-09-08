"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BackButton() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      className="fixed top-4 left-4 text-sm text-gray-600 hover:text-black"
    >
      ← Back
    </Link>
  );
}
