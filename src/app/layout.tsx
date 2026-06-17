import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { QueryProvider } from "@/components/providers/QueryProvider";
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
  title: "Book Studio — 전자책 제작",
  description: "Markdown/WYSIWYG 에디터로 전자책을 작성하고 EPUB으로 내보내는 웹 스튜디오",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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
