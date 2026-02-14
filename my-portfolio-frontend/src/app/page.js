"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import OverlayModal from "@/components/OverlayModal";
import ReferencesList from "@/components/ReferencesList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiUrl, withBase, withLang, parseJsonResponse } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { lang, t } = useLanguage();
  const [references, setReferences] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 100;

  useEffect(() => {
    async function loadReferences() {
      try {
        const res = await fetch(
          withLang(apiUrl("/api/references?populate=*"), lang),
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error("Failed to fetch references");
        const json = await parseJsonResponse(res);
        setReferences(json.data || []);
      } catch (error) {
        console.error(error);
      }
    }
    loadReferences();
  }, [lang]);

  useEffect(() => {
    setImages([]);
    setPage(1);
    setHasMore(true);
  }, [lang]);

  async function fetchImages(pageNumber) {
    if (!hasMore) return;
    setIsFetching(true);
    const qs = new URLSearchParams({
      populate: "*",
      "filters[home][$eq]": "true",
      "pagination[page]": pageNumber,
      "pagination[pageSize]": pageSize,
    });

    try {
      const res = await fetch(withLang(apiUrl(`/api/images?${qs}`), lang));

      // Stop pagination on 404 or other errors
      if (!res.ok) {
        setHasMore(false);
        return;
      }

      const json = await parseJsonResponse(res);
      const data = json?.data || [];

      // Stop pagination if no data
      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      const homeOnly = data.filter(
        (item) => item.home === true || item.attributes?.home === true,
      );

      const sorted = homeOnly.sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      );

      const mapped = sorted.map((item) => ({
        ...item,
      }));

      // Stop pagination if we got fewer items than page size
      if (data.length < pageSize) {
        setHasMore(false);
      }

      setImages((prev) => {
        const merged = [...prev, ...mapped];
        const seen = new Set();
        const unique = [];
        for (const item of merged) {
          const key = item.id || item.documentId;
          if (key && seen.has(key)) continue;
          if (key) seen.add(key);
          unique.push(item);
        }
        return unique;
      });
    } catch (err) {
      console.error("Error fetching images", err);
      // Stop pagination on any error
      setHasMore(false);
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchImages(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, lang]);

  useEffect(() => {
    function handleScroll() {
      if (isFetching || !hasMore) return;
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.offsetHeight - 120
      ) {
        setPage((p) => p + 1);
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetching, hasMore]);

  useEffect(() => {
    function handleKey(e) {
      if (selectedImageIndex === null) return;
      if (e.key === "ArrowLeft") {
        setSelectedImageIndex((idx) =>
          idx === 0 ? images.length - 1 : idx - 1,
        );
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((idx) =>
          idx === images.length - 1 ? 0 : idx + 1,
        );
      } else if (e.key === "Escape") {
        setSelectedImageIndex(null);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedImageIndex, images.length]);

  const openModal = (index) => setSelectedImageIndex(index);
  const closeModal = () => setSelectedImageIndex(null);
  const showPrev = () =>
    setSelectedImageIndex((idx) => (idx === 0 ? images.length - 1 : idx - 1));
  const showNext = () =>
    setSelectedImageIndex((idx) => (idx === images.length - 1 ? 0 : idx + 1));

  const currentImage =
    selectedImageIndex !== null ? images[selectedImageIndex] : null;

  const heroReferences = references.slice(0, 6);

  return (
    <div className="space-y-14 pb-10">
      <section className="container mx-auto px-4 pt-8 grid lg:grid-cols-[1.5fr,1fr] gap-10 items-center">
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="bg-white/70 text-foreground dark:bg-card/60"
          >
            {t("hero_badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            {t("hero_title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t("hero_subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/contact" className="flex items-center gap-2">
                {t("hero_cta_primary")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/references">{t("hero_cta_secondary")}</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {heroReferences.map((ref) => (
              <Badge
                key={ref.id}
                variant="soft"
                className="bg-muted text-foreground"
              >
                {ref.title}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-sky-50/40 to-white dark:from-neutral-900/60 dark:via-neutral-900/40 dark:to-neutral-900/40" />
          <CardContent className="relative grid grid-cols-2 gap-4 p-6">
            <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 dark:bg-card/70 px-4 py-3">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("hero_latest_drop")}
                </p>
                <p className="text-lg font-semibold">
                  {images[0]?.Title || t("hero_feature_default")}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/80 dark:bg-card/70 p-4 flex flex-col">
              <p className="text-4xl font-bold">{images.length}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {t("hero_shots")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/80 dark:bg-card/70 p-4 flex flex-col">
              <p className="text-4xl font-bold">{references.length}</p>
              <p className="text-background text-sm mt-1">
                {t("hero_clients")}
              </p>
            </div>
            <div className="col-span-2 relative overflow-hidden rounded-3xl border border-border/60 bg-muted/40 h-52">
              {images[0]?.image?.url &&
                (() => {
                  const heroImageUrl = withBase(images[0].image.url);
                  const isExternal =
                    heroImageUrl?.startsWith("http") &&
                    !heroImageUrl.includes("localhost") &&
                    !heroImageUrl.includes("127.0.0.1");
                  return (
                    <Image
                      src={heroImageUrl}
                      alt={images[0].Title || "Feature image"}
                      fill
                      sizes="(min-width: 1024px) 480px, 90vw"
                      className="object-cover"
                      priority
                      unoptimized={isExternal}
                    />
                  );
                })()}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {t("home_highlights_badge")}
            </p>
            <h2 className="text-3xl font-semibold mt-2">
              {t("home_highlights_title")}
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching || !hasMore}
          >
            {isFetching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("home_loading")}
              </span>
            ) : hasMore ? (
              t("home_load_more")
            ) : (
              t("home_complete")
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((item, index) => {
            const { id, Title, alt, image, originalWidth, originalHeight } =
              item;

            const imageUrl = image?.url ? withBase(image.url) : null;

            // Check if URL is external (from api.muhsinzade.com or other external domain)
            const isExternal =
              imageUrl?.startsWith("http") &&
              !imageUrl.includes("localhost") &&
              !imageUrl.includes("127.0.0.1");

            const aspectRatio =
              originalWidth && originalHeight
                ? `${originalWidth}/${originalHeight}`
                : "4/5";

            const randomX = Math.floor(Math.random() * 120 - 60);
            const randomY = Math.floor(Math.random() * 120 - 60);

            return (
              <motion.div
                key={id}
                className="cursor-pointer group"
                onClick={() => openModal(index)}
                initial={{ opacity: 0, x: randomX, y: randomY }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 90,
                  damping: 16,
                  delay: index * 0.03,
                }}
              >
                <Card className="overflow-hidden border-border/70 hover:border-border transition hover:-translate-y-1">
                  <div
                    className="relative overflow-hidden"
                    style={{ aspectRatio }}
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={alt || Title || "Gallery Image"}
                        fill
                        className="object-cover transition duration-500"
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                        priority={index < 6}
                        unoptimized={isExternal}
                      />
                    ) : (
                      <div className="p-4 text-muted-foreground">
                        {t("no_image")}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                    <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between text-white">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] opacity-80">
                          {Title || t("untitled")}
                        </p>
                        {alt && <p className="text-xs opacity-70">{alt}</p>}
                      </div>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {isFetching && (
          <div className="flex justify-center my-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </section>

      <OverlayModal
        isOpen={currentImage !== null}
        onClose={closeModal}
        onPrev={currentImage ? showPrev : null}
        onNext={currentImage ? showNext : null}
      >
        {currentImage && (
          <div className="relative w-full max-w-5xl">
            <div
              className="relative mx-auto overflow-hidden rounded-3xl border border-border/60 bg-muted/30"
              style={{
                aspectRatio:
                  currentImage.originalWidth && currentImage.originalHeight
                    ? `${currentImage.originalWidth}/${currentImage.originalHeight}`
                    : "4/3",
              }}
            >
              <Image
                src={withBase(currentImage.image.url)}
                alt={currentImage.alt || currentImage.Title || t("untitled")}
                fill
                className="object-contain"
                sizes="90vw"
                unoptimized={
                  withBase(currentImage.image.url)?.startsWith("http") &&
                  !withBase(currentImage.image.url)?.includes("localhost") &&
                  !withBase(currentImage.image.url)?.includes("127.0.0.1")
                }
              />
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>{currentImage.Title || t("untitled")}</span>
              <span>
                {selectedImageIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        )}
      </OverlayModal>

      <div className="container mx-auto px-4">
        <ReferencesList references={references} />
      </div>
    </div>
  );
}
