import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GOOGLE_FONTS = [
  "Inter", "Montserrat", "Poppins", "Raleway", "Oswald",
  "Roboto", "Open+Sans", "Lato", "Nunito", "Rubik",
  "Work+Sans", "DM+Sans", "Space+Grotesk", "Outfit",
  "Bebas+Neue", "Anton", "Teko", "Archivo+Black", "Black+Ops+One",
  "Passion+One", "Bungee", "Righteous",
  "Playfair+Display", "Merriweather", "Lora", "Crimson+Text",
  "Source+Serif+4", "Noto+Serif",
  "Caveat", "Dancing+Script", "Permanent+Marker", "Pacifico",
  "JetBrains+Mono", "Fira+Code", "Space+Mono",
];

const googleFontsUrl = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(f => `family=${f}:ital,wght@0,100;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,300;1,400;1,500;1,600;1,700;1,800;1,900`).join("&")}&display=swap`;

export const metadata: Metadata = {
  title: "ChessBase India - Social Post Creator",
  description: "Create social media posts for ChessBase India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontsUrl} rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
