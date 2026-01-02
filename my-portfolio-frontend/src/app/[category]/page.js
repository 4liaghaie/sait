"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import OverlayModal from "@/components/OverlayModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiUrl, withBase, withLang, parseJsonResponse } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export default function CategoryGallery() {
  const { lang, t } = useLanguage();
  const { category } = useParams();
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 25;

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
            `/api/images?populate=*&filters[categories][Title][$eq]=${category}&pagination[page]=${pageNumber}&pagination[pageSize]=${pageSize}`
          ),
          lang
        )
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
        (a, b) => (a.position || 0) - (b.position || 0)
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImageIndex !== null) {
        if (e.key === "ArrowLeft") {
          setSelectedImageIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
          );
        } else if (e.key === "ArrowRight") {
          setSelectedImageIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
          );
        } else if (e.key === "Escape") {
          setSelectedImageIndex(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, images.length]);

  const openModal = (index) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  const showPrev = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const showNext = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const currentImage =
    selectedImageIndex !== null ? images[selectedImageIndex] : null;

  return (
    <div className="space-y-8 pb-10">
      <div className="container mx-auto px-4 pt-6 flex items-center justify-between">
        <div>
          <Badge variant="outline">{t("category_badge")}</Badge>
          <h1 className="text-3xl md:text-4xl font-semibold mt-2 capitalize">
            {category?.replace(/-/g, " ") || "Gallery"}
          </h1>
          <p className="text-muted-foreground">{t("category_subtitle")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchImages(nextPage);
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
            const imageUrl = image?.url
              ? (image.url.startsWith("http") ? image.url : withBase(image.url))
              : null;
            
            // Check if URL is external (from api.muhsinzade.com or other external domain)
            const isExternal = imageUrl?.startsWith("http") && 
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
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        unoptimized={isExternal}
                      />
                    ) : (
                      <div className="p-4 text-muted-foreground">{t("no_image")}</div>
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
                src={currentImage.image?.url?.startsWith("http") ? currentImage.image.url : withBase(currentImage.image?.url || "")}
                alt={currentImage.alt || currentImage.Title || t("untitled")}
                fill
                className="object-contain"
                sizes="90vw"
                unoptimized={(() => {
                  const url = currentImage.image?.url?.startsWith("http") ? currentImage.image.url : withBase(currentImage.image?.url || "");
                  return url?.startsWith("http") && !url.includes("localhost") && !url.includes("127.0.0.1");
                })()}
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
    </div>
  );
}
