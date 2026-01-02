// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Providers } from "./providers";
import Head from "next/head";
import { apiUrl, parseJsonResponse } from "@/lib/api";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Saeed Muhsinzade",
  description: "Saeed Muhsinzade Photography potfolio",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "en";
  
  let categories = [];
  try {
    const url = apiUrl("/api/categories?populate=*");
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, {
      next: { revalidate: 10 },
      headers: { "Accept-Language": lang },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const json = await parseJsonResponse(res);
    categories = json?.data || [];
  } catch (error) {
    // Silently handle errors - app should still render
    if (process.env.NODE_ENV === "development") {
      console.warn("Could not fetch categories:", error.message);
    }
    // Continue with empty categories array to prevent app crash
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500&family=Geist+Mono&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased  min-h-screen flex flex-col font-geist-sans">
        <Providers>
          <Navbar categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
