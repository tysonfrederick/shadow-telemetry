import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shadow Telemetry",
  description:
    "A Cognitive Workload & Unscripted Exception Logger for zero-knowledge shadow work telemetry.",
  applicationName: "Shadow Telemetry",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shadow",
  },
};

export const viewport: Viewport = {
  themeColor: "#06090E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-obsidian antialiased`}
    >
      <body className="min-h-full bg-obsidian font-sans text-foreground">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
