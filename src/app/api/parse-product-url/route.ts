import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { parseProductUrl } from "@/modules/item/parse-product-url";
import {
  saveImageToUploadDir,
  associateLocalImageWithItem,
} from "@/modules/wishlist/server/item-image";

/** Max size of a remotely fetched image we'll accept (4 MB). */
const MAX_REMOTE_IMAGE_BYTES = 4 * 1024 * 1024;

/** Timeout for downloading the product image (ms). */
const IMAGE_DOWNLOAD_TIMEOUT_MS = 10_000;

/**
 * POST /api/parse-product-url
 *
 * Body: { url: string; itemId?: string }
 *
 * Parses a marketplace product URL and returns detected metadata.
 * If `itemId` is provided, downloads and saves the image for that item,
 * returning the local imageUrl (same /uploads flow as direct upload).
 *
 * Always returns 200 with a partial result — parsing failures are silent.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let user: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: unknown; itemId?: unknown };
  try {
    body = (await request.json()) as { url?: unknown; itemId?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }

  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  if (!rawUrl) {
    return NextResponse.json({ error: "missing-url" }, { status: 400 });
  }

  // Validate it's a proper URL before making outbound requests.
  try {
    new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "invalid-url" }, { status: 400 });
  }

  const itemId = typeof body.itemId === "string" ? body.itemId : undefined;

  // Parse metadata.
  const parsed = await parseProductUrl(rawUrl);

  // Download image to disk (best-effort, works even before the item exists).
  // If itemId is present, also update the DB association immediately (edit flow).
  let localImageUrl: string | undefined;
  if (parsed.externalImageUrl) {
    localImageUrl = await downloadImageToDisk(parsed.externalImageUrl, rawUrl);
    if (localImageUrl && itemId) {
      await associateLocalImageWithItem(user.id, itemId, localImageUrl);
    }
  }

  return NextResponse.json({
    title: parsed.title,
    price: parsed.price,
    currency: parsed.currency,
    imageUrl: localImageUrl,
  });
}

/** Download an image from an external URL and save it to the uploads dir. */
async function downloadImageToDisk(
  externalUrl: string,
  pageUrl?: string,
): Promise<string | undefined> {
  // Use the product page origin as Referer so CDNs that enforce hotlink
  // protection (e.g. ir.ozon.ru expects Referer: ozon.ru) accept the request.
  let referer: string;
  try {
    referer = new URL(pageUrl ?? externalUrl).origin + "/";
  } catch {
    referer = new URL(externalUrl).origin + "/";
  }

  try {
    const res = await fetch(externalUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: referer,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(IMAGE_DOWNLOAD_TIMEOUT_MS),
    });

    if (!res.ok) return undefined;

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_REMOTE_IMAGE_BYTES) {
      return undefined;
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_REMOTE_IMAGE_BYTES) return undefined;

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return undefined;

    const result = await saveImageToUploadDir(Buffer.from(arrayBuffer), contentType);
    return result.status === "success" ? result.imageUrl : undefined;
  } catch {
    return undefined;
  }
}
