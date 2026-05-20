import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import {
  uploadItemImage,
  deleteItemImage,
  MAX_UPLOAD_BYTES,
} from "@/modules/wishlist/server/item-image";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/items/[id]/image
 *
 * Accepts multipart/form-data with field "image".
 * Validates type and size, saves to UPLOAD_DIR, updates imageUrl in DB.
 * Returns { imageUrl: string } on success.
 */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  let user: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itemId } = await params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }

  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "no-file" }, { status: 400 });
  }

  // Guard against oversized uploads before handing off to the module.
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const result = await uploadItemImage(user.id, itemId, file);

  if (result.status === "error") {
    const statusCode =
      result.code === "item-not-found"
        ? 404
        : result.code === "too-large"
          ? 413
          : result.code === "invalid-type"
            ? 415
            : 500;
    return NextResponse.json({ error: result.code }, { status: statusCode });
  }

  return NextResponse.json({ imageUrl: result.imageUrl });
}

/**
 * DELETE /api/items/[id]/image
 *
 * Removes the image file from disk and clears imageUrl in the DB.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  let user: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itemId } = await params;

  const result = await deleteItemImage(user.id, itemId);

  if (result.status === "error") {
    const statusCode = result.code === "item-not-found" ? 404 : 500;
    return NextResponse.json({ error: result.code }, { status: statusCode });
  }

  return new NextResponse(null, { status: 204 });
}
