import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://wshka.ru",         priority: 1.0 },
    { url: "https://wshka.ru/roadmap", priority: 0.6 },
    { url: "https://wshka.ru/privacy", priority: 0.3 },
    { url: "https://wshka.ru/terms",   priority: 0.3 },
  ];
}
