import type { Metadata } from "next";
import "./globals.css";
import BackButton from "../components/BackButton";
import { DidProvider } from "../components/DidProvider";
import { WalletProvider } from "../components/WalletProvider";

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
        <DidProvider>
          <WalletProvider>
            <BackButton />
            {children}
          </WalletProvider>
        </DidProvider>
      </body>
    </html>
  );
}
