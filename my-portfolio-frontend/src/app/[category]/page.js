"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiUrl, withBase, withLang, parseJsonResponse } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

function normalizeImageUrl(rawUrl) {
  if (!rawUrl) return null;
  const resolved = withBase(rawUrl);

  // If backend returns a Next.js optimizer URL, extract the original image URL.
  if (resolved.includes("/_next/image?")) {
    try {
      const parsed = new URL(resolved);
      const original = parsed.searchParams.get("url");
      if (original) return decodeURIComponent(original);
    } catch {
      return resolved;
    }
  }

  return resolved;
}

export default function CategoryGallery() {
  const { lang, t } = useLanguage();
  const { category } = useParams();
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 25;
  const decodedCategory = (() => {
    if (!category) return "";
    try {
      return decodeURIComponent(category);
    } catch {
      return category;
    }
  })();

  useEffect(() => {
    if (!category) return;
    setImages([]);
    setPage(1);
    setHasMore(true);
    fetchImages(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, lang]);

  // Separate effect to handle page changes
  useEffect(() => {
    if (page > 1 && category && hasMore) {
      fetchImages(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchImages(pageNumber) {
    if (!category || !hasMore) return;
    setIsFetching(true);
    try {
      const res = await fetch(
        withLang(
          apiUrl(
            `/api/images?populate=*&filters[categories][Title][$eq]=${category}&pagination[page]=${pageNumber}&pagination[pageSize]=${pageSize}`,
          ),
          lang,
        ),
      );

      // Stop pagination on 404 or other errors
      if (!res.ok) {
        setHasMore(false);
        return;
      }

      const json = await parseJsonResponse(res);
      const data = json?.data || [];

      // Stop pagination if no data or empty array
      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      const sortedImages = data.sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      );

      const mappedImages = sortedImages.map((item) => {
        const { width, height } = item.image || {};
        return {
          ...item,
          originalWidth: width,
          originalHeight: height,
        };
      });

      // Stop pagination if we got fewer items than page size
      if (sortedImages.length < pageSize) {
        setHasMore(false);
      }

      setImages((prev) => {
        const merged = [...prev, ...mappedImages];
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
    } catch (error) {
      console.error("Error fetching images:", error);
      // Stop pagination on any error
      setHasMore(false);
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    function handleScroll() {
      if (isFetching || !hasMore || !category) return;
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.offsetHeight - 120
      ) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          // Fetch will be triggered by the page change useEffect
          return nextPage;
        });
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetching, hasMore, category]);

  return (
    <div className="space-y-8 pb-10">
      <div className="container mx-auto px-4 pt-6 flex items-center justify-between">
        <div>
          <Badge variant="outline">{t("category_badge")}</Badge>
          <h1 className="text-3xl md:text-4xl font-semibold mt-2 capitalize">
            {decodedCategory?.replace(/-/g, " ") || "Gallery"}
          </h1>
          <p className="text-muted-foreground">{t("category_subtitle")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setPage((prevPage) => prevPage + 1);
          }}
          disabled={isFetching || !hasMore}
        >
          {isFetching ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("home_loading")}
            </span>
          ) : hasMore ? (
            t("category_load_more")
          ) : (
            t("home_complete")
          )}
        </Button>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((item, index) => {
            const { id, Title, alt, image, originalWidth, originalHeight } =
              item;
            const imageUrl = normalizeImageUrl(image?.url);
            const isExternal =
              imageUrl?.startsWith("http") &&
              !imageUrl.includes("localhost") &&
              !imageUrl.includes("127.0.0.1");

            const aspectRatio =
              originalWidth && originalHeight
                ? `${originalWidth}/${originalHeight}`
                : "4/5";

            return (
              <motion.div
                key={id}
                className="group"
                initial={{ opacity: 0, y: 24 }}
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
                        sizes="(min-width: 1024px) 25vw, 50vw"
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
      </div>
    </div>
  );
}
