import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { APP_DESCRIPTION, APP_ICON_PATH, APP_NAME, APP_TAGLINE } from "@/lib/branding";
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
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  icons: {
    icon: APP_ICON_PATH,
    apple: APP_ICON_PATH,
    shortcut: APP_ICON_PATH,
  },
  applicationName: APP_NAME,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="/hancom-skin/hnc-office-addin-ctrl.css" />
        <link rel="stylesheet" href="/hancom-skin/book-studio-hancom.css" />
      </head>
      <body className="min-h-full bg-muted/20">
        <QueryProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
