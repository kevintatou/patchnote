import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "patchnote",
  description: "Paste a git diff, get a calm summary grouped by file."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="container">{children}</div>
        </main>
      </body>
    </html>
  );
}
