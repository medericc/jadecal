import './globals.css';
import { Analytics } from "@vercel/analytics/react";
import Head from 'next/head';

export const metadata = {
  title: "Calendrier de Jade la Béarnaise",
  description: "Le calendrier des matchs de Jade.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Calendrier de Jade la Béarnaise",
    description: "Le calendrier des matchs de Jade.",
    url: "https://jade-calendrier.vercel.app/",
    siteName: "Jade la Béarnaise Schedule",
    images: [
      {
        url: "https://jade-calendrier.vercel.app/preview.jpg",
        width: 1200,
        height: 630,
        alt: "Jade la Béarnaise Schedule",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calendrier de Jade la Béarnaise",
    description: "Le calendrier des matchs de Jade.",
    images: ["https://jade-calendrier.vercel.app/preview.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <Head>
        {/* Icônes pour navigateur et mobile */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff6600" />
      </Head>
      <body className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
        <header className="bg-gradient-to-r from-purple-800 to-purple-900 text-white p-8 text-4xl font-extrabold text-center shadow-md">
          MATCH DE JADE
        </header>
        <main className="container mx-auto mt-4">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
