"use client";

import { useRouter, usePathname } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <button
      onClick={() => router.back()}
      className="absolute top-4 left-4 text-xl text-white"
      aria-label="Go back"
    >
      ←
    </button>
  );
}
