import * as cheerio from "cheerio";

export type ParsedProduct = {
  title?: string;
  price?: number;
  currency?: string;
  externalImageUrl?: string;
};

/** Browser-like headers to reduce bot-detection rejections. */
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
};

/**
 * Social-media crawler UA.
 * Ozon must serve OG-tagged HTML to social crawlers so that links preview
 * correctly on Telegram/WhatsApp/VK. Typically bypasses bot-detection
 * unless the site also checks the source IP against Facebook's known ranges.
 */
const SOCIAL_CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

/**
 * Googlebot UA.
 * Sites cannot block Googlebot without losing search-engine indexing.
 * Used as a second attempt when the social-crawler UA is blocked.
 * Note: sophisticated sites may still verify the source IP against
 * Google's published ranges, in which case this will not help.
 */
const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/**
 * Telegram link-preview bot UA.
 * Ozon must serve rich HTML to Telegram so that product links preview
 * in chats. Used as a third fallback after Facebook and Googlebot.
 */
const TELEGRAMBOT_UA = "TelegramBot (like TwitterBot)";

/** Timeout for all outbound HTTP requests (ms). */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Parse product metadata from a marketplace URL.
 * Returns empty object on any failure — all errors are swallowed.
 * Supports short URLs (e.g. ozon.ru/t/xxx) via fetch redirect-follow.
 */
export async function parseProductUrl(rawUrl: string): Promise<ParsedProduct> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {};
  }

  try {
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "wildberries.ru" || hostname === "wb.ru") {
      return await parseWildberries(url);
    }

    if (hostname === "ozon.ru") {
      // Strip query params (e.g. ?at=<affiliate_token>) that may trigger
      // anti-bot pages or affiliate redirect loops on direct product URLs.
      const cleanUrl = url.pathname.startsWith("/t/")
        ? rawUrl // short links — keep as-is, redirect carries us to the product
        : `${url.origin}${url.pathname}`;
      return await parseOzon(cleanUrl);
    }

    return await parseGeneric(rawUrl);
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Wildberries — public card API (no HTML parsing)
// ---------------------------------------------------------------------------

/** Extract the article number (nm) from a WB product URL. */
function extractWbArticle(url: URL): number | null {
  const match = url.pathname.match(/\/catalog\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Determine the WB image CDN basket host from the article vol.
 * Based on the publicly documented basket-id distribution table.
 */
function wbBasketHost(vol: number): string {
  if (vol <= 143) return "basket-01";
  if (vol <= 287) return "basket-02";
  if (vol <= 431) return "basket-03";
  if (vol <= 719) return "basket-04";
  if (vol <= 1007) return "basket-05";
  if (vol <= 1061) return "basket-06";
  if (vol <= 1115) return "basket-07";
  if (vol <= 1169) return "basket-08";
  if (vol <= 1313) return "basket-09";
  if (vol <= 1601) return "basket-10";
  if (vol <= 1655) return "basket-11";
  if (vol <= 1919) return "basket-12";
  if (vol <= 2045) return "basket-13";
  if (vol <= 2189) return "basket-14";
  if (vol <= 2405) return "basket-15";
  if (vol <= 2621) return "basket-16";
  if (vol <= 2837) return "basket-17";
  if (vol <= 3053) return "basket-18";
  if (vol <= 3269) return "basket-19";
  if (vol <= 3485) return "basket-20";
  return "basket-21";
}

async function parseWildberries(url: URL): Promise<ParsedProduct> {
  const nm = extractWbArticle(url);
  if (!nm) return {};

  const apiUrl = `https://card.wb.ru/cards/v1/detail?nm=${nm}`;
  const res = await fetch(apiUrl, {
    headers: { "User-Agent": FETCH_HEADERS["User-Agent"] },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) return {};

  const json = (await res.json()) as Record<string, unknown>;
  const products = (json?.data as Record<string, unknown>)
    ?.products as Array<Record<string, unknown>> | undefined;
  const product = products?.[0];
  if (!product) return {};

  const brand = product.brand as string | undefined;
  const name = product.name as string | undefined;
  const title = [brand, name].filter(Boolean).join(" ") || undefined;

  const salePriceU = product.salePriceU as number | undefined;
  const price = salePriceU ? salePriceU / 100 : undefined;

  // Compose the main image URL from article arithmetic.
  const vol = Math.floor(nm / 100000);
  const part = Math.floor(nm / 1000);
  const basket = wbBasketHost(vol);
  const externalImageUrl = `https://${basket}.wbbasket.ru/vol${vol}/part${part}/${nm}/images/big/1.webp`;

  return {
    title,
    price,
    currency: price !== undefined ? "RUB" : undefined,
    externalImageUrl,
  };
}

// ---------------------------------------------------------------------------
// Ozon / generic — fetch HTML + OG meta + JSON-LD (eBay, AliExpress, others)
// ---------------------------------------------------------------------------

/**
 * Fetch Ozon product HTML by trying multiple crawler UAs in sequence.
 *
 * Ozon serves OG-tagged HTML to recognised crawlers so that product links
 * preview correctly in social apps:
 *  1. facebookexternalhit — succeeds unless Ozon checks Facebook's IP ranges.
 *  2. Googlebot — Ozon cannot block it without losing search ranking.
 *  3. TelegramBot — Ozon serves rich HTML for Telegram link previews.
 * All attempts include Referer: google.ru to simulate organic traffic.
 *
 * Short links (ozon.ru/t/xxx) follow HTTP redirects transparently.
 */
async function parseOzon(rawUrl: string): Promise<ParsedProduct> {
  const UAs = [SOCIAL_CRAWLER_UA, GOOGLEBOT_UA, TELEGRAMBOT_UA];

  for (const ua of UAs) {
    try {
      const res = await fetch(rawUrl, {
        headers: {
          "User-Agent": ua,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ru-RU,ru;q=0.9",
          Referer: "https://www.google.ru/",
          "Cache-Control": "max-age=0",
          "upgrade-insecure-requests": "1",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) continue;

      const html = await res.text();
      const result = extractFromHtml(html);

      // Accept this attempt if we got at least a title or image.
      if (result.title || result.externalImageUrl) return result;
    } catch {
      // Timeout or network error — try next UA.
    }
  }

  return {};
}

async function parseGeneric(rawUrl: string): Promise<ParsedProduct> {
  const res = await fetch(rawUrl, {
    headers: FETCH_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) return {};

  const html = await res.text();
  return extractFromHtml(html);
}

/** Extract product metadata from raw HTML via OG tags and JSON-LD. */
export function extractFromHtml(html: string): ParsedProduct {
  const $ = cheerio.load(html);

  // Prefer JSON-LD Product when available.
  const ldMatches: ParsedProduct[] = [];
  $('script[type="application/ld+json"]').each((_i, el) => {
    if (ldMatches.length) return;
    try {
      const data: unknown = JSON.parse($(el).html() ?? "");
      const product = findLdProduct(data);
      if (product) ldMatches.push(extractFromLdProduct(product));
    } catch {
      // malformed JSON — skip
    }
  });

  const ldResult = ldMatches[0];
  if (ldResult && (ldResult.title || ldResult.price !== undefined)) {
    let result = ldResult;
    // Supplement missing image from OG if JSON-LD had none.
    if (!result.externalImageUrl) {
      const ogImage = $('meta[property="og:image"]').attr("content");
      if (ogImage) result = { ...result, externalImageUrl: ogImage };
    }
    // Supplement missing price from product:price:amount if JSON-LD had none.
    if (result.price === undefined) {
      const priceAmountRaw = $('meta[property="product:price:amount"]').attr("content");
      if (priceAmountRaw) {
        const parsed = parseFloat(priceAmountRaw.replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) {
          const currencyRaw = $('meta[property="product:price:currency"]').attr("content");
          result = {
            ...result,
            price: parsed,
            currency: currencyRaw ? normalizeIsoCurrency(currencyRaw) : result.currency,
          };
        }
      }
    }
    return result;
  }

  // Fall back to OG tags + Facebook Commerce product meta tags.
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");

  // product:price:amount / product:price:currency — Facebook Commerce extension.
  let ogPrice: number | undefined;
  let ogCurrency: string | undefined;
  const priceAmountRaw = $('meta[property="product:price:amount"]').attr("content");
  if (priceAmountRaw) {
    const parsed = parseFloat(priceAmountRaw.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) {
      ogPrice = parsed;
      const currencyRaw = $('meta[property="product:price:currency"]').attr("content");
      if (currencyRaw) ogCurrency = normalizeIsoCurrency(currencyRaw);
    }
  }

  // Microdata — <span itemprop="price" content="1234"> or plain text.
  if (ogPrice === undefined) {
    const el = $('[itemprop="price"]').first();
    if (el.length) {
      const raw = el.attr("content") ?? el.text();
      if (raw) {
        const parsed = parseFloat(raw.replace(/[^\d.,]/g, "").replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) {
          ogPrice = parsed;
          const currencyEl = $('[itemprop="priceCurrency"]').first();
          const currencyRaw = currencyEl.attr("content") ?? currencyEl.text();
          if (currencyRaw) ogCurrency = normalizeIsoCurrency(currencyRaw.trim());
        }
      }
    }
  }

  return {
    title: ogTitle ? decodeEntities(ogTitle) : undefined,
    price: ogPrice,
    currency: ogCurrency,
    externalImageUrl: ogImage || undefined,
  };
}

/** Recursively find a JSON-LD node with @type === "Product". */
function findLdProduct(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findLdProduct(item);
      if (found) return found;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;
  if (obj["@type"] === "Product") return obj;

  // Handle @graph containers.
  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const found = findLdProduct(item);
      if (found) return found;
    }
  }

  return null;
}

function extractFromLdProduct(product: Record<string, unknown>): ParsedProduct {
  const title = typeof product.name === "string" ? product.name : undefined;

  let price: number | undefined;
  let currency: string | undefined;

  const offers = product.offers;
  if (offers && typeof offers === "object" && !Array.isArray(offers)) {
    const o = offers as Record<string, unknown>;
    const raw = o.price ?? o.lowPrice ?? o.highPrice;
    if (raw !== undefined && raw !== null && raw !== "") {
      const parsed = parseFloat(String(raw));
      if (!isNaN(parsed) && parsed > 0) price = parsed;
    }
    if (typeof o.priceCurrency === "string") {
      currency = normalizeIsoCurrency(o.priceCurrency);
    }
  }

  let externalImageUrl: string | undefined;
  const img = product.image;
  if (typeof img === "string") {
    externalImageUrl = img;
  } else if (Array.isArray(img) && typeof img[0] === "string") {
    externalImageUrl = img[0];
  } else if (img && typeof img === "object") {
    const imgObj = img as Record<string, unknown>;
    if (typeof imgObj.url === "string") externalImageUrl = imgObj.url;
  }

  return { title, price, currency, externalImageUrl };
}

/** Normalize a priceCurrency string to one of the app's supported codes. */
function normalizeIsoCurrency(code: string): string | undefined {
  const supported = new Set(["RUB", "USD", "EUR", "GBP", "CNY"]);
  const upper = code.trim().toUpperCase();
  return supported.has(upper) ? upper : undefined;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
