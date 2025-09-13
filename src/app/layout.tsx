import type { Metadata } from "next";
import "./globals.css";
import BackButton from "../components/BackButton";


export const metadata: Metadata = {
  title: "W3b Stitch- Trust Engine",
  description: "Decentralized trust engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BackButton />
        {children}
      </body>
    </html>
  );
}
