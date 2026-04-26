import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3 Idiots",
  description: "A private sibling group chat with realtime messages, media, and video calls."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
