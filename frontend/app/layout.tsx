import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autonomous Dynamic Pricing Engine Dashboard",
  description: "Autonomous E-Commerce Competitive Intelligence & Dynamic Pricing Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#0b0f19] text-gray-100 antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
