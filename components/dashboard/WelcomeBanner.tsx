import React from "react";
import { type User } from "@/types";
import { formatDate } from "@/lib/utils/date";

interface WelcomeBannerProps {
  user: User;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner({ user }: WelcomeBannerProps) {
  const today = formatDate(new Date());

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{today}</p>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {getGreeting()}, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s on your plate today.
        </p>
      </div>
    </div>
  );
}
