import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "TransitOps — Smart Transport Operations Platform",
  description:
    "TransitOps: End-to-end fleet, driver, trip, maintenance, and expense management for modern logistics teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/*
       * Inline script runs before React hydrates, reading localStorage and
       * applying data-theme to <html> to prevent a Flash Of Unstyled Content
       * (FOUC) on page load. This is the standard pattern for SSR dark mode.
       */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('theme');
                var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', saved || system);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}

