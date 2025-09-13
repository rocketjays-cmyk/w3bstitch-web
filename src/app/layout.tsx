import type { Metadata } from "next";
import "./globals.css";
import BackButton from "../components/BackButton";

export const metadata: Metadata = {
  title: "W3b Stitch- Trust Engine",
  description: "Decentralized trust engine",
};

// Root layout for all pages of the application.  This wraps every page in the
// required `<html>` and `<body>` tags and ensures the global `BackButton`
// component and page content are rendered correctly.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BackButton />
        {children}
      </body>
    </html>
  );
}
