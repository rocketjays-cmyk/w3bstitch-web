"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/anchor";
  }, []);

  return <p>Loading…</p>;
}
