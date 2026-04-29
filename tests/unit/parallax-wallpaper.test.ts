import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const baseCSS = readFileSync(
  resolve(__dirname, "../../src/app/styles/base.css"),
  "utf-8",
);
const darkCSS = readFileSync(
  resolve(__dirname, "../../src/app/styles/dark.css"),
  "utf-8",
);
const componentSrc = readFileSync(
  resolve(__dirname, "../../src/shared/ui/wallpaper-parallax.tsx"),
  "utf-8",
);

describe("parallax wallpaper", () => {
  describe("base.css — fixed layer", () => {
    it("declares body::before pseudo-element", () => {
      expect(baseCSS).toContain("body::before");
    });

    it("fixes the pseudo-element to the viewport", () => {
      expect(baseCSS).toContain("position: fixed");
    });

    it("places the wallpaper layer behind content", () => {
      expect(baseCSS).toContain("z-index: -1");
    });

    it("extends beyond viewport edges so shifts stay covered", () => {
      expect(baseCSS).toContain("inset: -120px");
    });

    it("does not set background-color on body (would cover z-index:-1 layer)", () => {
      const bodyBlockMatch = baseCSS.match(/\bbody\s*\{([^}]+)\}/);
      expect(bodyBlockMatch).not.toBeNull();
      expect(bodyBlockMatch![1]).not.toContain("background-color");
    });

    it("serves the wallpaper via body::before, not via body background-image", () => {
      const beforeIndex = baseCSS.indexOf("body::before");
      const wallpaperIndex = baseCSS.indexOf("url('/wallpaper.svg')");
      expect(beforeIndex).toBeGreaterThan(-1);
      expect(wallpaperIndex).toBeGreaterThan(-1);
      expect(wallpaperIndex).toBeGreaterThan(beforeIndex);
    });
  });

  describe("base.css — pointer-driven parallax", () => {
    it("uses CSS custom properties for the parallax offset", () => {
      expect(baseCSS).toContain("--wp-x");
      expect(baseCSS).toContain("--wp-y");
    });

    it("applies offset via transform translate for composited animation", () => {
      expect(baseCSS).toContain(
        "transform: translate(var(--wp-x, 0px), var(--wp-y, 0px))",
      );
    });

    it("does not use will-change so backdrop-filter on the header can see the layer", () => {
      expect(baseCSS).not.toContain("will-change");
    });
  });

  describe("base.css — accessibility", () => {
    it("respects prefers-reduced-motion in the client component", () => {
      expect(componentSrc).toContain("prefers-reduced-motion");
    });
  });

  describe("dark.css — dark mode integration", () => {
    it("dims the wallpaper pseudo-element in dark mode via opacity", () => {
      expect(darkCSS).toContain(".dark body::before");
      expect(darkCSS).toContain("opacity");
    });

    it("does not override body background-image in dark mode", () => {
      expect(darkCSS).not.toContain("url('/wallpaper.svg')");
    });
  });

  describe("wallpaper-parallax.tsx — client component", () => {
    it("is marked as a client component", () => {
      expect(componentSrc).toContain('"use client"');
    });

    it("listens for pointermove events", () => {
      expect(componentSrc).toContain("pointermove");
    });

    it("listens for wheel events (Mac trackpad incl. momentum scrolling)", () => {
      expect(componentSrc).toContain('"wheel"');
    });

    it("listens for scroll events (mobile touch scroll)", () => {
      expect(componentSrc).toContain('"scroll"');
    });

    it("uses window.scrollY as ground truth, not accumulated wheel deltas", () => {
      expect(componentSrc).toContain("window.scrollY");
      expect(componentSrc).not.toContain("wheelAccum");
    });

    it("maps scroll to a fraction of total page height for even distribution", () => {
      expect(componentSrc).toContain("scrollable");
      expect(componentSrc).toContain("fraction");
    });

    it("guards against division by zero on non-scrollable pages", () => {
      expect(componentSrc).toContain("scrollable > 0");
    });

    it("applies initial state on mount without waiting for the first event", () => {
      expect(componentSrc).toContain("update()");
    });

    it("uses requestAnimationFrame for throttling", () => {
      expect(componentSrc).toContain("requestAnimationFrame");
    });

    it("sets --wp-x and --wp-y custom properties", () => {
      expect(componentSrc).toContain("--wp-x");
      expect(componentSrc).toContain("--wp-y");
    });

    it("respects prefers-reduced-motion", () => {
      expect(componentSrc).toContain("prefers-reduced-motion");
    });

    it("removes the event listener on unmount", () => {
      expect(componentSrc).toContain("removeEventListener");
    });
  });
});
