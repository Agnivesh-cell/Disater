import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DisasterGuard — Know Earlier. Prepare Faster. Stay Safer.",
    template: "%s · DisasterGuard",
  },
  description:
    "DisasterGuard combines real-time disaster intelligence, risk monitoring and emergency guidance to help communities prepare before it is too late. AI-powered early warnings for floods, earthquakes, cyclones, wildfires and more.",
  keywords: ["disaster", "early warning", "emergency response", "flood alert", "earthquake", "cyclone", "preparedness", "DisasterGuard"],
  authors: [{ name: "DisasterGuard" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "DisasterGuard — Get warned before disaster strikes.",
    description: "Real-time disaster intelligence, risk monitoring and emergency guidance for communities, governments, NGOs and citizens.",
    siteName: "DisasterGuard",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060b16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <AppProviders>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
