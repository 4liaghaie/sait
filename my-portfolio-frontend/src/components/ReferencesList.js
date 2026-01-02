"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiUrl, withBase } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

function buildUrl(imageData) {
  const path = imageData?.formats?.medium?.url || imageData?.url;
  if (!path) return null;
  return withBase(path);
}

export default function ReferencesList({ references }) {
  const { lang, t } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleClick = async (ref) => {
    setSelected(ref);
    if (ref.images?.length) {
      setLoading(true);
      try {
        const res = await Promise.all(
          ref.images.map((img) =>
            fetch(
              apiUrl(`/api/images/${img.documentId}?populate=*&lang=${lang}`)
            ).then((r) => r.json())
          )
        );
        setImages(res.map((r) => r.data));
      } catch {
        setImages([]);
      } finally {
        setLoading(false);
      }
    } else {
      setImages([]);
    }
  };

  const closeModal = () => setSelected(null);

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-24 py-10 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Badge variant="outline text-foreground">
            {t("references_badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold mt-3">
            {t("references_title")}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {t("references_subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {references.map((ref) => {
          const lightUrl = buildUrl(ref.logo_light);
          const darkUrl = buildUrl(ref.logo_dark);

          return (
            <Card
              key={ref.id}
              className="group cursor-pointer border-border/60 hover:border-border transition hover:-translate-y-1"
              onClick={() => handleClick(ref)}
            >
              <CardContent className="flex items-center justify-center h-28 md:h-32 relative">
                {lightUrl && (
                  <Image
                    src={lightUrl}
                    alt={`${ref.title} logo`}
                    fill
                    sizes="(min-width: 1024px) 160px, 30vw"
                    className="object-contain block dark:hidden"
                    unoptimized
                  />
                )}
                {darkUrl && (
                  <Image
                    src={darkUrl}
                    alt={`${ref.title} logo dark`}
                    fill
                    sizes="(min-width: 1024px) 160px, 30vw"
                    className="object-contain hidden dark:block"
                    unoptimized
                  />
                )}
                {!lightUrl && !darkUrl && (
                  <span className="text-sm text-muted-foreground">
                    {ref.title}
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-2xl">
                {selected?.title || "Reference"}
              </DialogTitle>
              {selected?.year && (
                <Badge variant="soft" className="bg-muted text-foreground">
                  {selected.year}
                </Badge>
              )}
            </div>
          </DialogHeader>
          {selected && (
            <>
              {selected.description && (
                <p className="text-muted-foreground">{selected.description}</p>
              )}

              {loading ? (
                <p className="text-sm text-muted-foreground">
                  {t("references_loading")}
                </p>
              ) : images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {images.map((imgData) => {
                    const url = buildUrl(imgData.image);
                    return (
                      <div
                        key={imgData.id}
                        className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border border-border/70 bg-muted/40"
                      >
                        {url && (
                          <Image
                            src={url}
                            alt={imgData.image?.alt || "Reference image"}
                            fill
                            className="object-contain"
                            sizes="(min-width: 1024px) 400px, 90vw"
                            unoptimized
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("references_empty")}
                </p>
              )}
              <div className="flex justify-end mt-4">
                <Button variant="ghost" onClick={closeModal}>
                  {t("references_close")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
