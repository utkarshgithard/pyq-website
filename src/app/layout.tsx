import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BEU PYQ — Previous year papers, made easy",
  description:
    "Find and download Bihar Engineering University previous year question papers by branch, semester, and paper code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
