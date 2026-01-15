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

export const metadata: Metadata = {
  title: "Memes for Tweets — Find the perfect meme in seconds",
  description: "Paste your tweet, get matched to the perfect meme from 100+ templates. Edit, download, and post. Free to try.",
  keywords: ["meme generator", "twitter meme", "meme maker", "meme templates", "tweet to meme"],
  authors: [{ name: "Memes for Tweets" }],
  creator: "Memes for Tweets",
  metadataBase: new URL("https://memes-for-tweets.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://memes-for-tweets.vercel.app",
    siteName: "Memes for Tweets",
    title: "Memes for Tweets — Find the perfect meme in seconds",
    description: "Paste your tweet, get matched to the perfect meme from 100+ templates. Edit, download, and post.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Memes for Tweets - Perfect meme in 10 seconds",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Memes for Tweets — Find the perfect meme in seconds",
    description: "Paste your tweet, get matched to the perfect meme from 100+ templates. Edit, download, and post.",
    images: ["/og-image.png"],
    creator: "@memesfortweets",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
