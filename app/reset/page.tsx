"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClearStoragePage() {
  const router = useRouter();
  useEffect(() => {
    try {
      // Clear all workboard storage keys
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("workboard_")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    // Redirect to login after clearing
    router.replace("/login");
  }, [router]);
  return (
    <div className="flex h-screen items-center justify-center text-white bg-[#111322]">
      <p>Clearing session...</p>
    </div>
  );
}
