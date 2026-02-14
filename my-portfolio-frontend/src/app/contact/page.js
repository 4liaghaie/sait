"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data submitted:", formData);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10 bg-gradient-to-b from-white/70 via-transparent to-transparent">
      <Card className="w-full max-w-3xl border-border/70">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <Badge variant="outline" className="bg-white/60 dark:bg-card/60">
              {t("contact_badge")}
            </Badge>
            <h2 className="text-3xl font-bold">{t("contact_title")}</h2>
            <p className="text-muted-foreground">{t("contact_subtitle")}</p>
            <div className="text-sm text-muted-foreground space-y-1 pt-2">
              <p>
                <a href="mailto:saitmuhsinzade@gmail.com" className="hover:underline">
                  saitmuhsinzade@gmail.com
                </a>
              </p>
              <p>
                <a href="tel:+905373515560" className="hover:underline">
                  +90 5373515560
                </a>
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  {t("contact_name")}
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("contact_placeholder_name")}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  {t("contact_email")}
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("contact_placeholder_email")}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                {t("contact_message")}
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t("contact_placeholder_message")}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              {t("contact_submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
