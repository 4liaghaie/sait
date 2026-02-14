"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Facebook, Instagram, Linkedin, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { apiUrl, withBase, parseJsonResponse } from "@/lib/api";

export default function Navbar({ categories = [] }) {
  const [logoUrl, setLogoUrl] = useState("");
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchLogo() {
      try {
        const res = await fetch(apiUrl(`/api/logo?populate=*&lang=${lang}`), {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await parseJsonResponse(res);
          const logo =
            data?.data?.img?.formats?.medium?.url || data?.data?.img?.url;
          setLogoUrl(logo ? withBase(logo) : "");
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
      }
    }
    fetchLogo();
  }, [lang]);

  const orderedCategories = useMemo(() => {
    return categories
      ?.filter((cat) => typeof cat.position === "number")
      .sort((a, b) => a.position - b.position);
  }, [categories]);

  const navLinks = [
    { href: "/", label: t("nav_home") },
    { href: "/work", label: t("nav_work") },
    { href: "/about", label: t("nav_about") },
    { href: "/references", label: t("nav_references") },
    { href: "/contact", label: t("nav_contact") },
  ];

  const socialIcons = [
    {
      href: "https://www.instagram.com/_muhsinzade/?utm_source=ig_web_button_share_sheet",
      icon: <Instagram className="h-5 w-5" />,
      label: "Instagram",
    },
    {
      href: "https://www.facebook.com/saeed.mosallat",
      icon: <Facebook className="h-5 w-5" />,
      label: "Facebook",
    },
    {
      href: "https://www.linkedin.com/in/saeed-muhsinzade-569104177/",
      icon: <Linkedin className="h-5 w-5" />,
      label: "LinkedIn",
    },
  ];

  const themeToggle = (
    <Button
      aria-label="Toggle theme"
      aria-pressed={isDark}
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-9 w-16 rounded-full border border-border/80 bg-muted/40 p-0 hover:bg-muted/60"
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-200/40 to-sky-300/40 dark:from-slate-700/60 dark:to-indigo-500/40" />
      <span
        className={cn(
          "absolute top-1 h-7 w-7 rounded-full bg-background shadow-md ring-1 ring-border/80 transition-all duration-500 ease-out",
          isDark ? "left-8 rotate-[360deg]" : "left-1 rotate-0",
        )}
      >
        <span className="relative flex h-full w-full items-center justify-center">
          <Sun
            className={cn(
              "absolute h-4 w-4 text-amber-500 transition-all duration-300",
              isDark ? "scale-0 opacity-0 -rotate-90" : "scale-100 opacity-100 rotate-0",
            )}
          />
          <Moon
            className={cn(
              "absolute h-4 w-4 text-indigo-500 transition-all duration-300",
              isDark ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 rotate-90",
            )}
          />
        </span>
      </span>
    </Button>
  );

  const languageToggle = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={lang === "en" ? "default" : "outline"}
        onClick={() => setLang("en")}
      >
        EN
      </Button>
      <Button
        size="sm"
        variant={lang === "tr" ? "default" : "outline"}
        onClick={() => setLang("tr")}
      >
        TR
      </Button>
    </div>
  );

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/20 border-b border-border/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Saeed Muhsinzade"
                  className="h-12 w-auto rounded-2xl border border-border/60 bg-white/60 p-1 shadow-sm"
                />
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-muted" />
              )}
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t("nav_subtitle")}
              </p>
              <h1 className="text-lg font-semibold">Sait Muhsinzade</h1>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {languageToggle}
            {socialIcons.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="icon"
                asChild
                className="border border-border/70 hover:bg-muted/60"
              >
                <Link href={item.href} target="_blank" aria-label={item.label}>
                  {item.icon}
                </Link>
              </Button>
            ))}
            {themeToggle}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            {themeToggle}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col justify-between">
                <div className="space-y-6 mt-6">
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Saeed Muhsinzade"
                        className="h-10 w-auto rounded-xl border border-border/60 bg-white/60 p-1"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-muted" />
                    )}
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Photography
                      </p>
                      <p className="text-sm font-semibold">Sait Muhsinzade</p>
                    </div>
                  </div>
                  <nav className="space-y-3">
                    {navLinks.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                            "hover:bg-muted"
                          )}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>
                <div className="flex items-center gap-2">{languageToggle}</div>
                <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                  {socialIcons.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      size="icon"
                      asChild
                      className="border border-border/70 hover:bg-muted/60"
                    >
                      <Link
                        href={item.href}
                        target="_blank"
                        aria-label={item.label}
                      >
                        {item.icon}
                      </Link>
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
