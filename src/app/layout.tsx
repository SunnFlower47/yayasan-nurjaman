import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "@/styles/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Yayasan Nurjaman Bongas Purwakarta",
  description:
    "Portal resmi dan sistem manajemen Yayasan Nurjaman Bongas Purwakarta, Jawa Barat.",
  icons: {
    icon: "/brand/logo-yayasan-nurjaman.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${sourceSerif4.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary-100 selection:text-primary-900">
        {children}
      </body>
    </html>
  );
}
