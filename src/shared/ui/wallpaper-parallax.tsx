"use client";

import { useEffect } from "react";

/**
 * Drives the wallpaper parallax via two combined inputs:
 *
 *  • pointermove (mouse / touch drag) — shifts the layer ±20 px on X and Y,
 *    opposite to pointer direction, creating a depth-through-window effect.
 *
 *  • scroll + wheel — both trigger a re-read of window.scrollY.
 *    `wheel` catches Mac trackpad gestures (incl. momentum scroll).
 *    `scroll` catches mobile touch scroll (wheel does not fire on touch).
 *    The offset is a fraction of total page height mapped to SCROLL_MAX px,
 *    so the effect is distributed evenly regardless of page length.
 *
 * window.scrollY is always the ground truth — no delta accumulation.
 * Both inputs are RAF-throttled and write to --wp-x / --wp-y on <html>.
 * Disabled entirely when prefers-reduced-motion: reduce is set.
 */
export function WallpaperParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const MOUSE_INTENSITY = 40; // full range in px; actual offset is ±20 px
    const SCROLL_MAX = 90; // total background shift at full-page scroll (px)

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let rafId: number;

    const update = () => {
      const mx = (0.5 - mouseX / window.innerWidth) * MOUSE_INTENSITY;
      const my = (0.5 - mouseY / window.innerHeight) * MOUSE_INTENSITY;

      // Fraction of page scrolled (0 at top → 1 at bottom).
      // Guard against non-scrollable pages (scrollable === 0).
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const fraction = scrollable > 0 ? window.scrollY / scrollable : 0;
      const sy = -fraction * SCROLL_MAX;

      const root = document.documentElement;
      root.style.setProperty("--wp-x", `${mx.toFixed(2)}px`);
      root.style.setProperty("--wp-y", `${(my + sy).toFixed(2)}px`);
    };

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    // Shared trigger for both wheel and scroll events.
    // wheel  → Mac trackpad / mouse wheel (does not fire on mobile touch scroll)
    // scroll → mobile touch scroll (fires as window.scrollY changes)
    const onScrollTrigger = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    update();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("wheel", onScrollTrigger, { passive: true });
    window.addEventListener("scroll", onScrollTrigger, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("wheel", onScrollTrigger);
      window.removeEventListener("scroll", onScrollTrigger);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
