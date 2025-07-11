import { Inter, Fira_Code } from "next/font/google";

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firacode = Fira_Code({
  subsets: ["latin"],
});

import "./globals.css";

export const metadata = {
  title: "Alchemizing - The game of reverse-creation",
  description:
    "The game of reverse-creation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${interFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
