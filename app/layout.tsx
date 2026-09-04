import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "lunaDEV — Campanhas com IA",
  description: "Transforme uma foto de produto em campanhas completas com inteligência artificial.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
