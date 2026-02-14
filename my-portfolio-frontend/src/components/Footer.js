"use client";
import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const socials = [
    {
      href: "https://www.instagram.com/sait_mosallat/?utm_source=ig_web_button_share_sheet",
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

  return (
    <footer className="mt-12 border-t border-border/70 bg-background/80 backdrop-blur">
      <div className="container mx-auto px-4 py-10">
        <Card className="border-none bg-gradient-to-r from-white/80 via-white/60 to-white/70 dark:from-neutral-900/60 dark:via-neutral-900/40 dark:to-neutral-900/60">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
            <div>
              <CardTitle className="text-2xl">{t("footer_title")}</CardTitle>
              <CardDescription className="mt-2 text-sm max-w-xl">
                {t("footer_desc")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {socials.map((item) => (
                <Button
                  key={item.href}
                  variant="outline"
                  size="icon"
                  asChild
                  className="rounded-full border-border/80 hover:border-border"
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
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground mt-6">
          <p>
            &copy; {new Date().getFullYear()} Sait Muhsinzade. All rights
            reserved.
          </p>
          <p className="mt-2 sm:mt-0">{t("footer_tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
