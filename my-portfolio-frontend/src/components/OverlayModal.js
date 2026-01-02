"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Modal overlay styled with shadcn dialog primitives.
 * Supports keyboard closing via the dialog and optional prev/next controls.
 */
export default function OverlayModal({
  isOpen,
  onClose,
  onPrev,
  onNext,
  children,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-6xl border-none bg-transparent shadow-none p-0">
        <DialogTitle className="sr-only">Image Viewer</DialogTitle>
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/90 backdrop-blur-2xl">
          <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/20 via-black/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-center bg-background/60">
            {children}
            {onPrev && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur border-border/70"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {onNext && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur border-border/70"
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full bg-background/80 backdrop-blur border-border/70"
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
