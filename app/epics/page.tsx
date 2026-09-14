"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EpicsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/roadmap");
  }, [router]);

  return null;
}
