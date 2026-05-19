import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import {
  getAllUserWishlistsWithItems,
  getWishlistWithItems,
} from "@/modules/wishlist/server/items";
import { formatWishlistsAsMarkdown } from "@/modules/wishlist/export/formatter";

/**
 * GET /api/wishlist/export
 * GET /api/wishlist/export?wishlistId=<id>
 *
 * Returns a Markdown file attachment with the owner's wishlist data.
 * Without `wishlistId` — exports all wishlists.
 * With `wishlistId`  — exports that single wishlist only.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  let user: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wishlistId = request.nextUrl.searchParams.get("wishlistId");

  const today = new Date().toISOString().slice(0, 10);

  let markdown: string;

  if (wishlistId) {
    const wishlist = await getWishlistWithItems(wishlistId);

    if (!wishlist || wishlist.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    markdown = formatWishlistsAsMarkdown([wishlist], user.email, today);
  } else {
    const wishlists = await getAllUserWishlistsWithItems(user.id);
    markdown = formatWishlistsAsMarkdown(wishlists, user.email, today);
  }

  const filename = wishlistId
    ? `wishlist-${today}.md`
    : `wishlists-${today}.md`;

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
