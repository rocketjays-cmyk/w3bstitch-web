"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-4 left-4 text-sm text-gray-600 hover:text-black"
    >
      ← Back
    </button>
  );
}
