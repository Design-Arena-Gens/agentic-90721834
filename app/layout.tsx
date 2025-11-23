import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Per-nefer Embalming Workshop",
  description:
    "Cinematic wide-angle visualization of the Per-nefer embalming chamber with dramatic torchlight and incense."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
