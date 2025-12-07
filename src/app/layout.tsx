import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { loadConfig } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = loadConfig();
    const pageTitle = config.page?.title || "Personal Dashboard";
    const favicon = config.page?.favicon || "/favicon.ico";
    
    const metadata: Metadata = {
      title: pageTitle,
      description: "Dashboard for services and sports",
    };

    // Handle favicon - can be a relative path or full URL
    if (favicon.startsWith("http://") || favicon.startsWith("https://")) {
      // Full URL
      metadata.icons = {
        icon: favicon,
        shortcut: favicon,
        apple: favicon,
      };
    } else {
      // Relative path (assumed to be in public/)
      metadata.icons = {
        icon: favicon,
        shortcut: favicon,
        apple: favicon,
      };
    }

    return metadata;
  } catch (error) {
    // Fallback to defaults if config fails to load
    console.error("Failed to load config for metadata:", error);
    return {
      title: "Personal Dashboard",
      description: "Dashboard for services and sports",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
