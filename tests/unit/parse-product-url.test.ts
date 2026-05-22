import { describe, expect, it, vi, afterEach } from "vitest";
import { extractFromHtml } from "../../src/modules/item/parse-product-url";

// We test the pure HTML extraction logic directly to avoid real network calls.
// The top-level parseProductUrl() function is integration-level; it is not
// tested here because it makes outbound HTTP requests.

describe("extractFromHtml", () => {
  describe("JSON-LD Product", () => {
    it("extracts title, price, currency, and image from valid JSON-LD", () => {
      const html = `<html><head>
        <script type="application/ld+json">
        {
          "@type": "Product",
          "name": "Fancy Headphones",
          "image": "https://cdn.example.com/img.jpg",
          "offers": {
            "@type": "Offer",
            "price": "4990",
            "priceCurrency": "RUB"
          }
        }
        </script>
      </head></html>`;

      const result = extractFromHtml(html);
      expect(result.title).toBe("Fancy Headphones");
      expect(result.price).toBe(4990);
      expect(result.currency).toBe("RUB");
      expect(result.externalImageUrl).toBe("https://cdn.example.com/img.jpg");
    });

    it("uses image from OG tag when JSON-LD has no image", () => {
      const html = `<html><head>
        <meta property="og:image" content="https://og.example.com/img.jpg" />
        <script type="application/ld+json">
        {
          "@type": "Product",
          "name": "Widget",
          "offers": { "price": "99", "priceCurrency": "USD" }
        }
        </script>
      </head></html>`;

      const result = extractFromHtml(html);
      expect(result.externalImageUrl).toBe("https://og.example.com/img.jpg");
      expect(result.title).toBe("Widget");
    });

    it("handles array image field", () => {
      const html = `<html><head>
        <script type="application/ld+json">
        {
          "@type": "Product",
          "name": "Camera",
          "image": ["https://img1.example.com/1.jpg", "https://img2.example.com/2.jpg"]
        }
        </script>
      </head></html>`;

      const result = extractFromHtml(html);
      expect(result.externalImageUrl).toBe("https://img1.example.com/1.jpg");
    });

    it("finds Product inside @graph container", () => {
      const html = `<html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "WebSite", "name": "Shop" },
            {
              "@type": "Product",
              "name": "Sneakers",
              "offers": { "price": "7500", "priceCurrency": "RUB" }
            }
          ]
        }
        </script>
      </head></html>`;

      const result = extractFromHtml(html);
      expect(result.title).toBe("Sneakers");
      expect(result.price).toBe(7500);
    });

    it("ignores unsupported currency codes", () => {
      const html = `<html><head>
        <script type="application/ld+json">
        {
          "@type": "Product",
          "name": "Item",
          "offers": { "price": "10", "priceCurrency": "JPY" }
        }
        </script>
      </head></html>`;

      const result = extractFromHtml(html);
      expect(result.price).toBe(10);
      expect(result.currency).toBeUndefined();
    });

    it("returns empty on malformed JSON-LD", () => {
      const html = `<html><head>
        <script type="application/ld+json">{ not valid json </script>
        <meta property="og:title" content="Fallback Title" />
      </head></html>`;

      const result = extractFromHtml(html);
      // Should fall back to OG tags
      expect(result.title).toBe("Fallback Title");
    });
  });

  describe("OG meta tag fallback", () => {
    it("extracts title and image from OG tags when no JSON-LD", () => {
      const html = `<html><head>
        <meta property="og:title" content="Product from OG" />
        <meta property="og:image" content="https://og.example.com/product.jpg" />
      </head></html>`;

      const result = extractFromHtml(html);
      expect(result.title).toBe("Product from OG");
      expect(result.externalImageUrl).toBe("https://og.example.com/product.jpg");
    });

    it("decodes HTML entities in OG title", () => {
      const html = `<html><head>
        <meta property="og:title" content="Widget &amp; Gadget &lt;Pro&gt;" />
      </head></html>`;

      const result = extractFromHtml(html);
      expect(result.title).toBe("Widget & Gadget <Pro>");
    });

    it("returns empty object when no metadata found", () => {
      const html = `<html><head><title>Page</title></head></html>`;
      const result = extractFromHtml(html);
      expect(result).toEqual({});
    });
  });
});

describe("Wildberries article extraction (via URL pattern)", () => {
  // We test the URL pattern logic indirectly through parseProductUrl.
  // Since parseProductUrl makes real HTTP calls, we mock fetch here.

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses article ID from /catalog/<nm>/detail.aspx URL format", async () => {
    const { parseProductUrl } = await import(
      "../../src/modules/item/parse-product-url"
    );

    const mockProduct = {
      id: 12345,
      name: "FM Transmitter",
      brand: "Roidmi",
      salePriceU: 199000, // 1990 RUB in kopecks
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { products: [mockProduct] } }),
      }),
    );

    const result = await parseProductUrl(
      "https://www.wildberries.ru/catalog/12345/detail.aspx",
    );

    expect(result.title).toBe("Roidmi FM Transmitter");
    expect(result.price).toBe(1990);
    expect(result.currency).toBe("RUB");
    expect(result.externalImageUrl).toMatch(/wbbasket\.ru/);
  });

  it("returns empty object when WB API returns no products", async () => {
    const { parseProductUrl } = await import(
      "../../src/modules/item/parse-product-url"
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { products: [] } }),
      }),
    );

    const result = await parseProductUrl(
      "https://www.wildberries.ru/catalog/99999/detail.aspx",
    );

    expect(result).toEqual({});
  });

  it("returns empty object on network error", async () => {
    const { parseProductUrl } = await import(
      "../../src/modules/item/parse-product-url"
    );

    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("timeout")));

    const result = await parseProductUrl(
      "https://www.wildberries.ru/catalog/12345/detail.aspx",
    );

    expect(result).toEqual({});
  });

  it("returns empty object for an invalid URL", async () => {
    const { parseProductUrl } = await import(
      "../../src/modules/item/parse-product-url"
    );

    const result = await parseProductUrl("not a url");
    expect(result).toEqual({});
  });
});
