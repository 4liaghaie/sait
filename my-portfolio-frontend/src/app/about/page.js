import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiUrl, parseJsonResponse } from "@/lib/api";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";

async function getAboutData(lang) {
  try {
    const res = await fetch(apiUrl(`/api/about?populate=*&lang=${lang}`), {
      headers: { "Accept-Language": lang },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch About data");
    }
    const data = await parseJsonResponse(res);
    return data?.data?.About_text || "No content found.";
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Could not fetch about data:", error.message);
    }
    return "No content found.";
  }
}

export default async function About() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "en";
  const t = (key) => translations[lang]?.[key] ?? translations.en?.[key] ?? key;
  const aboutContent = await getAboutData(lang);

  return (
    <section className="container mx-auto px-4 py-12 space-y-10">
      <div className="grid lg:grid-cols-[1.3fr,0.9fr] gap-10 items-start">
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="bg-white/70 dark:bg-card/60 text-foreground/80"
          >
            {t("about_badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            {t("about_title")}
          </h1>
          <div
            className="prose prose-lg max-w-none text-foreground/90 dark:prose-invert prose-a:text-foreground"
            dangerouslySetInnerHTML={{ __html: aboutContent }}
          />
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-slate-50/30 to-white dark:from-neutral-900/70 dark:via-neutral-900/50 dark:to-neutral-900/50" />
          <CardContent className="relative p-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border/60 bg-muted/40">
              <Image
                src="/static-image.jpg"
                alt="Saeed Muhsinzade"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 420px, 90vw"
                priority
              />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">
                {t("about_tags")}
              </p>
              <p className="text-foreground">{t("about_bio")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
