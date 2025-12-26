import Link from "next/link";
import { cookies } from "next/headers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiUrl, withBase, withLang } from "@/lib/api";
import { translations } from "@/lib/translations";

async function fetchWorkData(lang) {
  const [catsRes, imgsRes] = await Promise.all([
    fetch(apiUrl("/api/categories"), {
      headers: { "Accept-Language": lang },
      cache: "no-store",
    }),
    fetch(withLang(apiUrl("/api/images"), lang), { cache: "no-store" }),
  ]);

  if (!catsRes.ok) throw new Error("Failed to load categories");
  if (!imgsRes.ok) throw new Error("Failed to load images");

  const [catsJson, imgsJson] = await Promise.all([
    catsRes.json(),
    imgsRes.json(),
  ]);

  return { categories: catsJson.data || [], images: imgsJson.data || [] };
}

function pickImageForCategory(categoryId, images = []) {
  const match = images.find((img) =>
    (img.categories || []).some(
      (cat) => cat.id === categoryId || cat.documentId === categoryId
    )
  );
  return match?.image?.url ? withBase(match.image.url) : null;
}

export default async function WorkPage() {
  const lang = cookies().get("lang")?.value || "en";
  const t = (key) => translations[lang]?.[key] ?? translations.en?.[key] ?? key;
  const { categories, images } = await fetchWorkData(lang);

  return (
    <section className="container mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="bg-muted/60">
            {t("work_badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-semibold">
            {t("work_title")}
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            {t("work_subtitle")}
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">{t("work_empty")}</p>
      ) : (
        <div className="grid gap-6 md:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {categories
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((cat) => {
              const imageUrl = pickImageForCategory(cat.id, images);
              return (
                <Link key={cat.id} href={`/${cat.Title}`}>
                  <Card className="relative overflow-hidden border-border/70 transition hover:-translate-y-1 hover:shadow-xl">
                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent"
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: imageUrl
                          ? `url(${imageUrl})`
                          : "linear-gradient(135deg, #111827, #1f2937)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <CardContent className="relative p-6 flex flex-col justify-end min-h-[220px] gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-white/80 shadow" />
                        <p className="text-sm uppercase tracking-[0.2em] text-white/80">
                          {t("category_badge")}
                        </p>
                      </div>
                      <div className="space-y-2 text-white drop-shadow-lg">
                        <h2 className="text-2xl font-semibold">{cat.Title}</h2>
                        {cat.Description ? (
                          <p className="text-sm text-white/80 line-clamp-2">
                            {cat.Description}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/90 text-black hover:bg-white"
                        >
                          {t("work_view")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
        </div>
      )}
    </section>
  );
}
