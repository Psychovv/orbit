import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#844DFE",
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  title: {
    default: "Orbit — Hub Pessoal Cósmico",
    template: "%s · Orbit",
  },
  description: "Organização semanal de tarefas, objetivos e controle financeiro em uma atmosfera espacial fluida.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Orbit",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-300 selection:bg-brand/25 selection:text-brand">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
