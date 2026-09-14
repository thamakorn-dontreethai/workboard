"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BugsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/requests");
  }, [router]);

  return null;
}
