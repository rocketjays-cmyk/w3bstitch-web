export const metadata = { title: "W3b Stitch" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
        {children}
      </body>
    </html>
  );
}
