import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorkBoard | Modern Work Management",
  description: "High-performance project and work management platform for high-velocity teams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the layout reach the physical edges of a notched iPhone, which is
  // what makes env(safe-area-inset-*) report real values — the padding that
  // keeps content clear of the notch and the home indicator is applied in
  // globals.css. Without this the insets are always 0 and the bars overlap
  // the UI.
  viewportFit: "cover",
  // maximumScale / userScalable are deliberately left alone: pinch-zoom is
  // an accessibility feature, and the iOS focus-zoom problem is solved by
  // sizing the inputs properly instead (see globals.css).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e10" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-background text-foreground antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
