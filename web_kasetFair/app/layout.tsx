import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ConsoleSilencer } from "@/components/ConsoleSilencer";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ABAS | Kaset Fair AI Planning",
  description: "Automated AI-driven booth planning for Kaset Fair student zone",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ⭐ โหลด session จาก server
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PRBEHF72Y7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PRBEHF72Y7');
          `}
        </Script>
        <ConsoleSilencer />
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}